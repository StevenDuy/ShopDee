<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Notification::with('user')->orderBy('created_at', 'desc');

        if ($user->role_id !== 1) {
            $query->where('user_id', $user->id);
        } else {
            // Admin: Filter out duplicates of the same broadcast.
            // Only show one representative for each batch_id.
            $query->where(function($q) {
                $q->whereNull('data->batch_id')
                  ->orWhereRaw('id IN (SELECT MIN(id) FROM notifications GROUP BY JSON_UNQUOTE(JSON_EXTRACT(data, "$.batch_id")))');
            });
        }
            
        return response()->json($query->paginate(20));
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $notification->update(['is_read' => true]);
        
        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);
            
        return response()->json(['message' => 'All notifications marked as read']);
    }
    public function unreadCounts(Request $request)
    {
        $userId = $request->user()->id;
        
        $notifCount = Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();
            
        $msgCount = 0;
        try {
            if (Schema::hasTable('chat_messages')) {
                $msgCount = \App\Models\ChatMessage::whereHas('conversation', function($q) use ($userId) {
                        $q->where('user1_id', $userId)->orWhere('user2_id', $userId);
                    })
                    ->where('sender_id', '!=', $userId)
                    ->where('is_read', false)
                    ->count();
            }
        } catch (\Throwable $e) {
            \Log::warning("Unread chat message count failed: " . $e->getMessage());
        }
            
        return response()->json([
            'notifications' => $notifCount,
            'messages' => $msgCount,
            'total' => $notifCount + $msgCount
        ]);
    }
}
