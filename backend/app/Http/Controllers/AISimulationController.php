<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ActionLog;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AISimulationController extends Controller
{
    public function users()
    {
        $status = request('status');
        $query = User::select('id', 'name', 'email', 'status', 'ban_reason')
            ->orderBy('id', 'asc');

        if ($status) {
            $query->where('status', $status);
        }

        $users = $query->get();

        return response()->json($users);
    }

    public function logs($userId)
    {
        $logs = ActionLog::where('user_id', $userId)
            ->orderByDesc('id')
            ->get(['id', 'user_id', 'type', 'lat', 'lng', 'is_anomaly', 'payload', 'created_at']);

        return response()->json($logs);
    }

    public function products()
    {
        $products = Product::select('id', 'title as name', 'price', 'stock_quantity as quantity', 'status')
            ->where('status', 'active')
            ->limit(50)
            ->get();

        return response()->json($products);
    }

    public function monitor()
    {
        $recentFlagged = ActionLog::whereRaw("JSON_EXTRACT(payload, '$.ai_flagged') = true")
            ->orderByDesc('id')
            ->limit(30)
            ->get(['id', 'user_id', 'type', 'payload', 'created_at']);

        $userIds = $recentFlagged->pluck('user_id')->unique()->filter()->all();
        $userMap = User::whereIn('id', $userIds)->get()->keyBy('id');

        $recentFlaggedData = $recentFlagged->filter(function ($log) use ($userMap) {
            $user = $userMap[$log->user_id] ?? null;
            return $user === null || $user->status !== 'banned';
        })->map(function ($log) use ($userMap) {
            return [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'user' => [
                    'id' => $log->user_id,
                    'name' => $userMap[$log->user_id]?->name ?? "user_{$log->user_id}",
                    'email' => $userMap[$log->user_id]?->email ?? null,
                ],
                'type' => $log->type,
                'payload' => $log->payload,
                'created_at' => $log->created_at,
            ];
        });

        $blockedUsers = User::where('status', 'banned')
            ->select('id', 'name', 'email', 'ban_reason', 'updated_at')
            ->orderByDesc('updated_at')
            ->limit(20)
            ->get();

        $totalFlagged = ActionLog::whereRaw("JSON_EXTRACT(payload, '$.ai_flagged') = true")
            ->whereIn('user_id', function ($query) {
                $query->select('id')->from('users')->where('status', '!=', 'banned');
            })->count();

        return response()->json([
            'total_flagged' => $totalFlagged,
            'recent_flagged' => $recentFlaggedData,
            'blocked_users' => $blockedUsers,
        ]);
    }

    public function metrics()
    {
        $aiUrl = env('AI_API_URL', 'http://localhost:5000');
        try {
            $response = Http::timeout(20)->get("{$aiUrl}/metrics");
            if ($response->successful()) {
                return response()->json($response->json(), 200);
            }
            throw new \Exception("AI service returned: {$response->status()}");
        } catch (\Throwable $exception) {
            Log::warning('AI metrics unavailable', ['error' => $exception->getMessage()]);
            return response()->json([
                'message' => 'AI service unavailable - please train the model first',
                'service_status' => 'offline',
            ], 503);
        }
    }

    public function train()
    {
        $aiUrl = env('AI_API_URL', 'http://localhost:5000');
        try {
            $response = Http::timeout(120)->post("{$aiUrl}/train");
            if ($response->successful()) {
                return response()->json($response->json(), 200);
            }
            throw new \Exception("AI returned: {$response->status()}");
        } catch (\Throwable $exception) {
            Log::warning('AI training failed', ['error' => $exception->getMessage()]);
            return response()->json([
                'message' => 'AI training failed - service unavailable',
                'error' => $exception->getMessage(),
            ], 503);
        }
    }

    public function retrain()
    {
        $aiUrl = env('AI_API_URL', 'http://localhost:5000');
        try {
            $response = Http::timeout(120)->post("{$aiUrl}/retrain");
            if ($response->successful()) {
                return response()->json($response->json(), 200);
            }
            throw new \Exception("AI returned: {$response->status()}");
        } catch (\Throwable $exception) {
            Log::warning('AI retrain failed', ['error' => $exception->getMessage()]);
            return response()->json([
                'message' => 'AI retraining failed - service unavailable',
                'error' => $exception->getMessage(),
            ], 503);
        }
    }

    public function autoBlock()
    {
        $flaggedIds = ActionLog::whereRaw("JSON_EXTRACT(payload, '$.ai_flagged') = true")
            ->pluck('user_id')
            ->unique()
            ->filter()
            ->all();

        $candidates = User::whereIn('id', $flaggedIds)
            ->where('status', '!=', 'banned')
            ->where('role_id', '!=', 1)
            ->get();

        foreach ($candidates as $user) {
            $user->status = 'banned';
            $user->ban_reason = 'Auto-blocked by AI monitor';
            $user->save();
        }

        return response()->json([
            'message' => 'Auto-block completed',
            'blocked_count' => $candidates->count(),
            'blocked_users' => $candidates,
        ]);
    }

    public function block(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $user = User::findOrFail($id);

        if ($user->role_id === 1) {
            return response()->json(['message' => 'Cannot block admin accounts.'], 400);
        }

        $user->status = 'banned';
        $user->ban_reason = $request->reason;
        $user->save();

        return response()->json(['message' => 'User blocked successfully.', 'user' => $user]);
    }

    public function unblock($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'active';
        $user->ban_reason = null;
        $user->save();

        return response()->json(['message' => 'User unblocked successfully.', 'user' => $user]);
    }

    protected function aiPredict(array $input): array
    {
        $aiUrl = env('AI_API_URL', 'http://localhost:5000');

        try {
            $response = Http::timeout(10)->post("{$aiUrl}/api/predict", $input);
            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('AI predict returned non-success response', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException('AI prediction returned unsuccessful response');
        } catch (\Throwable $exception) {
            Log::error('AI predict failed', ['error' => $exception->getMessage()]);
            throw $exception;
        }
    }

    protected function buildPayload(array $baseData, array $prediction, bool $isFraud): array
    {
        $payload = array_merge($baseData, ['ai_prediction' => $prediction]);

        if (isset($prediction['random_forest']['risk_percentage']) && isset($prediction['svm']['risk_percentage'])) {
            $rfRisk = $prediction['random_forest']['risk_percentage'] / 100;
            $svmRisk = $prediction['svm']['risk_percentage'] / 100;
            
            // Flag if either model detects high risk (> 70%)
            $payload['ai_flagged'] = $rfRisk >= 0.7 || $svmRisk >= 0.7;
            $payload['risk_score'] = max($rfRisk, $svmRisk);
            $payload['flagged_by'] = $payload['ai_flagged'] ? ($rfRisk >= 0.7 ? 'random_forest' : 'svm') : null;
        }

        $payload['simulated_fraud'] = $isFraud;
        return $payload;
    }

    protected function createSimulationLog(User $user, string $type, float $lat, float $lng, bool $isFraud, array $payload, bool $autoBlock): array
    {
        $prediction = $this->aiPredict(array_merge([
            'user_id' => $user->id,
            'type' => $type,
            'lat' => $lat,
            'lng' => $lng,
        ], array_filter($payload, fn($key) => in_array($key, [
            'duration_ms', 'distance_jump', 'wrong_password_attempts', 'address_changes', 'click_speed_ms', 'purchase_quantity', 'purchase_value', 'click_count',
        ]), ARRAY_FILTER_USE_KEY)));

        $payload = $this->buildPayload($payload, $prediction, $isFraud);

        $log = ActionLog::create([
            'user_id' => $user->id,
            'type' => $type,
            'lat' => $lat,
            'lng' => $lng,
            'is_anomaly' => $isFraud || ($payload['ai_flagged'] ?? false),
            'payload' => $payload,
        ]);

        $autoBlocked = false;
        $blockReason = null;

        if (($payload['ai_flagged'] ?? false) && $autoBlock && $user->role_id !== 1 && $user->status !== 'banned') {
            $user->status = 'banned';
            $user->ban_reason = 'Auto-blocked by AI (' . ($payload['flagged_by'] ?? 'unknown') . ')';
            $user->save();
            $autoBlocked = true;
            $blockReason = $user->ban_reason;
        }

        return [
            'log' => $log,
            'prediction' => $prediction,
            'flagged' => $payload['ai_flagged'] ?? false,
            'user_status' => $user->status,
            'auto_blocked' => $autoBlocked,
            'block_reason' => $blockReason,
        ];
    }

    public function simulate(Request $request)
    {
        $request->validate([
            'scenario' => 'required|string|in:bot_click,login_fail,location_change,bulk_purchase,high_value_purchase,custom',
            'user_id' => 'required|integer|exists:users,id',
            'product_id' => 'nullable|integer|exists:products,id',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'duration_ms' => 'nullable|numeric',
            'distance_jump' => 'nullable|numeric',
            'wrong_password_attempts' => 'nullable|integer|min:0',
            'address_changes' => 'nullable|integer|min:0',
            'click_speed_ms' => 'nullable|integer|min:0',
            'purchase_quantity' => 'nullable|integer|min:0',
            'purchase_value' => 'nullable|numeric|min:0',
            'click_count' => 'nullable|integer|min:0',
            'location_changes' => 'nullable|integer|min:1|max:20',
            'interval_ms' => 'nullable|integer|min:100',
            'auto_block' => 'boolean',
            'is_fraud' => 'boolean',
        ]);

        try {
            $user = User::findOrFail($request->user_id);
            $product = $request->product_id ? Product::find($request->product_id) : null;
            $scenario = $request->scenario;
            $autoBlock = $request->boolean('auto_block');
            $results = [];

            switch ($scenario) {
                case 'bot_click':
                    $clickCount = max(1, $request->input('click_count', 15));
                    $clickSpeed = max(50, $request->input('click_speed_ms', 120));
                    $payload = [
                        'duration_ms' => $clickSpeed * $clickCount / 2,
                        'distance_jump' => 0,
                        'click_speed_ms' => $clickSpeed,
                        'click_count' => $clickCount,
                        'wrong_password_attempts' => 0,
                        'address_changes' => 0,
                        'purchase_quantity' => 0,
                        'purchase_value' => 0,
                        'scenario' => 'bot_click',
                    ];

                    $results[] = $this->createSimulationLog($user, 'view_product', $request->lat, $request->lng, true, $payload, $autoBlock);
                    break;

                case 'login_fail':
                    $attempts = max(1, $request->input('wrong_password_attempts', 5));
                    $payload = [
                        'duration_ms' => max(100, $attempts * 250),
                        'distance_jump' => 0,
                        'wrong_password_attempts' => $attempts,
                        'address_changes' => 0,
                        'click_speed_ms' => 0,
                        'purchase_quantity' => 0,
                        'purchase_value' => 0,
                        'scenario' => 'login_fail',
                    ];

                    $results[] = $this->createSimulationLog($user, 'login', $request->lat, $request->lng, $attempts >= 5, $payload, $autoBlock);
                    break;

                case 'location_change':
                    $moves = min(10, $request->input('location_changes', 4));
                    $interval = max(100, $request->input('interval_ms', 800));

                    for ($i = 0; $i < $moves; $i++) {
                        $lat = $request->lat + mt_rand(-20, 20) / 100.0;
                        $lng = $request->lng + mt_rand(-20, 20) / 100.0;
                        $distanceJump = mt_rand(200, 4000);
                        $payload = [
                            'duration_ms' => max(100, $interval),
                            'distance_jump' => $distanceJump,
                            'wrong_password_attempts' => 0,
                            'address_changes' => 0,
                            'click_speed_ms' => 0,
                            'purchase_quantity' => 0,
                            'purchase_value' => 0,
                            'location_change_step' => $i + 1,
                            'location_changes' => $moves,
                            'interval_ms' => $interval,
                            'scenario' => 'location_change',
                        ];
                        $results[] = $this->createSimulationLog($user, 'login', $lat, $lng, true, $payload, $autoBlock);
                    }
                    break;

                case 'bulk_purchase':
                    $quantity = max(1, $request->input('purchase_quantity', 8));
                    $purchaseValue = $request->input('purchase_value');

                    if (!$purchaseValue && $product) {
                        $purchaseValue = $product->price * $quantity;
                    }

                    $payload = [
                        'duration_ms' => max(100, $quantity * 120),
                        'distance_jump' => 0,
                        'wrong_password_attempts' => 0,
                        'address_changes' => 0,
                        'click_speed_ms' => 0,
                        'purchase_quantity' => $quantity,
                        'purchase_value' => $purchaseValue,
                        'product_id' => $product?->id,
                        'product_name' => $product?->name,
                        'scenario' => 'bulk_purchase',
                    ];

                    $results[] = $this->createSimulationLog($user, 'checkout', $request->lat, $request->lng, $quantity >= 8 || $purchaseValue >= 2000, $payload, $autoBlock);
                    break;

                case 'high_value_purchase':
                    $purchaseValue = max(1000, $request->input('purchase_value', 5000));
                    $quantity = max(1, $request->input('purchase_quantity', 1));

                    $payload = [
                        'duration_ms' => max(100, $quantity * 200),
                        'distance_jump' => 0,
                        'wrong_password_attempts' => 0,
                        'address_changes' => 0,
                        'click_speed_ms' => 0,
                        'purchase_quantity' => $quantity,
                        'purchase_value' => $purchaseValue,
                        'scenario' => 'high_value_purchase',
                    ];

                    $results[] = $this->createSimulationLog($user, 'checkout', $request->lat, $request->lng, $purchaseValue >= 3000, $payload, $autoBlock);
                    break;

                default:
                    $payload = [
                        'duration_ms' => $request->input('duration_ms', 0),
                        'distance_jump' => $request->input('distance_jump', 0),
                        'wrong_password_attempts' => $request->input('wrong_password_attempts', 0),
                        'address_changes' => $request->input('address_changes', 0),
                        'click_speed_ms' => $request->input('click_speed_ms', 0),
                        'purchase_quantity' => $request->input('purchase_quantity', 0),
                        'purchase_value' => $request->input('purchase_value', 0),
                        'click_count' => $request->input('click_count', 0),
                        'scenario' => 'custom',
                    ];

                    $results[] = $this->createSimulationLog(
                        $user,
                        $request->type,
                        $request->lat,
                        $request->lng,
                        $request->input('is_fraud', false),
                        $payload,
                        $autoBlock
                    );
                    break;
            }

            return response()->json([
                'scenario' => $scenario,
                'user' => $user,
                'results' => $results,
            ]);
        } catch (\Throwable $exception) {
            Log::error('AI simulation failed', ['error' => $exception->getMessage()]);
            return response()->json([
                'message' => 'AI simulation failed. Ensure AI service is trained and available.',
            ], 503);
        }
    }
}
