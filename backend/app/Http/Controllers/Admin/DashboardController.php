<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get system-wide statistics for the admin dashboard
     */
    public function stats(Request $request)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // 1. Total Revenue (all completed orders)
        $totalRevenue = Order::whereIn('status', ['delivered', 'completed'])->sum('total_amount');

        // 2. Platform Fee Estimation (assuming 5% fee on valid orders as platform income)
        $platformFee = $totalRevenue * 0.05;

        // 3. User Counts
        $totalCustomers = User::where('role_id', 3)->count();
        $totalSellers = User::where('role_id', 2)->count();

        // 4. Products Count
        $totalProducts = Product::count();
        $pendingProducts = Product::where('status', 'draft')->count(); // Treat draft as pending review for now

        // 5. Recent Activity (Recent Users & Orders)
        $recentUsers = User::with('role')->latest()->take(5)->get();
        $recentOrders = Order::with(['customer', 'seller'])->latest()->take(5)->get();

        return response()->json([
            'overview' => [
                'total_revenue' => $totalRevenue,
                'platform_earnings' => $platformFee,
                'total_customers' => $totalCustomers,
                'total_sellers' => $totalSellers,
                'total_products' => $totalProducts,
                'pending_approvals' => $pendingProducts,
            ],
            'recent_users' => $recentUsers,
            'recent_orders' => $recentOrders,
        ]);
    }
}
