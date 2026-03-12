<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        // Must verify user is seller
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Product::where('seller_id', $request->user()->id)->with(['category', 'media']);

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(10));
    }

    public function store(Request $request)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0'
        ]);

        $product = Product::create([
            'seller_id' => $request->user()->id,
            'category_id' => $request->category_id,
            'title' => $request->title,
            'slug' => Str::slug($request->title) . '-' . uniqid(),
            'description' => $request->description,
            'price' => $request->price,
            'stock_quantity' => $request->stock_quantity,
            'status' => 'active',
            'sku' => strtoupper(uniqid('SKU-')),
        ]);

        return response()->json($product, 201);
    }

    public function show(Request $request, $id)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::where('seller_id', $request->user()->id)
            ->with(['category', 'attributes', 'media'])
            ->findOrFail($id);

        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::where('seller_id', $request->user()->id)->findOrFail($id);

        $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'stock_quantity' => 'sometimes|integer|min:0',
            'status' => 'sometimes|in:active,inactive,archived'
        ]);

        $product->update($request->all());

        if ($request->has('title')) {
            $product->update(['slug' => Str::slug($request->title) . '-' . $product->id]);
        }

        return response()->json($product);
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::where('seller_id', $request->user()->id)->findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }
}
