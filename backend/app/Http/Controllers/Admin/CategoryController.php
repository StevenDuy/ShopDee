<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Get all categories with children (hierarchical).
     */
    public function index()
    {
        $categories = Category::whereNull('parent_id')
            ->with(['children' => function($query) {
                $query->withCount('products');
            }])
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * Store a new category.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        $category = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . uniqid(),
            'parent_id' => $request->parent_id,
            'is_active' => true,
        ]);

        return response()->json($category, 201);
    }

    /**
     * Update an existing category.
     */
    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:100',
            'parent_id' => 'nullable|exists:categories,id|different:id',
        ]);

        // Prevent circular dependency
        if ($request->parent_id) {
            $parent = Category::find($request->parent_id);
            if ($parent && $parent->parent_id == $id) {
                return response()->json(['message' => 'Cannot set a child as parent.'], 422);
            }
        }

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . uniqid(),
            'parent_id' => $request->parent_id,
        ]);

        return response()->json($category);
    }

    /**
     * Delete a category.
     */
    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        
        // Reassign products to parent or null? 
        // For now, let's just delete if no products, or prevent if has products.
        if ($category->products()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category with associated products.'], 422);
        }

        if ($category->children()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category with children.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully.']);
    }
}
