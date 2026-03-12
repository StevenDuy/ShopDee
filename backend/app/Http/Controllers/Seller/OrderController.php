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

        $order = Order::where('seller_id', $request->user()->id)->findOrFail($id);
        
        // Basic state machine validation could go here
        // e.g., cannot move from 'delivered' to 'pending'

        $order->update([
            'status' => $request->status
        ]);

        // Handle finance updates based on order status
        if (in_array($request->status, ['delivered', 'completed'])) {
            \App\Models\SellerFinance::where('order_id', $order->id)
                ->where('type', 'credit')
                ->update(['status' => 'completed']);
        } elseif (in_array($request->status, ['cancelled', 'returned'])) {
            // Remove the pending credit if the order is cancelled/returned
            \App\Models\SellerFinance::where('order_id', $order->id)
                ->where('type', 'credit')
                ->where('status', 'pending')
                ->delete();
        }

        // Trigger notification to customer here (future enhancement)

        return response()->json([
            'message' => 'Order status updated successfully',
            'order' => $order
        ]);
    }
}
