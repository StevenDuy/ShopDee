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
        // Lấy tất cả các userId có ít nhất 1 log được gắn cờ (ai_flagged)
        $flaggedUserIds = ActionLog::whereRaw("JSON_EXTRACT(payload, '$.ai_flagged') = true")
            ->pluck('user_id')
            ->unique()
            ->filter()
            ->all();

        $users = User::whereIn('id', $flaggedUserIds)
            ->where('status', '!=', 'banned')
            ->get();

        $recentFlaggedData = $users->map(function ($user) {
            // Lấy log mới nhất để hiển thị tóm tắt
            $latestLog = ActionLog::where('user_id', $user->id)
                ->whereRaw("JSON_EXTRACT(payload, '$.ai_flagged') = true")
                ->orderByDesc('id')
                ->first();

            return [
                'user_id' => $user->id,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'last_flagged_type' => $latestLog?->type,
                'last_risk_score' => $latestLog?->confidence_score * 100,
                'total_flags' => ActionLog::where('user_id', $user->id)
                    ->whereRaw("JSON_EXTRACT(payload, '$.ai_flagged') = true")
                    ->count(),
                'latest_payload' => $latestLog?->payload,
                'created_at' => $latestLog?->created_at,
            ];
        })->sortByDesc('created_at')->values();

        $blockedUsers = User::where('status', 'banned')
            ->select('id', 'name', 'email', 'ban_reason', 'updated_at')
            ->orderByDesc('updated_at')
            ->limit(20)
            ->get();

        // Thêm logic Daily Stats (7 ngày gần nhất) cho biểu đồ xu hướng
        $dailyStats = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo)->format('Y-m-d');
            $count = ActionLog::whereDate('created_at', $date)
                ->whereRaw("JSON_EXTRACT(payload, '$.ai_flagged') = true")
                ->count();
            
            return [
                'date' => now()->subDays($daysAgo)->format('M d'),
                'count' => $count
            ];
        });

        return response()->json([
            'total_flagged_users' => $users->count(),
            'flagged_users' => $recentFlaggedData,
            'blocked_users' => $blockedUsers,
            'daily_stats' => $dailyStats
        ]);
    }

    public function clearLogs(Request $request)
    {
        $userId = $request->input('user_id');
        
        if ($userId) {
            ActionLog::where('user_id', $userId)->delete();
            return response()->json(['message' => "All activity logs for User #{$userId} have been cleared."]);
        }

        ActionLog::query()->delete();
        return response()->json(['message' => 'All activity data on the system has been cleared.']);
    }

    public function metrics()
    {
        $aiUrl = env('AI_API_URL', 'http://localhost:5000');
        try {
            $response = Http::timeout(20)->get("{$aiUrl}/metrics");
            if ($response->successful()) {
                $data = $response->json();
                $flattened = array_merge(
                    ['service_status' => $data['service_status'] ?? 'online'],
                    $data['models'] ?? [],
                    ['dataset_stats' => [
                        'total_samples' => $data['dataset_info']['total_samples'] ?? 0,
                        'normal' => $data['dataset_info']['normal_samples'] ?? 0,
                        'anomaly' => $data['dataset_info']['anomaly_samples'] ?? 0,
                    ]]
                );
                return response()->json($flattened, 200);
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

        if (isset($prediction['details']['random_forest']) && isset($prediction['details']['svm'])) {
            $rfRisk = $prediction['details']['random_forest'] / 100;
            $svmRisk = $prediction['details']['svm'] / 100;
            
            // Flag if either model detects high risk (>= 70%)
            $payload['ai_flagged'] = $rfRisk >= 0.7 || $svmRisk >= 0.7;
            $payload['risk_score'] = $prediction['risk_percentage'] / 100;
            $payload['flagged_by'] = $payload['ai_flagged'] ? ($rfRisk >= 0.7 ? 'random_forest' : 'svm') : null;
        }

        $payload['simulated_fraud'] = $isFraud;
        return $payload;
    }

    protected function createSimulationLog(User $user, string $type, float $lat, float $lng, bool $isFraud, array $payload, bool $autoBlock): array
    {
        // Gửi data sang AI Service để lấy dự đoán hiện tại
        $predictionInput = array_merge([
            'user_id' => $user->id,
            'type' => $type,
            'lat' => $lat,
            'lng' => $lng,
        ], array_filter($payload, fn($key) => in_array($key, [
            'duration_ms', 'distance_jump', 'wrong_password_attempts', 'address_changes', 'click_speed_ms', 'purchase_quantity', 'purchase_value', 'click_count',
        ]), ARRAY_FILTER_USE_KEY));

        $prediction = $this->aiPredict($predictionInput);
        $payload = $this->buildPayload($payload, $prediction, $isFraud);

        // Lưu vào ActionLog để theo dõi
        $log = ActionLog::create([
            'user_id' => $user->id,
            'type' => $type,
            'lat' => $lat,
            'lng' => $lng,
            'is_anomaly' => $isFraud, // Đây là nhãn "Ground Truth" do Admin thiết lập khi giả lập
            'payload' => $payload,
        ]);

        // QUAN TRỌNG: Gửi feedback sang dữ liệu huấn luyện (Dataset) của AI
        // Để khi bấm Retrain, AI sẽ học được từ chính ca giả lập này.
        try {
            $aiUrl = env('AI_API_URL', 'http://localhost:5000');
            Http::timeout(5)->post("{$aiUrl}/api/predict", array_merge($predictionInput, [
                '_save_to_dataset' => true,
                'is_anomaly' => $isFraud ? 1 : 0
            ]));
        } catch (\Exception $e) {
            Log::warning('Could not sync simulation to AI dataset', ['error' => $e->getMessage()]);
        }

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
            'scenario' => 'required|string',
            'user_id' => 'required|integer|exists:users,id',
            'product_id' => 'nullable|integer|exists:products,id',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'duration_ms' => 'nullable|numeric',
            'distance_jump' => 'nullable|numeric',
            'wrong_password_attempts' => 'nullable|integer|min:0',
            'address_changes' => 'nullable|integer|min:0',
            'click_speed_ms' => 'nullable|integer|min:0',
            'purchase_quantity' => 'nullable|integer|min:0',
            'purchase_value' => 'nullable|numeric|min:0',
            'click_count' => 'nullable|integer|min:0',
            'auto_block' => 'boolean',
            'is_fraud' => 'boolean', // Nhãn do Admin quyết định khi bấm nút giả lập
        ]);

        try {
            $user = User::findOrFail($request->user_id);
            $product = $request->product_id ? Product::find($request->product_id) : null;
            $autoBlock = $request->boolean('auto_block');
            $isFraud = $request->boolean('is_fraud');
            
            // Lấy tọa độ mặc định nếu không gửi lên
            $lat = $request->input('lat', 10.762);
            $lng = $request->input('lng', 106.660);

            $payload = [
                'duration_ms' => $request->input('duration_ms', 5000),
                'distance_jump' => $request->input('distance_jump', 0),
                'wrong_password_attempts' => $request->input('wrong_password_attempts', 0),
                'address_changes' => $request->input('address_changes', 0),
                'click_speed_ms' => $request->input('click_speed_ms', 500),
                'purchase_quantity' => $request->input('purchase_quantity', 0),
                'purchase_value' => $request->input('purchase_value', 0),
                'click_count' => $request->input('click_count', 0),
                'scenario' => $request->scenario,
            ];

            // Xác định type dựa trên scenario
            $type = 'navigate';
            if (str_contains($request->scenario, 'login')) $type = 'login';
            if (str_contains($request->scenario, 'purchase')) $type = 'checkout';
            if (str_contains($request->scenario, 'click')) $type = 'interaction';

            $result = $this->createSimulationLog($user, $type, $lat, $lng, $isFraud, $payload, $autoBlock);

            return response()->json([
                'scenario' => $request->scenario,
                'user' => $user,
                'results' => [$result],
            ]);
        } catch (\Throwable $exception) {
            Log::error('AI simulation failed', ['error' => $exception->getMessage()]);
            return response()->json([
                'message' => 'AI simulation failed: ' . $exception->getMessage(),
            ], 500);
        }
    }
}
