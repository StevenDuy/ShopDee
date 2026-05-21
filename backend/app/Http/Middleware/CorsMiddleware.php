<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get allowed origin from env or default to production
        $frontendUrl = env('FRONTEND_URL', 'https://shopdee.io.vn');
        
        // Build the list of allowed origins
        $allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:8080',
            'http://127.0.0.1:8080',
        ];

        // Add origins from CORS_ALLOWED_ORIGINS env if specified (comma separated)
        $corsAllowed = env('CORS_ALLOWED_ORIGINS');
        if ($corsAllowed) {
            $extraOrigins = array_map('trim', explode(',', $corsAllowed));
            $allowedOrigins = array_merge($allowedOrigins, $extraOrigins);
        }

        // Add the main frontend URL and its variants
        if ($frontendUrl) {
            $allowedOrigins[] = $frontendUrl;
            
            // If it's the root domain, also allow the www version
            if (strpos($frontendUrl, 'https://shopdee.io.vn') !== false) {
                $allowedOrigins[] = 'https://www.shopdee.io.vn';
            }
            // Conversely, if it's the www version, also allow the root
            if (strpos($frontendUrl, 'https://www.shopdee.io.vn') !== false) {
                $allowedOrigins[] = 'https://shopdee.io.vn';
            }
        }

        $origin = $request->header('Origin');

        // Handle preflight (OPTIONS) requests first to ensure headers are always present
        if ($request->getMethod() === 'OPTIONS') {
            return response('', 204)
                ->header('Access-Control-Allow-Origin', in_array($origin, $allowedOrigins) ? $origin : $frontendUrl)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Socket-ID, Accept')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        if (in_array($origin, $allowedOrigins)) {
            $response->header('Access-Control-Allow-Origin', $origin)
                     ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
                     ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Socket-ID, Accept')
                     ->header('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }
}
