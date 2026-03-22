<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Get paginated list of all users, with role filtering and search
     */
    public function index(Request $request)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = User::with(['role', 'profile']);

        // Search by name or email
        if ($request->has('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('name', 'LIKE', "%{$s}%")
                  ->orWhere('email', 'LIKE', "%{$s}%");
            });
        }

        // Filter by role
        if ($request->has('role_id') && $request->role_id !== 'all') {
            $query->where('role_id', $request->role_id);
        }

        // Filter by ban status (Assuming we have an is_banned column, or we'll fake it for now if it doesn't exist)
        // Let's check if the column exists soon, or just implement it. 
        // For now, let's just paginate
        // Order by role first, then newest
        $users = $query->orderBy('role_id', 'ASC')
            ->orderBy('created_at', 'DESC')
            ->paginate(15);

        return response()->json($users);
    }

    /**
     * Get specific user details along with their activity (orders, products)
     */
    public function show(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::with(['role', 'profile', 'addresses'])->findOrFail($id);

        return response()->json($user);
    }

    /**
     * Ban a user
     */
    public function ban(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        $user = User::findOrFail($id);
        
        // Cannot ban yourself or other admins
        if ($user->id === $request->user()->id || $user->role_id === 1) {
            return response()->json(['message' => 'Cannot ban admin accounts.'], 400);
        }

        $user->status = 'banned';
        $user->ban_reason = $request->reason;
        $user->save();

        return response()->json(['message' => 'User banned successfully.', 'user' => $user]);
    }

    /**
     * Unban a user
     */
    public function unban(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);
        $user->status = 'active';
        $user->ban_reason = null;
        $user->save();

        return response()->json(['message' => 'User unbanned successfully.', 'user' => $user]);
    }

    /**
     * Delete a generic user (or ban)
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);
        
        // Prevent deleting yourself or other admins easily
        if ($user->id === $request->user()->id || $user->role_id === 1) {
            return response()->json(['message' => 'Cannot delete this admin account.'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
