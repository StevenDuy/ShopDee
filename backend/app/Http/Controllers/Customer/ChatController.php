<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Events\NewChatMessage;
use Illuminate\Support\Facades\Storage;
use App\Models\Product;

class ChatController extends Controller
{
    /**
     * Danh sách conversations - tối ưu: chỉ select cột cần thiết cho user
     */
    public function conversations(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = ChatConversation::select(
                'chat_conversations.id',
                'chat_conversations.user1_id',
                'chat_conversations.user2_id',
                'chat_conversations.updated_at',
                'chat_conversations.created_at'
            )
            ->with([
                // Dùng cú pháp 'relation:col1,col2' - Laravel tự thêm FK
                'user1:id,name,email,role_id',
                'user2:id,name,email,role_id',
                // latestMessage KHÔNG dùng select() ở Model vì gây lỗi ambiguous
                // Thay vào đó dùng cú pháp shorthand ở đây
                'latestMessage',
            ])
            ->withCount(['messages as unread_count' => function ($query) use ($userId) {
                $query->where('sender_id', '!=', $userId)->where('is_read', false);
            }])
            ->where(function ($query) use ($userId) {
                $query->where('user1_id', $userId)->orWhere('user2_id', $userId);
            })
            ->orderBy('chat_conversations.updated_at', 'desc')
            ->get()
            ->map(function ($conv) use ($userId) {
                $otherUser = $conv->user1_id === $userId ? $conv->user2 : $conv->user1;

                // Chỉ giữ các trường cần thiết của other_user
                $conv->other_user = $otherUser ? [
                    'id'      => $otherUser->id,
                    'name'    => $otherUser->name,
                    'email'   => $otherUser->email,
                    'role_id' => $otherUser->role_id,
                ] : null;

                // Chỉ giữ các trường cần thiết của last_message
                if ($conv->latestMessage) {
                    $conv->last_message = [
                        'id'           => $conv->latestMessage->id,
                        'sender_id'    => $conv->latestMessage->sender_id,
                        'message_text' => $conv->latestMessage->message_text,
                        'media_url'    => $conv->latestMessage->media_url,
                        'product_id'   => $conv->latestMessage->product_id,
                        'is_read'      => $conv->latestMessage->is_read,
                        'created_at'   => $conv->latestMessage->created_at,
                    ];
                } else {
                    $conv->last_message = null;
                }

                unset($conv->user1, $conv->user2, $conv->latestMessage);
                return $conv;
            });

        return response()->json($conversations);
    }

    /**
     * Lấy messages - tối ưu: dùng 1 query UPDATE kết hợp, giảm round-trip
     */
    public function messages(Request $request, $id)
    {
        $userId = $request->user()->id;

        // Kiểm tra quyền truy cập conversation bằng query đơn giản
        $conversation = ChatConversation::select('id', 'user1_id', 'user2_id', 'updated_at')
            ->where('id', $id)
            ->where(function ($query) use ($userId) {
                $query->where('user1_id', $userId)->orWhere('user2_id', $userId);
            })
            ->firstOrFail();

        // Mark as read: UPDATE trực tiếp (không cần load từng record)
        ChatMessage::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        // Load messages: chỉ select cột cần thiết
        $messages = ChatMessage::select(
                'id', 'conversation_id', 'sender_id', 'message_text',
                'media_url', 'product_id', 'is_read', 'created_at'
            )
            ->with(['product:id,title,price,sale_price,slug', 'product.media:id,product_id,url,is_primary'])
            ->where('conversation_id', $conversation->id)
            ->orderBy('created_at', 'desc')
            ->paginate(30);

        return response()->json([
            'conversation' => $conversation,
            'messages'     => $messages->items(),
            'pagination'   => [
                'current_page' => $messages->currentPage(),
                'last_page'    => $messages->lastPage(),
                'has_more'     => $messages->hasMorePages(),
            ],
        ]);
    }

