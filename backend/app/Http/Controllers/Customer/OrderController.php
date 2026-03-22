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
            'items.*.variant_ids' => 'nullable|array',
        ]);

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
                $itemDataList = $request->items;
                $productIds = collect($itemDataList)->pluck('product_id')->unique()->toArray();
                
                // Bulk fetch products with lock
                $products = \App\Models\Product::whereIn('id', $productIds)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                // Collect all variant IDs to fetch them in bulk too
                $allVariantIds = collect($itemDataList)->pluck('variant_ids')->flatten()->filter()->unique()->toArray();
                $variantValues = \App\Models\ProductOptionValue::whereIn('id', $allVariantIds)
                    ->get()
                    ->keyBy('id');

                $totalAmount = 0;
                $orderItemsToCreate = [];
                $stockUpdates = []; 

                foreach ($itemDataList as $item) {
                    $product = $products->get($item['product_id']);
                    if (!$product) throw new \Exception("Sản phẩm không tồn tại (ID: {$item['product_id']})");

                    // Check product status
                    if ($product->status === 'banned') {
                        throw new \Exception("Sản phẩm '{$product->title}' hiện đang bị cấm và không thể thực hiện giao dịch.");
                    }
                    if ($product->status === 'hide') {
                        throw new \Exception("Sản phẩm '{$product->title}' hiện không khả dụng để đặt mua.");
                    }

                    // Base price from DB - FIXES SECURITY FLAW
                    $unitPrice = $product->sale_price ?? $product->price;
                    
                    // Add adjustments from variants
                    $itemVariantIds = $item['variant_ids'] ?? [];
                    foreach ($itemVariantIds as $vId) {
                        $vVal = $variantValues->get($vId);
                        if ($vVal) {
                            $unitPrice += $vVal->price_adjustment;
                            
                            // Check variant stock
                            if ($vVal->stock_quantity < $item['quantity']) {
                                throw new \Exception("Phân loại '{$vVal->option_value}' của '{$product->title}' không đủ hàng.");
                            }
                            $stockUpdates[] = ['type' => 'variant', 'id' => $vId, 'qty' => $item['quantity']];
                        }
                    }

                    // If no variants, check main product stock
                    if (empty($itemVariantIds)) {
                        if ($product->stock_quantity < $item['quantity']) {
                            throw new \Exception("Sản phẩm {$product->title} không đủ số lượng tồn kho.");
                        }
                        $stockUpdates[] = ['type' => 'product', 'id' => $product->id, 'qty' => $item['quantity']];
                    }

                    $subtotal = $unitPrice * $item['quantity'];
                    $totalAmount += $subtotal;

                    $orderItemsToCreate[] = [
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $unitPrice,
                        'selected_options' => $item['selected_options'] ?? null,
                        'subtotal' => $subtotal,
                        'variant_ids' => $itemVariantIds,
                    ];
                }

                $order = Order::create([
                    'customer_id'        => $request->user()->id,
                    'seller_id'          => $request->seller_id,
                    'shipping_address_id' => $request->shipping_address_id,
                    'total_amount'       => $totalAmount,
                    'status'             => 'pending',
                    'payment_method'     => $request->payment_method,
                    'notes'              => $request->notes,
                ]);

                foreach ($orderItemsToCreate as $oi) {
                    $oi['order_id'] = $order->id;
                    OrderItem::create($oi);
                }

                // OPTIMIZED: Update stock in bulk-like mapping
                foreach ($stockUpdates as $update) {
                    if ($update['type'] === 'variant') {
                        $vVal = \App\Models\ProductOptionValue::find($update['id']);
                        if ($vVal) {
                            $vVal->decrement('stock_quantity', $update['qty']);
                            // Optional: check if all variants of the parent product are out of stock
                            // but usually the main product stock field is also a sum or direct check.
                        }
                    } else {
                        $prod = \App\Models\Product::find($update['id']);
                        if ($prod) {
                            $prod->decrement('stock_quantity', $update['qty']);
                            if ($prod->refresh()->stock_quantity <= 0) {
                                $prod->status = 'out_of_stock';
                                $prod->save();
                            }
                        }
                    }
                }

                \App\Models\SellerFinance::create([
                    'seller_id'   => $request->seller_id,
                    'order_id'    => $order->id,
                    'type'        => 'credit',
                    'amount'      => $totalAmount,
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
                $order = Order::with('items')->where('customer_id', $request->user()->id)
                    ->lockForUpdate()
                    ->findOrFail($id);

                if (!in_array($order->status, ['pending', 'processing'])) {
                    return response()->json(['message' => 'Không thể hủy đơn hàng ở trạng thái này'], 400);
                }

                $order->update(['status' => 'cancelled']);

                // Optimized Stock Restoration
                foreach ($order->items as $item) {
                    // Update main product if it was direct purchase OR if we want to keep sum stock
                    // Based on user advice: "Chỉ tính tồn kho trực tiếp trên các mã SKU (Option Values)"
                    // However, we must restore where we decremented.
                    
                    if (!empty($item->variant_ids)) {
                        foreach ($item->variant_ids as $vId) {
                            \App\Models\ProductOptionValue::where('id', $vId)->increment('stock_quantity', $item->quantity);
                        }
                    } else {
                        \App\Models\Product::where('id', $item->product_id)->increment('stock_quantity', $item->quantity);
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
