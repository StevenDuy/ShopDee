<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NotificationController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'link' => 'nullable|url',
            'attachments.*' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $attachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                // Ensure the directory exists or just let store handle it
                $path = $file->store('notifications', 'public');
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'url' => asset('storage/' . $path), // Using asset() for complete URL
                    'type' => $file->getClientMimeType(),
                ];
            }
        }

        // Data structure matching what frontend expects in its 'n.data' or logic
        $dataBlob = [
            'title' => $request->title,
            'message' => $request->message,
            'link' => $request->link,
            'attachments' => $attachments,
        ];

        // Broadcast to all users
        // Note: For large user bases, this should be a background job.
        $users = User::all();
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
        $notification->delete();

        return response()->json(['message' => 'Notification deleted successfully']);
    }
}
