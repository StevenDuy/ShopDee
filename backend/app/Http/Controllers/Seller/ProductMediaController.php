<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
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

        // Store file on configured Storage Disk (Local or Cloudinary)
        try {
            $diskName = env('FILESYSTEM_DISK', 'public');
            Log::info('Attempting file upload via Storage disk', ['disk' => $diskName, 'file' => $file->getClientOriginalName()]);
            
            // putFile returns the relative path of the file
            $path = Storage::disk($diskName)->putFile('products', $file);
            $url = Storage::disk($diskName)->url($path);
            
            // publicId will store the relative path (used for deleting the file later via Storage::disk()->delete())
            $publicId = $path;
            
            Log::info('File upload success via Storage disk', ['url' => $url, 'public_id' => $publicId]);
        } catch (\Exception $e) {
            Log::error('File upload error: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => substr($e->getTraceAsString(), 0, 500)
            ]);
            return response()->json([
                'message' => 'File upload error: ' . $e->getMessage(),
                'hint' => 'Check your FILESYSTEM_DISK and config/filesystems.php settings'
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
            try {
                $diskName = env('FILESYSTEM_DISK', 'public');
                Storage::disk($diskName)->delete($media->public_id);
                Log::info("Deleted file from storage disk: {$media->public_id} on disk {$diskName}");
            } catch (\Exception $e) {
                // Log error but continue to delete from database
                Log::warning("File deletion failed from Storage for ID: {$media->public_id}. Error: " . $e->getMessage());
            }
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
