<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DBTestController;
use App\Http\Controllers\Customer\ProductController as CustomerProductController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/test-broadcast', [AuthController::class, 'testBroadcast']);

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

use App\Http\Controllers\Customer\OrderController;
use App\Http\Controllers\Customer\ProfileController;
use App\Http\Controllers\Customer\ChatController;
use App\Http\Controllers\Customer\NotificationController;

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

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/change-password', [ProfileController::class, 'changePassword']);

    // Addresses
    Route::get('/profile/addresses', [ProfileController::class, 'addresses']);
    Route::post('/profile/addresses', [ProfileController::class, 'storeAddress']);
    Route::put('/profile/addresses/{id}', [ProfileController::class, 'updateAddress']);
    Route::delete('/profile/addresses/{id}', [ProfileController::class, 'deleteAddress']);
    
    // Chat
    Route::get('/chat/conversations', [ChatController::class, 'conversations']);
    Route::get('/chat/users', [ChatController::class, 'searchUsers']);
    Route::post('/chat/start', [ChatController::class, 'startConversation']);
    Route::get('/chat/{id}', [ChatController::class, 'messages']);
    Route::post('/chat/{id}', [ChatController::class, 'sendMessage']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications', [\App\Http\Controllers\Admin\NotificationController::class, 'store']);
    Route::delete('/notifications/{id}', [\App\Http\Controllers\Admin\NotificationController::class, 'destroy']);
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
    });

    // --- ADMIN ROUTES ---
    Route::prefix('admin')->group(function () {
        // Dashboard Stats
        Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'stats']);

        // Users
        Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index']);
        Route::get('/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'show']);
        Route::delete('/users/{id}', [\App\Http\Controllers\Admin\UserController::class, 'destroy']);

        // Moderation
        Route::get('/moderation/products', [\App\Http\Controllers\Admin\ModerationController::class, 'products']);
        Route::put('/moderation/products/{id}/status', [\App\Http\Controllers\Admin\ModerationController::class, 'updateProductStatus']);
        Route::delete('/moderation/products/{id}', [\App\Http\Controllers\Admin\ModerationController::class, 'deleteProduct']);

        // System Config
        Route::get('/settings', [\App\Http\Controllers\Admin\SystemConfigController::class, 'index']);
        Route::put('/settings', [\App\Http\Controllers\Admin\SystemConfigController::class, 'update']);
    });

    // --- PROXY ROUTES (To handle Map API CORS/Headers) ---
    Route::prefix('proxy')->group(function () {
        Route::get('/search', [ProfileController::class, 'proxySearch']);
        Route::get('/reverse', [ProfileController::class, 'proxyReverse']);
    });
});



