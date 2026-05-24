<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $sellerId = $request->user()->id;

        // ✅ Gộp cả 3 aggregate (count, delivered count, revenue) vào 1 query
        // Thay vì 3 query riêng lẻ trước đây
        $orderStats = DB::selectOne("
            SELECT
                COUNT(*) as total_orders,
                COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) as total_revenue
            FROM orders
            WHERE seller_id = ?
        ", [$sellerId]);

        $totalProducts = Product::where('seller_id', $sellerId)->count();

        // Recent orders: chỉ select cột cần thiết, eager load ít hơn
        $recentOrders = Order::select(
                'id', 'seller_id', 'customer_id', 'status',
                'total_amount', 'created_at', 'shipping_address_id'
            )
            ->where('seller_id', $sellerId)
            ->with([
                'customer:id,name,email',
                'customer.profile:user_id,avatar_url,contact_phone',
            ])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'total_products' => $totalProducts,
            'total_orders'   => (int) ($orderStats->total_orders ?? 0),
            'total_revenue'  => (float) ($orderStats->total_revenue ?? 0),
            'recent_orders'  => $recentOrders,
        ]);
    }
}
