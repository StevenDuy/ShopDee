<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $sellerId = $request->user()->id;

        // Total products
        $totalProducts = Product::where('seller_id', $sellerId)->count();

        // Total orders (any order containing items from this seller)
        $totalOrders = Order::where('seller_id', $sellerId)->count();

        // Revenue (sum of total_amount for delivered orders) - simplified for now
        $totalRevenue = Order::where('seller_id', $sellerId)
            ->where('status', 'delivered')
            ->sum('total_amount');

        // Recent Orders
        $recentOrders = Order::where('seller_id', $sellerId)
            ->with('customer.profile')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'total_products' => $totalProducts,
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'recent_orders' => $recentOrders
        ]);
    }
}
