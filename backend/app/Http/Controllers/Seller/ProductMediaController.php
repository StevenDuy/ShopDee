<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductMediaController extends Controller
{
    /**
     * Upload media for a specific product
     */
    public function store(Request $request, $productId)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify seller owns the product
        $product = Product::where('seller_id', $request->user()->id)->findOrFail($productId);

        $request->validate([
            'file' => 'required|file|mimes:jpeg,png,jpg,gif,mp4,webm|max:10240', // Max 10MB
            'is_primary' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer'
        ]);

        $file = $request->file('file');
        
        // Determine type based on extension
        $extension = strtolower($file->getClientOriginalExtension());
        $mediaType = in_array($extension, ['mp4', 'webm']) ? 'video' : 'image';

        // Store file
        $path = $file->store('products', 'public');
        $url = Storage::url($path);

        // If this is set as primary, unset other primary images
        $isPrimary = $request->boolean('is_primary', false);
        if ($isPrimary) {
            ProductMedia::where('product_id', $product->id)->update(['is_primary' => false]);
        }

        // If no primary image exists, make this the primary one
        if (!$isPrimary && $product->media()->where('is_primary', true)->count() === 0) {
            $isPrimary = true;
        }

        $media = ProductMedia::create([
            'product_id' => $product->id,
            'media_type' => $mediaType,
            'url' => $url,
            'is_primary' => $isPrimary,
            'sort_order' => $request->input('sort_order', 0),
        ]);

        return response()->json($media, 201);
    }

    /**
     * Delete media
     */
    public function destroy(Request $request, $productId, $mediaId)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verify seller owns the product
        $product = Product::where('seller_id', $request->user()->id)->findOrFail($productId);
        
        $media = ProductMedia::where('product_id', $product->id)->findOrFail($mediaId);

        // Extract path from URL to delete file
        $path = str_replace('/storage/', '', $media->url);
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        $wasPrimary = $media->is_primary;
        $media->delete();

        // If we deleted the primary image, randomly assign a new one if others exist
        if ($wasPrimary) {
            $newPrimary = ProductMedia::where('product_id', $product->id)->first();
            if ($newPrimary) {
                $newPrimary->update(['is_primary' => true]);
            }
        }

        return response()->json(['message' => 'Media deleted successfully']);
    }

    /**
     * Set a media item as primary
     */
    public function setPrimary(Request $request, $productId, $mediaId)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::where('seller_id', $request->user()->id)->findOrFail($productId);
        $media = ProductMedia::where('product_id', $product->id)->findOrFail($mediaId);

        // Unset current primary
        ProductMedia::where('product_id', $product->id)->update(['is_primary' => false]);
        
        // Set new primary
        $media->update(['is_primary' => true]);

        return response()->json(['message' => 'Primary media updated', 'data' => $media]);
    }
}
