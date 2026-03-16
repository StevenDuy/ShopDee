<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ModerationReport;
use App\Models\Review;
use App\Models\ChatMessage;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    /**
     * Get products that might need moderation
     */
    public function products(Request $request)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Product::with(['seller', 'category', 'media']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where('title', 'LIKE', "%" . $request->search . "%");
        }

        $products = $query->latest()->paginate(15);

        return response()->json($products);
    }

    /**
     * Get all moderation reports
     */
    public function reports(Request $request)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = ModerationReport::with(['reporter', 'reportedUser', 'reportedProduct', 'reportedReview', 'reportedMessage']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $type = $request->type;
            if ($type === 'product') $query->whereNotNull('reported_product_id');
            elseif ($type === 'user') $query->whereNotNull('reported_user_id');
            elseif ($type === 'review') $query->whereNotNull('reported_review_id');
            elseif ($type === 'message') $query->whereNotNull('reported_message_id');
        }

        $reports = $query->latest()->paginate(15);
        return response()->json($reports);
    }

    /**
     * Update report status
     */
    public function updateReportStatus(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:pending,resolved,dismissed',
            'admin_notes' => 'nullable|string'
        ]);

        $report = ModerationReport::findOrFail($id);
        $report->update($request->only(['status', 'admin_notes']));

        return response()->json(['message' => 'Report status updated.', 'report' => $report]);
    }

    /**
     * Delete a product forcefully
     */
    public function deleteProduct(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product removed by admin.']);
    }

    /**
     * Update product status
     */
    public function updateProductStatus(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
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
