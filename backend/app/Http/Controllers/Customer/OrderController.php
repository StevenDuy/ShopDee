<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'seller_id'           => 'required|integer',
            'shipping_address_id' => 'required|integer',
            'payment_method'      => 'required|in:cod,bank_transfer,momo,vnpay',
            'items'               => 'required|array|min:1',
            'items.*.product_id'  => 'required|integer',
            'items.*.quantity'    => 'required|integer|min:1',
            'items.*.unit_price'  => 'required|numeric|min:0',
            'items.*.selected_options' => 'nullable|array',
        ]);

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
                $total = collect($request->items)->sum(fn($i) => $i['unit_price'] * $i['quantity']);

                $order = Order::create([
                    'customer_id'        => $request->user()->id,
                    'seller_id'          => $request->seller_id,
                    'shipping_address_id' => $request->shipping_address_id,
                    'total_amount'       => $total,
                    'status'             => 'pending',
                    'payment_method'     => $request->payment_method,
                    'notes'              => $request->notes,
                ]);

                foreach ($request->items as $itemData) {
                    $product = \App\Models\Product::lockForUpdate()->findOrFail($itemData['product_id']);
                    
                    if ($product->stock_quantity < $itemData['quantity']) {
                        throw new \Exception("Sản phẩm {$product->title} không đủ số lượng tồn kho.");
                    }

                    // 1. Decrement main product stock
                    $product->decrement('stock_quantity', $itemData['quantity']);

                    // 2. Decrement options stock
                    if (!empty($itemData['selected_options'])) {
                        foreach ($itemData['selected_options'] as $optionName => $valueString) {
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
                                        
                                        if ($childValue) {
                                            if ($childValue->stock_quantity < $itemData['quantity']) {
                                                throw new \Exception("Phân loại '{$valueString}' của '{$product->title}' không đủ hàng.");
                                            }
                                            $childValue->decrement('stock_quantity', $itemData['quantity']);
                                        }
                                    }
                                    
                                    // Parent stock update (decrement if it's strictly > 0 or if we want to keep sum)
                                    if ($parentValue->stock_quantity >= $itemData['quantity']) {
                                        $parentValue->decrement('stock_quantity', $itemData['quantity']);
                                    }
                                }
                            }
                        }
                    }

                    OrderItem::create([
                        'order_id'   => $order->id,
                        'product_id' => $itemData['product_id'],
                        'quantity'   => $itemData['quantity'],
                        'unit_price' => $itemData['unit_price'],
                        'selected_options' => $itemData['selected_options'],
                        'subtotal'   => $itemData['unit_price'] * $itemData['quantity'],
                    ]);
                }

                // Create pending finance record for seller
                \App\Models\SellerFinance::create([
                    'seller_id'   => $request->seller_id,
                    'order_id'    => $order->id,
                    'type'        => 'credit',
                    'amount'      => $total,
                    'status'      => 'pending',
                    'description' => 'Revenue for Order #' . $order->id,
                ]);

                return response()->json($order->load('items.product'), 201);
            });
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function myOrders(Request $request)
    {
        $orders = Order::with(['items.product.media', 'items.review', 'seller'])
            ->where('customer_id', $request->user()->id)
            ->latest()
            ->paginate(10);
        return response()->json($orders);
    }

    public function show(Request $request, int $id)
    {
        $order = Order::with(['items.product.media', 'items.review', 'seller', 'shippingAddress'])
            ->where('customer_id', $request->user()->id)
            ->findOrFail($id);
        return response()->json($order);
    }

    public function cancel(Request $request, $id)
    {
        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id) {
                $order = Order::where('customer_id', $request->user()->id)
                    ->lockForUpdate()
                    ->findOrFail($id);

                if (!in_array($order->status, ['pending', 'processing'])) {
                    return response()->json(['message' => 'Không thể hủy đơn hàng ở trạng thái này'], 400);
                }

                $order->update(['status' => 'cancelled']);

                // Restore Stock
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

                // Handle finance: delete pending credit
                \App\Models\SellerFinance::where('order_id', $order->id)
                    ->where('status', 'pending')
                    ->delete();

                return response()->json(['message' => 'Đã hủy đơn hàng thành công', 'order' => $order]);
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Lỗi khi hủy đơn hàng: " . $e->getMessage());
            return response()->json(['message' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
        }
    }

    public function confirmReceived(Request $request, $id)
    {
        try {
            $order = Order::where('customer_id', $request->user()->id)
                ->findOrFail($id);

            if ($order->status !== 'delivered') {
                return response()->json(['message' => 'Bạn chỉ có thể xác nhận đã nhận khi đơn hàng đã giao'], 400);
            }

            $order->update(['status' => 'completed']);

            // Complete finance record
            \App\Models\SellerFinance::where('order_id', $order->id)
                ->where('type', 'credit')
                ->update(['status' => 'completed']);

            return response()->json(['message' => 'Xác nhận đã nhận hàng thành công', 'order' => $order]);
        } catch (\Exception $e) {
            Log::error("Lỗi khi xác nhận nhận hàng: " . $e->getMessage());
            return response()->json(['message' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
        }
    }
}
