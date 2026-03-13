<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    // List all conversations for the user
    public function conversations(Request $request)
    {
        $userId = $request->user()->id;
        
        $conversations = ChatConversation::with(['user1', 'user2'])
            ->where('user1_id', $userId)
            ->orWhere('user2_id', $userId)
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($conv) use ($userId) {
                // Attach the "other user" for easy frontend rendering
                $conv->other_user = $conv->user1_id === $userId ? $conv->user2 : $conv->user1;
                
                // Get last message
                $conv->last_message = ChatMessage::where('conversation_id', $conv->id)
                    ->orderBy('created_at', 'desc')
                    ->first();
                return $conv;
            });

        return response()->json($conversations);
    }

    // Get messages for a specific conversation
    public function messages(Request $request, $id)
    {
        $userId = $request->user()->id;
        
        $conversation = ChatConversation::where(function ($query) use ($userId) {
            $query->where('user1_id', $userId)->orWhere('user2_id', $userId);
        })->findOrFail($id);

        $messages = ChatMessage::where('conversation_id', $conversation->id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'conversation' => $conversation,
            'messages'     => $messages
        ]);
    }

    // Start a conversation with a specific user (e.g., a seller)
    public function startConversation(Request $request)
    {
        $request->validate([
            'target_user_id' => 'required|exists:users,id'
        ]);

        $userId = $request->user()->id;
        $targetId = $request->target_user_id;

        if ($userId == $targetId) {
            return response()->json(['message' => 'Cannot chat with yourself'], 400);
        }

        // Check if conversation already exists
        $conversation = ChatConversation::where(function ($q) use ($userId, $targetId) {
            $q->where('user1_id', $userId)->where('user2_id', $targetId);
        })->orWhere(function ($q) use ($userId, $targetId) {
            $q->where('user1_id', $targetId)->where('user2_id', $userId);
        })->first();

        if (!$conversation) {
            $conversation = ChatConversation::create([
                'user1_id' => $userId,
                'user2_id' => $targetId
            ]);
        }

        return response()->json($conversation);
    }

    // Send a message
    public function sendMessage(Request $request, $id)
    {
        $request->validate([
            'message_text' => 'nullable|string',
            'media_url'    => 'nullable|string'
        ]);

        $userId = $request->user()->id;
        
        $conversation = ChatConversation::where(function ($query) use ($userId) {
            $query->where('user1_id', $userId)->orWhere('user2_id', $userId);
        })->findOrFail($id);

        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $userId,
            'message_text'    => $request->message_text,
            'media_url'       => $request->media_url,
            'is_read'         => false
        ]);

        // Push update to conversation updated_at for sorting
        $conversation->touch();

        // Broadcast to Reverb would go here if we set up an Event
        // event(new \App\Events\NewChatMessage($message));

        return response()->json($message, 201);
    }

    // New: Search for users to message
    public function searchUsers(Request $request)
    {
        $user = $request->user();
        $search = $request->get('search');
        
        $query = User::with('profile')->where('id', '!=', $user->id);

        if ($user->role_id === 1) {
            // Admin can see everyone
        } elseif ($user->role_id === 2) {
            // Seller can see Customers
            $query->where('role_id', 3);
        } else {
            // Customer can see Sellers
            $query->where('role_id', 2);
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->limit(20)->get();
        return response()->json($users);
    }
}
