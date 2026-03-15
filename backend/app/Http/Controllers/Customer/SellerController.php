<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request;

class SellerController extends Controller
{
    public function show($id)
    {
        $seller = User::with(['profile', 'role'])
            ->where('role_id', 2) // Assuming role_id 2 is Seller
            ->findOrFail($id);

        $productsCount = Product::where('seller_id', $id)->where('status', 'active')->count();
        
        // Get average rating across all products
        $avgRating = Product::where('seller_id', $id)
            ->join('reviews', 'products.id', '=', 'reviews.product_id')
            ->avg('reviews.rating');

        return response()->json([
            'id' => $seller->id,
            'name' => $seller->name,
            'email' => $seller->email,
            'profile' => $seller->profile,
            'products_count' => $productsCount,
            'avg_rating' => round($avgRating, 1),
            'created_at' => $seller->created_at,
        ]);
    }

    public function products($id, Request $request)
    {
        $query = Product::with(['media', 'category', 'seller'])
            ->where('seller_id', $id)
            ->where('status', 'active');

        if ($search = $request->get('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        return response()->json($query->paginate(12));
    }
}
