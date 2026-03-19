<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use App\Models\ModerationReport;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

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

        // 1. Overview Totals
        $totalRevenue = Order::whereIn('status', ['delivered', 'completed'])->sum('total_amount');
        $platformEarnings = $totalRevenue * 0.05; // 5% commission
        $totalCustomers = User::where('role_id', 3)->count();
        $totalSellers = User::where('role_id', 2)->count();
        $totalProducts = Product::count();
        $pendingReports = ModerationReport::where('status', 'pending')->count();

        // 2. Revenue & Profit Trends (Last 7 Days)
        $sevenDaysAgo = Carbon::now()->subDays(6)->startOfDay();
        $dailyTrends = Order::whereIn('status', ['delivered', 'completed', 'paid'])
            ->where('created_at', '>=', $sevenDaysAgo)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('SUM(total_amount) * 0.05 as total_earnings')
            )
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        // 3. Risk Alert Trend (Last 7 Days)
        $riskTrends = ModerationReport::where('created_at', '>=', $sevenDaysAgo)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as report_count')
            )
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        // 4. Recent Abnormal Alerts (Moderation Reports)
        $recentAlerts = ModerationReport::with(['reporter', 'reportedUser', 'reportedProduct'])
            ->latest()
            ->take(5)
            ->get();

        // 5. User Distribution
        $userDistribution = [
            ['label' => 'Customers', 'value' => $totalCustomers],
            ['label' => 'Sellers', 'value' => $totalSellers],
        ];

        return response()->json([
            'overview' => [
                'total_revenue' => $totalRevenue,
                'platform_earnings' => $platformEarnings,
                'total_customers' => $totalCustomers,
                'total_sellers' => $totalSellers,
                'total_products' => $totalProducts,
                'pending_reports' => $pendingReports,
            ],
            'trends' => [
                'daily' => $dailyTrends,
                'risk' => $riskTrends,
            ],
            'recent_alerts' => $recentAlerts,
            'user_distribution' => $userDistribution,
            'recent_users' => User::with('role')->latest()->take(5)->get(),
            'recent_orders' => Order::with(['customer', 'seller'])->latest()->take(5)->get(),
        ]);
    }
}