    /**
     * Bắt đầu/tìm conversation - tối ưu: dùng firstOrCreate thay vì 2 query
     */
    public function startConversation(Request $request)
    {
        $request->validate([
            'target_user_id' => 'required|exists:users,id',
        ]);

        $userId   = $request->user()->id;
        $targetId = (int) $request->target_user_id;

        if ($userId === $targetId) {
            return response()->json(['message' => 'Cannot chat with yourself'], 400);
        }

        // Dùng 1 query tìm conversation theo cả 2 chiều
        $conversation = ChatConversation::select('id', 'user1_id', 'user2_id', 'updated_at')
            ->where(function ($q) use ($userId, $targetId) {
                $q->where('user1_id', $userId)->where('user2_id', $targetId);
            })
            ->orWhere(function ($q) use ($userId, $targetId) {
                $q->where('user1_id', $targetId)->where('user2_id', $userId);
            })
            ->first();

        if (!$conversation) {
            $conversation = ChatConversation::create([
                'user1_id' => $userId,
                'user2_id' => $targetId,
            ]);
        }

        $conversation->load(['user1:id,name,email,role_id', 'user2:id,name,email,role_id']);
        $conversation->other_user = $conversation->user1_id === $userId
            ? $conversation->user2
            : $conversation->user1;

        unset($conversation->user1, $conversation->user2);

        return response()->json($conversation);
    }

    /**
     * Gửi tin nhắn
     */
    public function sendMessage(Request $request, $id)
    {
        $request->validate([
            'message_text' => 'nullable|string',
            'media_url'    => 'nullable|string',
            'file'         => 'nullable|file|image|max:10240',
            'product_id'   => 'nullable|exists:products,id',
        ]);

        $userId = $request->user()->id;

        $conversation = ChatConversation::select('id', 'user1_id', 'user2_id')
            ->where('id', $id)
            ->where(function ($query) use ($userId) {
                $query->where('user1_id', $userId)->orWhere('user2_id', $userId);
            })
            ->firstOrFail();

        $mediaUrl = $request->media_url;

        if ($request->hasFile('file')) {
            try {
                $diskName = env('FILESYSTEM_DISK', 'public');
                $path     = Storage::disk($diskName)->putFile('chats', $request->file('file'));
                $mediaUrl = Storage::disk($diskName)->url($path);
            } catch (\Throwable $e) {
                Log::error('File upload failed: ' . $e->getMessage());
            }
        }

        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $userId,
            'message_text'    => $request->message_text,
            'media_url'       => $mediaUrl,
            'product_id'      => $request->product_id,
            'is_read'         => false,
        ]);

        // Cập nhật updated_at để sort conversation lên đầu
        $conversation->touch();

        $message->load(['product:id,title,price,sale_price,slug', 'product.media:id,product_id,url,is_primary']);

        broadcast(new NewChatMessage($message))->toOthers();

        return response()->json($message, 201);
    }

    /**
     * Xóa conversation
     */
    public function destroyConversation(Request $request, $id)
    {
        $userId = $request->user()->id;

        $conversation = ChatConversation::where('id', $id)
            ->where(function ($query) use ($userId) {
                $query->where('user1_id', $userId)->orWhere('user2_id', $userId);
            })
            ->firstOrFail();

        $conversation->delete();

        return response()->json(['message' => 'Conversation deleted']);
    }

    /**
     * Lấy sản phẩm của shop để đính kèm trong tin nhắn
     */
    public function shopProducts(Request $request, $shopId)
    {
        $products = Product::select('id', 'seller_id', 'title', 'price', 'sale_price', 'slug', 'status')
            ->where('seller_id', $shopId)
            ->where('status', 'active')
            ->with(['media:id,product_id,url,is_primary'])
            ->latest()
            ->limit(10)
            ->get();

        return response()->json($products);
    }

    /**
     * Tìm kiếm users để nhắn tin
     */
    public function searchUsers(Request $request)
    {
        $user   = $request->user();
        $search = $request->get('search');

        $query = User::select('id', 'name', 'email', 'role_id')
            ->with('profile:user_id,avatar_url,shop_name,contact_phone')
            ->where('id', '!=', $user->id);

        if ($user->role_id === 1) {
            // Admin thấy tất cả
        } elseif ($user->role_id === 2) {
            $query->where('role_id', 3); // Seller thấy Customer
        } else {
            $query->where('role_id', 2); // Customer thấy Seller
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->limit(20)->get());
    }

    /**
     * Broadcast trạng thái đang gõ
     */
    public function typing(Request $request, $id)
    {
        $request->validate(['is_typing' => 'required|boolean']);

        $userId = $request->user()->id;

        $conversation = ChatConversation::select('id')
            ->where('id', $id)
            ->where(function ($query) use ($userId) {
                $query->where('user1_id', $userId)->orWhere('user2_id', $userId);
            })
            ->firstOrFail();

        broadcast(new \App\Events\UserTyping($conversation->id, $userId, $request->is_typing))->toOthers();

        return response()->json(['status' => 'success']);
    }
}
