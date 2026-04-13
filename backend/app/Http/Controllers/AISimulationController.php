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
            ->get(['id', 'user_id', 'type', 'path', 'prev_path', 'nav_time_ms', 'distance_km', 'lat', 'lng', 'is_anomaly', 'payload', 'created_at']);

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
            ->select('id', 'name', 'email', 'status', 'ban_reason', 'updated_at')
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

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        if (!$lat1 || !$lon1 || !$lat2 || !$lon2) return 0;
        $earthRadius = 6371; // km
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return $earthRadius * $c;
    }

    public function storeLog(Request $request)
    {
        $user = auth('sanctum')->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $data = $request->validate([
            'type' => 'required|string',
            'path' => 'nullable|string',
            'prev_path' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'duration_ms' => 'nullable|numeric',
            'nav_time_ms' => 'nullable|numeric',
            'click_speed_ms' => 'nullable|numeric',
            'wrong_password_attempts' => 'nullable|integer',
            'purchase_value' => 'nullable|numeric',
            'payload' => 'nullable|array',
        ]);

        // Tính khoảng cách di chuyển từ lần cuối
        $distanceKm = 0;
        $lastLog = ActionLog::where('user_id', $user->id)
            ->whereNotNull('lat')
            ->orderByDesc('id')
            ->first();
        if ($lastLog && isset($data['lat']) && isset($data['lng'])) {
            $distanceKm = $this->calculateDistance($lastLog->lat, $lastLog->lng, $data['lat'], $data['lng']);
        }

        // Lấy thông tin lịch sử mua hàng
        $avgPurchaseValue = \App\Models\Order::where('customer_id', $user->id)->avg('total_amount') ?: 0;

        $log = ActionLog::create(array_merge($data, [
            'user_id' => $user->id,
            'distance_km' => $distanceKm,
            'avg_purchase_value' => $avgPurchaseValue,
            'is_fraud_labeled' => false, // Vì đây là log thật của người dùng
        ]));

        // Kiểm tra AI thời gian thực
        try {
            $prediction = $this->aiPredict([
                'user_id' => $user->id,
                'type' => $data['type'],
                'lat' => $data['lat'] ?? 0,
                'lng' => $data['lng'] ?? 0,
                'duration_ms' => $data['duration_ms'] ?? 0,
                'distance_km' => $distanceKm,
                'wrong_password_attempts' => $data['wrong_password_attempts'] ?? 0,
                'click_speed_ms' => $data['click_speed_ms'] ?? 0,
                'purchase_value' => $data['purchase_value'] ?? 0,
            ]);

            $log->update([
                'confidence_score' => $prediction['risk_percentage'] / 100,
                'is_anomaly' => $prediction['is_anomaly'],
                'payload' => array_merge($data['payload'] ?? [], [
                    'ai_flagged' => $prediction['is_anomaly'] ?? false,
                    'ai_prediction' => $prediction
                ])
            ]);

            // Logic tự động chặn nếu rủi ro quá cao (>95% và không phải admin)
            if ($log->confidence_score > 0.95 && $user->role_id !== 1 && $user->status !== 'banned') {
                $user->update([
                    'status' => 'banned',
                    'ban_reason' => 'Automatically blocked by AI security (Confidence: ' . round($prediction['risk_percentage'], 2) . '%)'
                ]);
            }

            return response()->json([
                'success' => true,
                'risk_score' => $log->confidence_score,
                'is_anomaly' => $log->is_anomaly,
                'banned' => $user->status === 'banned'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => true, 'message' => 'Log saved, AI service unavailable']);
        }
    }

    protected function aiPredict(array $input): array
    {
        $aiUrl = env('AI_API_URL', 'http://localhost:5000');
        try {
            $response = Http::timeout(10)->post("{$aiUrl}/api/predict", $input);
            if ($response->successful()) {
                return $response->json();
            }
            throw new \RuntimeException('AI service error');
        } catch (\Exception $e) {
            Log::error('AI Predict Failure', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    protected function createSimulationLog(User $user, string $type, float $lat, float $lng, bool $isFraud, array $payload, bool $autoBlock): array
    {
        // Gửi data sang AI Service để lấy dự đoán
        $predictionInput = array_merge([
            'user_id' => $user->id,
            'type' => $type,
            'lat' => $lat,
            'lng' => $lng,
            'distance_km' => $payload['distance_km'] ?? 0,
        ], array_intersect_key($payload, array_flip([
            'duration_ms', 'wrong_password_attempts', 'click_speed_ms', 'purchase_value'
        ])));

        $prediction = $this->aiPredict($predictionInput);
        
        $log = ActionLog::create(array_merge($payload, [
            'user_id' => $user->id,
            'type' => $type,
            'lat' => $lat,
            'lng' => $lng,
            'is_anomaly' => $prediction['is_anomaly'],
            'is_fraud_labeled' => $isFraud,
            'confidence_score' => $prediction['risk_percentage'] / 100,
            'payload' => array_merge($payload, [
                'ai_prediction' => $prediction,
                'ai_flagged' => ($prediction['is_anomaly'] || $isFraud) // Quan trọng để hiện bên Monitor
            ])
        ]));

        // Đồng bộ ngược lại dataset AI nếu Admin bấm gán nhãn
        try {
            $aiUrl = env('AI_API_URL', 'http://localhost:5000');
            Http::timeout(5)->post("{$aiUrl}/api/predict", array_merge($predictionInput, [
                '_save_to_dataset' => true,
                'is_anomaly' => $isFraud ? 1 : 0
            ]));
        } catch (\Exception $e) { /* Ignore */ }

        if ($log->is_anomaly && $autoBlock && $user->role_id !== 1 && $user->status !== 'banned') {
            $user->update([
                'status' => 'banned',
                'ban_reason' => 'Simulated Auto-block by AI'
            ]);
        }

        return [
            'log' => $log,
            'prediction' => $prediction,
            'user_status' => $user->status
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
            'distance_km' => 'nullable|numeric',
            'duration_ms' => 'nullable|numeric',
            'wrong_password_attempts' => 'nullable|integer',
            'click_speed_ms' => 'nullable|integer',
            'purchase_value' => 'nullable|numeric',
            'auto_block' => 'boolean',
            'is_fraud' => 'boolean',
            'path' => 'nullable|string',
            'prev_path' => 'nullable|string',
            'nav_time_ms' => 'nullable|numeric',
        ]);

        $user = User::findOrFail($request->user_id);
        $isFraud = $request->boolean('is_fraud');
        $autoBlock = $request->boolean('auto_block');

        $type = 'navigate';
        if (str_contains($request->scenario, 'login')) $type = 'login';
        if (str_contains($request->scenario, 'purchase')) $type = 'checkout';
        if (str_contains($request->scenario, 'click')) $type = 'interaction';

        $payload = $request->only([
            'duration_ms', 'distance_km', 'wrong_password_attempts', 
            'click_speed_ms', 'purchase_value', 'path', 'prev_path', 'nav_time_ms'
        ]);
        $payload['scenario'] = $request->scenario;

        $result = $this->createSimulationLog($user, $type, $request->input('lat', 10.762), $request->input('lng', 106.660), $isFraud, $payload, $autoBlock);

        return response()->json($result);
    }
}
