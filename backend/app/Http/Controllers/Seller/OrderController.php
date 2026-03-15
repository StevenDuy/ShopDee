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

                $order->update([
                    'status' => $newStatus
                ]);

                // Handle Stock Restoration if moving to cancelled/returned from a non-cancelled state
                if (!in_array($oldStatus, ['cancelled', 'returned']) && in_array($newStatus, ['cancelled', 'returned'])) {
                    foreach ($order->items as $item) {
                        $product = \App\Models\Product::find($item->product_id);
                        if ($product) {
                            $product->increment('stock_quantity', $item->quantity);
                            
                            if (!empty($item->selected_options)) {
                                foreach ($item->selected_options as $optionName => $valueString) {
                                    $parts = array_map('trim', explode('/', $valueString));
                                    $parentValName = $parts[0];
                                    $childValName = count($parts) > 1 ? $parts[1] : null;

                                    $option = \App\Models\ProductOption::where('product_id', $product->id)
                                        ->where('option_name', $optionName)
                                        ->first();

                                    if ($option) {
                                        $parentValue = \App\Models\ProductOptionValue::where('product_option_id', $option->id)
                                            ->where('option_value', $parentValName)
                                            ->whereNull('parent_id')
                                            ->first();

                                        if ($parentValue) {
                                            if ($childValName) {
                                                $childValue = \App\Models\ProductOptionValue::where('parent_id', $parentValue->id)
                                                    ->where('option_value', $childValName)
                                                    ->first();
                                                if ($childValue) $childValue->increment('stock_quantity', $item->quantity);
                                            }
                                            $parentValue->increment('stock_quantity', $item->quantity);
                                        }
                                    }
                                }
                            }
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
