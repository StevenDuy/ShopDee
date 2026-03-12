<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    /**
     * Get products that might need moderation (e.g., all products, or drafted/pending)
     */
    public function products(Request $request)
    {
        if ($request->user()->role_id !== 3) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Product::with(['seller', 'category', 'media']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $s = $request->search;
            $query->where('name', 'LIKE', "%{$s}%");
        }

        $products = $query->latest()->paginate(15);

        return response()->json($products);
    }

    /**
     * Delete a product forcefully
     */
    public function deleteProduct(Request $request, $id)
    {
        if ($request->user()->role_id !== 3) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product removed by admin.']);
    }

    /**
     * Update product status (e.g., force to draft, approve to published)
     */
    public function updateProductStatus(Request $request, $id)
    {
        if ($request->user()->role_id !== 3) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:draft,published,archived'
        ]);

        $product = Product::findOrFail($id);
        $product->update(['status' => $request->status]);

        return response()->json(['message' => 'Product status updated.', 'product' => $product]);
    }
}
