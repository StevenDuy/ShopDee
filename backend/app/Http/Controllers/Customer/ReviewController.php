<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Review;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ReviewController extends Controller
{
    /**
     * Store a new review.
     */
    public function store(Request $request)
    {
        $request->validate([
            'order_item_id' => 'required|exists:order_items,id',
            'product_id'    => 'required|exists:products,id',
            'rating'        => 'required|integer|min:1|max:5',
            'comment'       => 'nullable|string|max:1000',
            'media.*'       => 'string',
            'files'         => 'nullable|array',
            'files.*'       => 'file|mimes:jpeg,png,jpg,gif,mp4,webm|max:10240',
        ]);

        Log::info('Review Store Request Data:', $request->all());

        $customerId = $request->user()->id;

        // Check if the order item belongs to the customer and if the order is completed
        $orderItem = OrderItem::with(['order', 'product'])
            ->where('id', $request->order_item_id)
            ->where('product_id', $request->product_id)
            ->firstOrFail();

        if ($orderItem->order->customer_id !== $customerId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($orderItem->order->status !== 'completed') {
            return response()->json(['message' => 'Bạn chỉ có thể đánh giá sau khi hoàn tất đơn hàng'], 400);
        }

        // Check if already reviewed
        $exists = Review::where('order_item_id', $request->order_item_id)
            ->where('customer_id', $customerId)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi'], 400);
        }

        return DB::transaction(function () use ($request, $customerId, $orderItem) {
            $mediaUrls = $request->input('media', []);

            // Handle local file uploads
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $path = $file->store('reviews', 'public');
                    $mediaUrls[] = Storage::url($path);
                }
            }

            $review = Review::create([
                'customer_id'   => $customerId,
                'product_id'    => $request->product_id,
                'order_item_id' => $request->order_item_id,
                'rating'        => $request->rating,
                'comment'       => $request->comment,
                'media'         => $mediaUrls,
            ]);

            // Update product rating cache
            $product = \App\Models\Product::find($request->product_id);
            if ($product) {
                $stats = Review::where('product_id', $product->id)
                    ->selectRaw('count(*) as count, avg(rating) as avg')
                    ->first();
                $product->update([
                    'rating_avg' => $stats->avg ?? 0,
                    'review_count' => $stats->count ?? 0,
                ]);
            }

            try {
                // Notify seller
                Notification::create([
                    'user_id' => $orderItem->order->seller_id,
                    'type'    => 'review',
                    'data'    => [
                        'order_id'      => $orderItem->order_id,
                        'customer_name' => $request->user()->name,
                        'product_title' => $orderItem->product->title ?? 'Sản phẩm',
                        'rating'        => $request->rating,
                    ],
                    'is_read' => false,
                ]);
            } catch (\Exception $e) {
                Log::error('Review Notification Error: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Đánh giá sản phẩm thành công',
                'review'  => $review->load('customer')
            ], 201);
        });
    }

    /**
     * Check if user can review a specific order item.
     */
    public function checkEligibility(Request $request, $orderItemId)
    {
        $customerId = $request->user()->id;
        
        $orderItem = OrderItem::with('order')
            ->where('id', $orderItemId)
            ->first();

        if (!$orderItem || $orderItem->order->customer_id !== $customerId) {
            return response()->json(['eligible' => false, 'reason' => 'invalid_order']);
        }

        if ($orderItem->order->status !== 'completed') {
            return response()->json(['eligible' => false, 'reason' => 'order_not_completed']);
        }

        $exists = Review::where('order_item_id', $orderItemId)
            ->exists();

        if ($exists) {
            return response()->json(['eligible' => false, 'reason' => 'already_reviewed']);
        }

        return response()->json(['eligible' => true]);
    }
}
