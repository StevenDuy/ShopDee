<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        // Must verify user is seller
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Product::where('seller_id', $request->user()->id)
            ->select('id', 'seller_id', 'category_id', 'title', 'slug', 'price', 'sale_price', 'stock_quantity', 'status', 'ban_reason', 'created_at')
            ->with(['category', 'media']);

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
            'stock_quantity' => 'required|integer|min:0',
            'attributes' => 'sometimes|array',
            'attributes.*.attribute_name' => 'required|string|max:255',
            'attributes.*.attribute_value' => 'required|string|max:255',
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

        DB::beginTransaction();
        try {
            if ($request->has('attributes')) {
                $inputAttributes = $request->input('attributes');
                
                if (is_string($inputAttributes)) {
                    $inputAttributes = json_decode($inputAttributes, true);
                }

                if (is_array($inputAttributes)) {
                    $dataToSave = [];
                    foreach ($inputAttributes as $attr) {
                        $name = $attr['attribute_name'] ?? ($attr['name'] ?? '');
                        $value = $attr['attribute_value'] ?? ($attr['value'] ?? '');
                        
                        if (!empty(trim($name)) && !empty(trim($value))) {
                            $dataToSave[] = [
                                'attribute_name' => trim($name),
                                'attribute_value' => trim($value),
                            ];
                        }
                    }

                    if (!empty($dataToSave)) {
                        $product->attributes()->createMany($dataToSave);
                        Log::info("Saved " . count($dataToSave) . " attributes for product {$product->id}");
                    }
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to save attributes: " . $e->getMessage());
        }

        return response()->json($product->load('attributes'), 201);
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
            'status' => 'sometimes|in:active,inactive,archived',
            'attributes' => 'sometimes|array',
            'attributes.*.attribute_name' => 'required|string|max:255',
            'attributes.*.attribute_value' => 'required|string|max:255',
        ]);

        $product->update($request->all());

        if ($request->has('title')) {
            $product->update(['slug' => Str::slug($request->title) . '-' . $product->id]);
        }

        DB::beginTransaction();
        try {
            if ($request->has('attributes')) {
                $inputAttributes = $request->input('attributes');
                
                if (is_string($inputAttributes)) {
                    $inputAttributes = json_decode($inputAttributes, true);
                }

                if (is_array($inputAttributes)) {
                    $dataToSave = [];
                    foreach ($inputAttributes as $attr) {
                        $name = $attr['attribute_name'] ?? ($attr['name'] ?? '');
                        $value = $attr['attribute_value'] ?? ($attr['value'] ?? '');
                        
                        if (!empty(trim($name)) && !empty(trim($value))) {
                            $dataToSave[] = [
                                'attribute_name' => trim($name),
                                'attribute_value' => trim($value),
                            ];
                        }
                    }

                    $product->attributes()->delete();
                    if (!empty($dataToSave)) {
                        $product->attributes()->createMany($dataToSave);
                        Log::info("Updated " . count($dataToSave) . " attributes for product {$product->id}");
                    }
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to update attributes: " . $e->getMessage());
        }

        return response()->json($product->load(['category', 'attributes', 'media']));
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::where('seller_id', $request->user()->id)->findOrFail($id);

        try {
            // Manually delete related records to avoid FK constraint issues
            // (in case DB was created without proper cascade)
            $product->reviews()->delete();
            $product->attributes()->delete();
            $product->options()->each(function ($option) {
                $option->values()->delete();
                $option->delete();
            });
            // Media storage cleanup
            foreach ($product->media as $media) {
                if ($media->public_id) {
                    Cloudinary::destroy($media->public_id);
                }
            }
            $product->media()->delete();

            $product->delete();
            return response()->json(['message' => 'Product deleted successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Cannot delete product: ' . $e->getMessage()
            ], 422);
        }
    }
}
