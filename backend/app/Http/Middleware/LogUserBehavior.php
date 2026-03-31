<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\AI\BehaviorLogService;
use Symfony\Component\HttpFoundation\Response;

class LogUserBehavior
{
    protected $behaviorLogger;

    public function __construct(BehaviorLogService $behaviorLogger)
    {
        $this->behaviorLogger = $behaviorLogger;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Ghi log sau khi phản hồi được gửi (hoặc chuẩn bị gửi)
        if ($request->isMethod('GET') && $request->routeIs('api.products.show')) {
            $this->behaviorLogger->log('PAGE_VIEW', [
                'url' => $request->fullUrl(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
        }

        return $response;
    }
}
