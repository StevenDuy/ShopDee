<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Banner;
use App\Models\Product;
use Illuminate\Support\Facades\Storage;

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
    public function index()
    {
        $banners = Banner::with('product')->orderBy('order')->get();
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
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // Max 5MB
            'product_id' => 'required|exists:products,id',
            'active' => 'boolean',
            'order' => 'integer'
        ]);

        $data = $request->only(['title', 'subtitle', 'product_id', 'active', 'order']);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('banners', 'public');
            $data['image_path'] = Storage::url($path);
        }

        $banner = Banner::create($data);

        return response()->json($banner, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Banner $banner)
    {
        return response()->json($banner->load('product'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Banner $banner)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'product_id' => 'required|exists:products,id',
            'active' => 'boolean',
            'order' => 'integer'
        ]);

        $data = $request->only(['title', 'subtitle', 'product_id', 'active', 'order']);

        if ($request->hasFile('image')) {
            // Delete old image
            $oldPath = str_replace('/storage/', '', $banner->image_path);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('image')->store('banners', 'public');
            $data['image_path'] = Storage::url($path);
        }

        $banner->update($data);

        return response()->json($banner);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Banner $banner)
    {
        $oldPath = str_replace('/storage/', '', $banner->image_path);
        if (Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        $banner->delete();

        return response()->json(['message' => 'Banner deleted successfully']);
    }
}
