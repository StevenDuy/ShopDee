<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role_id !== 1) {
            // Customer/Seller: chỉ select cột cần thiết, không load user relation
            $notifications = Notification::select('id', 'user_id', 'type', 'title', 'message', 'data', 'is_read', 'created_at')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate(20);
        } else {
            // Admin: dùng raw GROUP BY nhanh hơn subquery IN
            $notifications = Notification::select('id', 'user_id', 'type', 'title', 'message', 'data', 'is_read', 'created_at')
                ->where(function ($q) {
                    $q->whereNull(DB::raw("JSON_UNQUOTE(JSON_EXTRACT(data, '$.batch_id'))"))
                      ->orWhereIn('id', function ($sub) {
                          $sub->selectRaw('MIN(id)')
                              ->from('notifications')
                              ->whereNotNull(DB::raw("JSON_UNQUOTE(JSON_EXTRACT(data, '$.batch_id'))"))
                              ->groupBy(DB::raw("JSON_UNQUOTE(JSON_EXTRACT(data, '$.batch_id'))"));
                      });
                })
                ->orderBy('created_at', 'desc')
                ->paginate(20);
        }

        return response()->json($notifications);
    }

    public function markAsRead(Request $request, $id)
    {
        // Dùng update trực tiếp thay vì load model rồi save (tiết kiệm 1 query)
        $updated = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->update(['is_read' => true]);

        if (!$updated) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * API quan trọng nhất - được gọi liên tục từ frontend
     * Tối ưu: dùng 1 raw query GROUP BY thay vì 2 query riêng lẻ + whereHas
     */
    public function unreadCounts(Request $request)
    {
        $userId = $request->user()->id;

        // Dùng UNION để gộp cả 2 count vào 1 round-trip tới database
        $result = DB::selectOne("
            SELECT
                SUM(CASE WHEN type = 'notification' THEN cnt ELSE 0 END) as notifications,
                SUM(CASE WHEN type = 'message' THEN cnt ELSE 0 END) as messages
            FROM (
                SELECT 'notification' as type, COUNT(*) as cnt
                FROM notifications
                WHERE user_id = ? AND is_read = 0

                UNION ALL

                SELECT 'message' as type, COUNT(*) as cnt
                FROM chat_messages cm
                INNER JOIN chat_conversations cc ON cc.id = cm.conversation_id
                WHERE (cc.user1_id = ? OR cc.user2_id = ?)
                  AND cm.sender_id != ?
                  AND cm.is_read = 0
            ) counts
        ", [$userId, $userId, $userId, $userId]);

        $notifCount = (int) ($result->notifications ?? 0);
        $msgCount   = (int) ($result->messages ?? 0);

        return response()->json([
            'notifications' => $notifCount,
            'messages'      => $msgCount,
            'total'         => $notifCount + $msgCount,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $query = Notification::where('id', $id);

        if ($user->role_id !== 1) {
            $query->where('user_id', $user->id);
        }

        $notification = $query->firstOrFail();

        // Admin xóa cả batch
        if ($user->role_id === 1 && isset($notification->data['batch_id'])) {
            $batchId = $notification->data['batch_id'];
            Notification::whereJsonContains('data->batch_id', $batchId)->delete();
            return response()->json(['message' => 'Notification batch deleted successfully']);
        }

        $notification->delete();

        return response()->json(['message' => 'Notification deleted successfully']);
    }
}
