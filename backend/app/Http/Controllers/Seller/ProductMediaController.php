<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

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

        // Store file on Cloudinary using the SDK v2 method
        try {
            \Log::info('Attempting Cloudinary upload', ['file' => $file->getClientOriginalName()]);
            // Use uploadApi()->upload() for SDK v2
            $result = Cloudinary::uploadApi()->upload($file->getRealPath(), [
                'folder' => 'products',
                'resource_type' => 'auto'
            ]);
            
            if (!$result || !isset($result['secure_url'])) {
                \Log::error('Cloudinary upload returned invalid result', ['result' => $result]);
                return response()->json(['message' => 'Cloudinary upload failed (invalid result)'], 500);
            }
            
            $url = $result['secure_url'];
            $publicId = $result['public_id'];
            \Log::info('Cloudinary upload success', ['url' => $url, 'public_id' => $publicId]);
        } catch (\Exception $e) {
            \Log::error('Cloudinary upload error: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => substr($e->getTraceAsString(), 0, 500)
            ]);
            return response()->json([
                'message' => 'Cloudinary upload error: ' . $e->getMessage(),
                'hint' => 'Check your .env CLOUDINARY keys'
            ], 500);
        }

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
            'public_id' => $publicId,
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

        if ($media->public_id) {
            Cloudinary::destroy($media->public_id);
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
