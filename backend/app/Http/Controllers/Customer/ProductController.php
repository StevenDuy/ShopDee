<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'media', 'seller'])
            ->where('status', $request->get('status', 'active'));

        // Search
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($categorySlug = $request->get('category')) {
            $category = Category::where('slug', $categorySlug)->first();
            if ($category) {
                $childIds = Category::where('parent_id', $category->id)->pluck('id');
                $query->whereIn('category_id', $childIds->prepend($category->id));
            }
        }

        // Price filter
        if ($minPrice = $request->get('min_price')) $query->where('price', '>=', $minPrice);
        if ($maxPrice = $request->get('max_price')) $query->where('price', '<=', $maxPrice);

        // Sorting
        switch ($request->get('sort', 'newest')) {
            case 'best_sellers':
                $query->withCount('reviews')->orderBy('reviews_count', 'desc');
                break;
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            default: // newest
                $query->latest();
                break;
        }

        $limit = (int) $request->get('limit', 16);
        return response()->json($query->paginate($limit));
    }

    public function show(string $slug)
    {
        $product = Product::with([
            'category.parent',
            'media',
            'attributes',
            'seller',
            'reviews.customer.profile',
        ])->where('slug', $slug)->where('status', 'active')->firstOrFail();

        return response()->json($product);
    }

    public function reviews(int $id)
    {
        $product = Product::findOrFail($id);
        $reviews = $product->reviews()->with('customer.profile')->latest()->paginate(10);

        $avgRating = $product->reviews()->avg('rating');
        return response()->json([
            'avg_rating' => round($avgRating, 1),
            'total' => $product->reviews()->count(),
            'data' => $reviews,
        ]);
    }

    public function categories()
    {
        $categories = Category::where('is_active', true)
            ->whereNull('parent_id')
            ->with('children')
            ->get();

        return response()->json($categories);
    }
}
