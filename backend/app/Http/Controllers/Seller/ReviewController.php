<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Get reviews for the seller's products.
     */
    public function index(Request $request)
    {
        $sellerId = $request->user()->id;
        $productId = $request->query('product_id');

        $query = Review::with(['customer', 'product.media'])
            ->whereHas('product', function ($q) use ($sellerId) {
                $q->where('seller_id', $sellerId);
            });

        if ($productId) {
            $query->where('product_id', $productId);
            
            $product = Product::select('id', 'title', 'rating_avg')
                ->where('id', $productId)
                ->where('seller_id', $sellerId)
                ->first();
                
            $reviews = $query->latest()->paginate(10);
            
            return response()->json([
                'success' => true,
                'product' => $product,
                'avg_rating' => $product ? (float)$product->rating_avg : 0,
                'data' => $reviews
            ]);
        }

        $reviews = $query->latest()->paginate(10);
        
        // Calculate overall average rating for seller's products
        $avgRating = Product::where('seller_id', $sellerId)->avg('rating_avg') ?? 0;

        return response()->json([
            'success' => true,
            'avg_rating' => (float)$avgRating,
            'data' => $reviews
        ]);
    }
}
