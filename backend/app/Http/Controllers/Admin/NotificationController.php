<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'link' => 'nullable|url',
            'role' => 'nullable|string|in:all,customer,seller'
        ]);

        $roleType = $request->role ?? 'all';

        $batchId = (string) \Illuminate\Support\Str::uuid();
        $dataBlob = [
            'title' => $request->title,
            'message' => $request->message,
            'link' => $request->link,
            'is_broadcast' => true,
            'target_role' => $roleType,
            'batch_id' => $batchId,
        ];

        $query = User::query();
        if ($roleType === 'customer') {
            $query->where('role_id', 3);
        } elseif ($roleType === 'seller') {
            $query->where('role_id', 2);
        }

        $users = $query->get();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'type' => 'system', // Must be one of enum: order, chat, system, review
                'data' => $dataBlob, 
                'is_read' => false,
            ]);
        }

        return response()->json(['message' => 'Notification broadcasted successfully'], 201);
    }

    public function destroy($id)
    {
        $notification = Notification::findOrFail($id);
        
        $data = $notification->data;
        if (isset($data['is_broadcast']) && $data['is_broadcast']) {
            // Delete FOR EVERYONE using batch_id or fallback to title/message
            $query = Notification::where('type', 'system');
            
            if (isset($data['batch_id'])) {
                $query->whereJsonContains('data->batch_id', $data['batch_id']);
            } else {
                $query->whereJsonContains('data->title', $data['title'])
                      ->whereJsonContains('data->message', $data['message']);
            }

            $query->delete();
            return response()->json(['message' => 'Broadcast deleted for all users']);
        }

        $notification->delete();
        return response()->json(['message' => 'Notification deleted successfully']);
    }
}
