<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = ['conversation_id', 'sender_id', 'message_text', 'media_url', 'is_read'];

    protected $casts = ['is_read' => 'boolean'];

    public function conversation()
    {
        return $this->belongsTo(ChatConversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
