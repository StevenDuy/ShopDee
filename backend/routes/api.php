<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DBTestController;
use App\Http\Controllers\Customer\ProductController as CustomerProductController;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/test-broadcast', [AuthController::class, 'testBroadcast']);

// --- OTP & PASSWORD RECOVERY ---
use App\Http\Controllers\Auth\OtpController;
Route::post('/auth/otp/send', [OtpController::class, 'sendOtp']);
Route::post('/auth/otp/verify', [OtpController::class, 'verifyOtp']);
Route::post('/auth/password/reset', [OtpController::class, 'resetPassword']);

// --- SOCIAL AUTH ROUTES ---
Route::get('/auth/google', [\App\Http\Controllers\Auth\SocialController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [\App\Http\Controllers\Auth\SocialController::class, 'handleGoogleCallback']);
Route::post('/auth/google/register', [\App\Http\Controllers\Auth\SocialController::class, 'completeGoogleRegistration']);

// Phase 3: Database Relationship Testing Endpoints
Route::post('/db-test/seed', [DBTestController::class, 'seed']);
Route::get('/db-test/relationships', [DBTestController::class, 'relationships']);

// Phase 4: Public Product & Category Endpoints
Route::prefix('products')->group(function () {
    Route::get('/', [CustomerProductController::class, 'index']);
    Route::get('/categories', [CustomerProductController::class, 'categories']);
    Route::get('/{slug}', [CustomerProductController::class, 'show']);
    Route::get('/{id}/reviews', [CustomerProductController::class, 'reviews']);
});

use App\Http\Controllers\Customer\SellerController;
Route::get('/shop/{id}', [SellerController::class, 'show']);
Route::get('/shop/{id}/products', [SellerController::class, 'products']);
Route::get('/banners', [\App\Http\Controllers\Admin\BannerController::class, 'index']);

use App\Http\Controllers\Customer\OrderController;
use App\Http\Controllers\Customer\ProfileController;
use App\Http\Controllers\Customer\ChatController;
use App\Http\Controllers\Customer\NotificationController;
use App\Http\Controllers\Customer\ReviewController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        $user = $request->user()->load('role');
        return response()->json($user);
    });

    // Orders
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/my', [OrderController::class, 'myOrders']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::put('/orders/{id}/receive', [OrderController::class, 'confirmReceived']);

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::get('/reviews/check-eligibility/{orderItemId}', [ReviewController::class, 'checkEligibility']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/change-password', [ProfileController::class, 'changePassword']);
    Route::post('/profile/change-email', [AuthController::class, 'changeEmail']);

    // Addresses
    Route::get('/profile/addresses', [ProfileController::class, 'addresses']);
    Route::post('/profile/addresses', [ProfileController::class, 'storeAddress']);
    Route::put('/profile/addresses/{id}', [ProfileController::class, 'updateAddress']);
    Route::delete('/profile/addresses/{id}', [ProfileController::class, 'deleteAddress']);
    
    // Chat
    Route::get('/chat/conversations', [ChatController::class, 'conversations']);
    Route::get('/chat/users', [ChatController::class, 'searchUsers']);
    Route::post('/chat/start', [ChatController::class, 'startConversation']);
    Route::get('/chat/shop-products/{shopId}', [ChatController::class, 'shopProducts']);
    Route::get('/chat/{id}', [ChatController::class, 'messages']);
    Route::post('/chat/{id}', [ChatController::class, 'sendMessage']);
    Route::delete('/chat/conversations/{id}', [ChatController::class, 'destroyConversation']);

    // Notifications
    Route::get('/notifications/unread-counts', [NotificationController::class, 'unreadCounts']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications', [\App\Http\Controllers\Admin\NotificationController::class, 'store']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // --- SELLER ROUTES ---
    Route::prefix('seller')->group(function () {
        Route::get('/products', [\App\Http\Controllers\Seller\ProductController::class, 'index']);
        Route::post('/products', [\App\Http\Controllers\Seller\ProductController::class, 'store']);
        Route::get('/products/{id}', [\App\Http\Controllers\Seller\ProductController::class, 'show']);
        Route::put('/products/{id}', [\App\Http\Controllers\Seller\ProductController::class, 'update']);
        Route::delete('/products/{id}', [\App\Http\Controllers\Seller\ProductController::class, 'destroy']);

        // Categories
        Route::post('/categories', [\App\Http\Controllers\Seller\CategoryController::class, 'store']);

        // Product Media
        Route::post('/products/{productId}/media', [\App\Http\Controllers\Seller\ProductMediaController::class, 'store']);
        Route::delete('/products/{productId}/media/{mediaId}', [\App\Http\Controllers\Seller\ProductMediaController::class, 'destroy']);
        Route::put('/products/{productId}/media/{mediaId}/primary', [\App\Http\Controllers\Seller\ProductMediaController::class, 'setPrimary']);

        // Product Options
        Route::get('/products/{productId}/options', [\App\Http\Controllers\Seller\ProductOptionController::class, 'index']);
        Route::post('/products/{productId}/options/sync', [\App\Http\Controllers\Seller\ProductOptionController::class, 'sync']);

        // Orders
        Route::get('/orders', [\App\Http\Controllers\Seller\OrderController::class, 'index']);
        Route::get('/orders/{id}', [\App\Http\Controllers\Seller\OrderController::class, 'show']);
        Route::put('/orders/{id}/status', [\App\Http\Controllers\Seller\OrderController::class, 'updateStatus']);

        // Dashboard Stats
        Route::get('/dashboard', [\App\Http\Controllers\Seller\DashboardController::class, 'stats']);

        // Finance
        Route::get('/finance', [\App\Http\Controllers\Seller\FinanceController::class, 'index']);
        Route::post('/finance/withdraw', [\App\Http\Controllers\Seller\FinanceController::class, 'withdraw']);

        // Reviews
        Route::get('/reviews', [\App\Http\Controllers\Seller\ReviewController::class, 'index']);
    });

    // --- ADMIN ROUTES ---
    Route::prefix('admin')->group(function () {
        // Dashboard Stats
        Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'stats']);

        // Users
        Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index']);
        Route::get('/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'show']);
        Route::put('/users/{id}/ban', [\App\Http\Controllers\Admin\UserController::class, 'ban']);
        Route::put('/users/{id}/unban', [\App\Http\Controllers\Admin\UserController::class, 'unban']);
        Route::delete('/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'destroy']);

        // Products (Global Management)
        Route::get('/products', [\App\Http\Controllers\Admin\ProductController::class, 'index']);
        Route::get('/products/{id}', [\App\Http\Controllers\Admin\ProductController::class, 'show']);
        Route::put('/products/{id}/ban', [\App\Http\Controllers\Admin\ProductController::class, 'ban']);
        Route::put('/products/{id}/unban', [\App\Http\Controllers\Admin\ProductController::class, 'unban']);
        Route::delete('/products/{id}', [\App\Http\Controllers\Admin\ProductController::class, 'destroy']);

        // Reports (Keep moderation reports)
        Route::get('/moderation/reports', [\App\Http\Controllers\Admin\ModerationController::class, 'reports']);
        Route::put('/moderation/reports/{id}', [\App\Http\Controllers\Admin\ModerationController::class, 'updateReportStatus']);

        // Banners
        Route::get('/banners/search-products', [\App\Http\Controllers\Admin\BannerController::class, 'searchProducts']);
        Route::get('/banners', [\App\Http\Controllers\Admin\BannerController::class, 'index']);
        Route::post('/banners', [\App\Http\Controllers\Admin\BannerController::class, 'store']);
        Route::get('/banners/{id}', [\App\Http\Controllers\Admin\BannerController::class, 'show']);
        Route::put('/banners/{id}', [\App\Http\Controllers\Admin\BannerController::class, 'update']);
        Route::delete('/banners/{id}', [\App\Http\Controllers\Admin\BannerController::class, 'destroy']);

        // Admin Settings
        Route::get('/settings', [\App\Http\Controllers\Admin\SystemConfigController::class, 'index']);
        Route::put('/settings', [\App\Http\Controllers\Admin\SystemConfigController::class, 'update']);

        // Categories
        Route::get('/categories', [\App\Http\Controllers\Admin\CategoryController::class, 'index']);
        Route::post('/categories', [\App\Http\Controllers\Admin\CategoryController::class, 'store']);
        Route::put('/categories/{id}', [\App\Http\Controllers\Admin\CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [\App\Http\Controllers\Admin\CategoryController::class, 'destroy']);
    });


    // --- PROXY ROUTES (To handle Map API CORS/Headers) ---
    Route::prefix('proxy')->group(function () {
        Route::get('/search', [ProfileController::class, 'proxySearch']);
        Route::get('/reverse', [ProfileController::class, 'proxyReverse']);
    });

    // --- AI SIMULATION ---
    Route::get('/ai/users', [\App\Http\Controllers\AISimulationController::class, 'users']);
    Route::get('/ai/users/{id}/logs', [\App\Http\Controllers\AISimulationController::class, 'logs']);
    Route::get('/ai/products', [\App\Http\Controllers\AISimulationController::class, 'products']);
    Route::get('/ai/monitor', [\App\Http\Controllers\AISimulationController::class, 'monitor']);
    Route::get('/ai/metrics', [\App\Http\Controllers\AISimulationController::class, 'metrics']);
    Route::post('/ai/logs', [\App\Http\Controllers\AISimulationController::class, 'storeLog']);
    Route::post('/ai/train', [\App\Http\Controllers\AISimulationController::class, 'train']);
    Route::post('/ai/retrain', [\App\Http\Controllers\AISimulationController::class, 'retrain']);
    Route::post('/ai/simulate', [\App\Http\Controllers\AISimulationController::class, 'simulate']);
    Route::delete('/ai/logs', [\App\Http\Controllers\AISimulationController::class, 'clearLogs']);
    Route::post('/ai/auto-block', [\App\Http\Controllers\AISimulationController::class, 'autoBlock']);
    Route::post('/ai/users/{id}/block', [\App\Http\Controllers\AISimulationController::class, 'block']);
    Route::post('/ai/users/{id}/unblock', [\App\Http\Controllers\AISimulationController::class, 'unblock']);
    Route::post('/ai/simulate', [\App\Http\Controllers\AISimulationController::class, 'simulate']);
});



