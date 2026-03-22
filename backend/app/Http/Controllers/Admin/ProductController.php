<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Get all products for admin management
     */
    public function index(Request $request)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Product::with(['seller', 'category', 'media'])
            ->withTrashed(); // Show deleted products too as requested

        // Search by title or seller name
        if ($request->has('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('title', 'LIKE', "%{$s}%")
                  ->orWhereHas('seller', function($sq) use ($s) {
                      $sq->where('name', 'LIKE', "%{$s}%");
                  });
            });
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'deleted') {
                $query->onlyTrashed();
            } else {
                $query->where('status', $request->status);
            }
        }

        $products = $query->latest()->paginate(15);

        return response()->json($products);
    }

    /**
     * Show product details
     */
    public function show(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::with(['seller.profile', 'category', 'media', 'options.values', 'attributes'])
            ->withTrashed()
            ->findOrFail($id);

        // If the product is deleted, we should follow user's rule:
        // "admin vẫn hiển thị sản phẩm đã ban nhưng không thể bấm xem chi tiết được nữa"
        // Wait, the user said "không thể bấm xem chi tiết được nữa" for products DELETED by seller.
        // I will return the data but the frontend will block the view if needed.
        // Actually, if it's trashed, we can still show info, but maybe limited.
        
        return response()->json($product);
    }

    /**
     * Ban a product
     */
    public function ban(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        $product = Product::findOrFail($id);
        $product->status = 'banned';
        $product->ban_reason = $request->reason;
        $product->save();

        return response()->json([
            'message' => 'Product has been banned successfully.',
            'product' => $product
        ]);
    }

    /**
     * Unban a product
     */
    public function unban(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::findOrFail($id);
        $product->status = 'active';
        $product->ban_reason = null;
        $product->save();

        return response()->json([
            'message' => 'Product has been unbanned successfully.',
            'product' => $product
        ]);
    }

    /**
     * Delete/Restore or permanent delete?
     * Admin can also delete products.
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::withTrashed()->findOrFail($id);

        if ($request->has('permanent')) {
            $product->forceDelete();
            return response()->json(['message' => 'Product permanently removed.']);
        }

        if ($product->trashed()) {
            $product->restore();
            return response()->json(['message' => 'Product restored.']);
        }

        $product->delete();
        return response()->json(['message' => 'Product moved to trash.']);
    }
}
