<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\ActionLog;
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
        // 1. Kiểm tra chặn toàn cục (Stealth Block) đối với User đã bị banned
        if (Auth::check() && Auth::user()->status === 'banned') {
            return response()->json([
                'message' => 'Network error, please check your connection and try again later.',
                'error_code' => 'ERR_CONNECTION_RESET'
            ], 503);
        }

        // 2. Bỏ qua quét AI đối với Admin
        if (Auth::check() && Auth::user()->role_id === 1) {
            return $next($request);
        }

        $path = $request->path();
        
        // Bỏ qua các log chính của AI để tránh vòng lặp hoặc spam
        if (str_contains($path, 'ai/') || str_contains($path, 'sanctum/')) {
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
        $prediction = null;

        if ($isSensitive) {
            $prediction = $this->getAIPrediction($request, $type, $telemetry);
            
            if ($prediction) {
                $riskScore = $prediction['risk_percentage'] ?? 0;

                // Threshold 85%+: Stealth Block (Báo lỗi mạng)
                if ($riskScore >= 85) {
                    $this->saveLog($request, $type, $telemetry, $riskScore, true, 'blocked');
                    
                    return response()->json([
                        'message' => 'Lỗi kết nối mạng, vui lòng kiểm tra lại đường truyền và thử lại sau.',
                        'error_code' => 'ERR_CONNECTION_RESET'
                    ], 503);
                }

                // Threshold 70% - 84%: Flagged (Gắn cờ theo dõi ngầm)
                if ($riskScore >= 70) {
                    $request->merge(['_ai_flagged' => true]);
                    $this->saveLog($request, $type, $telemetry, $riskScore, true, 'flagged');
                }
            }
        }

        $response = $next($request);

        // Sau khi request xong, nếu chưa ghi log (với các request bình thường) thì ghi log
        if (!$isSensitive && $response->status() >= 200 && $response->status() < 300) {
            $this->saveLog($request, $type, $telemetry, $prediction['risk_percentage'] ?? 0, false, 'normal');
        }

        return $response;
    }

    protected function getActionType(Request $request, $path)
    {
        if (str_contains($path, 'login')) return 'login';
        if (str_contains($path, 'checkout')) return 'checkout';
        if (str_contains($path, 'cart')) return 'interaction';
        return $request->isMethod('POST') ? 'interaction' : 'navigate';
    }

    protected function getAIPrediction(Request $request, $type, $telemetry)
    {
        try {
            $aiUrl = env('AI_API_URL', 'http://localhost:5000');
            $payload = array_merge([
                'user_id' => Auth::id() ?? 0,
                'type' => $type,
                'lat' => $request->header('X-App-Lat', 10.762),
                'lng' => $request->header('X-App-Lng', 106.660),
                'ip' => $request->ip(),
                'user_agent' => $request->header('User-Agent'),
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

    protected function saveLog(Request $request, $type, $telemetry, $score, $isAnomaly, $level)
    {
        try {
            ActionLog::create([
                'user_id' => Auth::id(),
                'type' => $type,
                'lat' => $request->header('X-App-Lat', 10.762),
                'lng' => $request->header('X-App-Lng', 106.660),
                'is_anomaly' => $isAnomaly,
                'confidence_score' => $score / 100,
                'payload' => array_merge([
                    'path' => $request->path(),
                    'method' => $request->method(),
                    'ip' => $request->ip(),
                    'risk_level' => $level,
                    'user_agent' => $request->header('User-Agent'),
                ], $telemetry)
            ]);
        } catch (\Exception $e) {
            Log::error("AI Middleware Logging Error: " . $e->getMessage());
        }
    }
}
