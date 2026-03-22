<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * Get a list of orders for this seller
     */
    public function index(Request $request)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Order::where('seller_id', $request->user()->id)
            ->with(['customer.profile', 'items.product', 'shippingAddress']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Sort by creation date
        $query->orderBy('created_at', 'desc');

        return response()->json($query->paginate(10));
    }

    /**
     * Get details for a specific order
     */
    public function show(Request $request, $id)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $order = Order::where('seller_id', $request->user()->id)
            ->with(['customer.profile', 'items.product.media', 'shippingAddress'])
            ->findOrFail($id);

        return response()->json($order);
    }

    /**
     * Update order status
     */
    public function updateStatus(Request $request, $id)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|string|in:pending,processing,shipped,delivered,cancelled,returned'
        ]);

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id) {
                $order = Order::where('seller_id', $request->user()->id)
                    ->lockForUpdate()
                    ->findOrFail($id);
                
                $oldStatus = $order->status;
                $newStatus = $request->status;

                // Restriction: If order contains banned products, seller can ONLY cancel it
                if (!in_array($newStatus, ['cancelled', 'returned'])) {
                    $hasBanned = $order->items()->whereHas('product', function($q) {
                        $q->where('status', 'banned');
                    })->exists();
                    
                    if ($hasBanned) {
                        throw new \Exception("Đơn hàng này chứa sản phẩm đang bị cấm kinh doanh. Bạn chỉ có thể chọn trạng thái 'Đã hủy' hoặc 'Trả hàng'.");
                    }
                }

                $order->update([
                    'status' => $newStatus
                ]);

                // Handle Stock Restoration if moving to cancelled/returned from a non-cancelled state
                if (!in_array($oldStatus, ['cancelled', 'returned']) && in_array($newStatus, ['cancelled', 'returned'])) {
                    foreach ($order->items as $item) {
                        if (!empty($item->variant_ids)) {
                            foreach ($item->variant_ids as $vId) {
                                \App\Models\ProductOptionValue::where('id', $vId)->increment('stock_quantity', $item->quantity);
                            }
                        } else {
                            \App\Models\Product::where('id', $item->product_id)->increment('stock_quantity', $item->quantity);
                        }
                    }
                }

                // Handle finance updates based on order status
                if ($newStatus === 'completed') {
                    \App\Models\SellerFinance::where('order_id', $order->id)
                        ->where('type', 'credit')
                        ->update(['status' => 'completed']);
                } elseif (in_array($newStatus, ['cancelled', 'returned'])) {
                    // Remove the pending credit if the order is cancelled/returned
                    \App\Models\SellerFinance::where('order_id', $order->id)
                        ->where('type', 'credit')
                        ->where('status', 'pending')
                        ->delete();
                }

                return response()->json([
                    'message' => 'Order status updated successfully',
                    'order' => $order
                ]);
            });
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }
}
