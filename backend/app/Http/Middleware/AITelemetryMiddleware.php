<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\ActionLog;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AITelemetryMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Lấy user trực tiếp qua Sanctum thay vì Auth::check() (do đây là global middleware chạy trước web session)
        $user = auth('sanctum')->user();

        // 1. Chặn thực tế đối với User đã bị banned (Không giả mạo lỗi mạng)
        if ($user && $user->status === 'banned') {
            return response()->json([
                'message' => 'Tài khoản của bạn đã bị khóa do vi phạm chính sách bảo mật của ShopDee.',
                'reason' => $user->ban_reason,
                'status' => 'banned'
            ], 403);
        }

        // 2. Bỏ qua quét AI đối với Admin
        if ($user && $user->role_id === 1) {
            return $next($request);
        }

        $path = $request->path();
        
        // Bỏ qua log API Background, Socket, GET thông thường để tập trung ghi Log Frontend Navigation
        if (str_contains($path, 'ai/') || str_contains($path, 'sanctum/') || str_contains($path, 'broadcasting') || str_contains($path, 'notifications') || $request->isMethod('GET')) {
            return $next($request);
        }

        // Kiểm tra xem đây có phải là hành động nhạy cảm cần quét AI ngay lập tức không
        $isSensitive = $request->isMethod('POST') && (
            str_contains($path, 'login') || 
            str_contains($path, 'checkout') || 
            str_contains($path, 'payment') || 
            str_contains($path, 'cart')
        );

        $type = $this->getActionType($request, $path);
        $telemetry = $request->input('_telemetry', []);

        if ($isSensitive) {
            $prediction = $this->getAIPrediction($request, $type, $telemetry);
            
            if ($prediction) {
                $riskScore = $prediction['risk_percentage'] ?? 0;

                // Threshold 95%+: Tự động chặn ngay lập tức (Chặn thật)
                if ($riskScore >= 95) {
                    $userToBan = auth('sanctum')->user();
                    if ($userToBan && $userToBan->role_id !== 1) {
                        $userToBan->update([
                            'status' => 'banned',
                            'ban_reason' => 'Automatically blocked by AI security (Real-time risk: ' . round($riskScore, 2) . '%)'
                        ]);
                    }

                    $this->saveLog($request, $type, $telemetry, $riskScore, true);
                    
                    return response()->json([
                        'message' => 'Hành động của bạn bị từ chối do phát hiện dấu hiệu bất thường. Tài khoản của bạn đã bị tạm khóa.',
                        'risk_score' => $riskScore
                    ], 403);
                }

                // Threshold 70% - 94%: Ghi log bất thường
                if ($riskScore >= 70) {
                    $this->saveLog($request, $type, $telemetry, $riskScore, true);
                }
            }
        }

        $response = $next($request);

        return $response;
    }

    protected function getActionType(Request $request, $path)
    {
        if (str_contains($path, 'login')) return 'login';
        if (str_contains($path, 'checkout')) return 'checkout';
        if (str_contains($path, 'orders')) return 'checkout';
        return $request->isMethod('POST') ? 'interaction' : 'navigate';
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        if (!$lat1 || !$lon1 || !$lat2 || !$lon2) return 0;
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return $earthRadius * $c;
    }

    protected function getAIPrediction(Request $request, $type, $telemetry)
    {
        try {
            $aiUrl = env('AI_API_URL', 'http://localhost:5000');
            $payload = array_merge([
                'user_id' => auth('sanctum')->id() ?? 0,
                'type' => $type,
                'lat' => $request->header('X-App-Lat', 10.762),
                'lng' => $request->header('X-App-Lng', 106.660),
            ], $telemetry);

            $response = Http::timeout(2)->post("{$aiUrl}/api/predict", $payload);
            
            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::error("AI Middleware Prediction Error: " . $e->getMessage());
        }
        return null;
    }

    protected function saveLog(Request $request, $type, $telemetry, $score, $isAnomaly)
    {
        try {
            $user = auth('sanctum')->user();
            $lat = $request->header('X-App-Lat', $telemetry['lat'] ?? 10.762);
            $lng = $request->header('X-App-Lng', $telemetry['lng'] ?? 106.660);

            $distanceKm = 0;
            if ($user) {
                $lastLog = ActionLog::where('user_id', $user->id)
                    ->whereNotNull('lat')
                    ->orderByDesc('id')
                    ->first();
                if ($lastLog) {
                    $distanceKm = $this->calculateDistance($lastLog->lat, $lastLog->lng, $lat, $lng);
                }
            }

            $avgPurchaseValue = $user ? Order::where('customer_id', $user->id)->avg('total_amount') : 0;

            ActionLog::create([
                'user_id' => $user ? $user->id : 0,
                'type' => $type,
                'path' => $request->path(),
                'prev_path' => $telemetry['prev_path'] ?? null,
                'nav_time_ms' => $telemetry['nav_time_ms'] ?? null,
                'lat' => $lat,
                'lng' => $lng,
                'duration_ms' => $telemetry['duration_ms'] ?? 0,
                'wrong_password_attempts' => $telemetry['wrong_password_attempts'] ?? 0,
                'purchase_value' => $telemetry['purchase_value'] ?? 0,
                'avg_purchase_value' => $avgPurchaseValue,
                'distance_km' => $distanceKm,
                'is_anomaly' => $isAnomaly,
                'confidence_score' => $score / 100,
                'payload' => $telemetry
            ]);
        } catch (\Exception $e) {
            Log::error("AI Middleware Logging Error: " . $e->getMessage());
        }
    }
}
