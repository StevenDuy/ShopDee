<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
            
        return response()->json($notifications);
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
            
        $msgCount = \App\Models\ChatMessage::whereHas('conversation', function($q) use ($userId) {
                $q->where('user1_id', $userId)->orWhere('user2_id', $userId);
            })
            ->where('sender_id', '!=', $userId)
            ->where('is_read', false)
            ->count();
            
        return response()->json([
            'notifications' => $notifCount,
            'messages' => $msgCount,
            'total' => $notifCount + $msgCount
        ]);
    }
}
