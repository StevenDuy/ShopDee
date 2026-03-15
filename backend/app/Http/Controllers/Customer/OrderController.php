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
        ]);

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

        foreach ($request->items as $item) {
            OrderItem::create([
                'order_id'   => $order->id,
                'product_id' => $item['product_id'],
                'quantity'   => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'subtotal'   => $item['unit_price'] * $item['quantity'],
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
    }

    public function myOrders(Request $request)
    {
        $orders = Order::with(['items.product.media', 'seller'])
            ->where('customer_id', $request->user()->id)
            ->latest()
            ->paginate(10);
        return response()->json($orders);
    }

    public function show(Request $request, int $id)
    {
        $order = Order::with(['items.product.media', 'seller', 'shippingAddress'])
            ->where('customer_id', $request->user()->id)
            ->findOrFail($id);
        return response()->json($order);
    }

    public function cancel(Request $request, $id)
    {
        try {
            $order = Order::where('customer_id', $request->user()->id)
                ->findOrFail($id);

            if (!in_array($order->status, ['pending', 'processing'])) {
                return response()->json(['message' => 'Không thể hủy đơn hàng ở trạng thái này'], 400);
            }

            $order->update(['status' => 'cancelled']);

            // Handle finance: delete pending credit
            \App\Models\SellerFinance::where('order_id', $order->id)
                ->where('status', 'pending')
                ->delete();

            return response()->json(['message' => 'Đã hủy đơn hàng thành công', 'order' => $order]);
        } catch (\Exception $e) {
            Log::error("Lỗi khi hủy đơn hàng: " . $e->getMessage());
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
