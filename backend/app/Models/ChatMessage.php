<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = ['conversation_id', 'sender_id', 'message_text', 'product_id', 'media_url', 'is_read'];

    protected $casts = ['is_read' => 'boolean'];

    public function product()
    {
        return $this->belongsTo(Product::class)->with('media');
    }

    public function conversation()
    {
        return $this->belongsTo(ChatConversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
