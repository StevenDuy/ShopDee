<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Banner;
use App\Models\Product;
use Illuminate\Support\Facades\Storage;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Support\Facades\Log;

class BannerController extends Controller
{
    /**
     * Search products for banner link
     */
    public function searchProducts(Request $request)
    {
        $search = $request->query('q');
        $products = Product::where('title', 'like', "%{$search}%")
            ->limit(10)
            ->get(['id', 'title', 'price']);
        
        return response()->json($products);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Banner::with('product')->orderBy('order');
        
        if ($request->query('active_only')) {
            $query->where('active', true);
        }
        
        $banners = $query->get();
        return response()->json($banners);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:20480', 
            'product_id' => 'required|exists:products,id',
            'active' => 'required|in:0,1,true,false',
            'order' => 'nullable|integer'
        ]);

        $data = $request->only(['title', 'subtitle', 'product_id', 'active', 'order']);

        if ($request->hasFile('image')) {
            try {
                $file = $request->file('image');
                $diskName = env('FILESYSTEM_DISK', 'public');
                $path = Storage::disk($diskName)->putFile('banners', $file);
                
                $data['image_path'] = Storage::disk($diskName)->url($path);
                $data['public_id'] = $path;
            } catch (\Exception $e) {
                Log::error('Banner upload error: ' . $e->getMessage());
                return response()->json(['message' => 'Lỗi khi tải ảnh lên Storage: ' . $e->getMessage()], 500);
            }
        }

        $banner = Banner::create($data);

        return response()->json($banner, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $banner = Banner::with('product')->findOrFail($id);
        return response()->json($banner);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $banner = Banner::findOrFail($id);
        
        $request->validate([
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:20480',
            'product_id' => 'required|exists:products,id',
            'active' => 'required|in:0,1,true,false',
            'order' => 'nullable|integer'
        ]);

        $data = $request->only(['title', 'subtitle', 'product_id', 'active', 'order']);

        if ($request->hasFile('image')) {
            // Delete old image from Storage Disk if it exists
            if ($banner->public_id) {
                try {
                    $diskName = env('FILESYSTEM_DISK', 'public');
                    Storage::disk($diskName)->delete($banner->public_id);
                } catch (\Exception $e) {
                    Log::warning('Failed to delete old banner from Storage: ' . $e->getMessage());
                }
            }

            try {
                $file = $request->file('image');
                $diskName = env('FILESYSTEM_DISK', 'public');
                $path = Storage::disk($diskName)->putFile('banners', $file);
                
                $data['image_path'] = Storage::disk($diskName)->url($path);
                $data['public_id'] = $path;
            } catch (\Exception $e) {
                Log::error('Banner upload update error: ' . $e->getMessage());
                return response()->json(['message' => 'Lỗi khi cập nhật ảnh lên Storage: ' . $e->getMessage()], 500);
            }
        }

        $banner->update($data);

        return response()->json($banner);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $banner = Banner::findOrFail($id);
        
        if ($banner->public_id) {
            try {
                $diskName = env('FILESYSTEM_DISK', 'public');
                Storage::disk($diskName)->delete($banner->public_id);
            } catch (\Exception $e) {
                Log::warning('Failed to delete banner from Storage: ' . $e->getMessage());
            }
        }

        $banner->delete();

        return response()->json(['message' => 'Banner deleted successfully']);
    }
}
