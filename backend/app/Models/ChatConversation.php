<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatConversation extends Model
{
    use HasFactory;

    protected $fillable = ['user1_id', 'user2_id', 'last_message_at'];

    protected $casts = ['last_message_at' => 'datetime'];

    public function user1()
    {
        // belongsTo không JOIN nên select bình thường không bị ambiguous
        return $this->belongsTo(User::class, 'user1_id');
    }

    public function user2()
    {
        return $this->belongsTo(User::class, 'user2_id');
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id');
    }

    /**
     * latestMessage: dùng latestOfMany để lấy tin nhắn cuối cùng hiệu quả
     * (Laravel tự dùng subquery thay vì load toàn bộ rồi lấy cuối)
     */
    public function latestMessage()
    {
        // QUAN TRỌNG: latestOfMany() tạo JOIN nội bộ với bảng latestOfMany
        // Cả 2 bảng đều có cột 'conversation_id' → MySQL báo ambiguous
        // Giải pháp: KHÔNG dùng select() ở đây, để Laravel tự xử lý
        // Thay vào đó filter cột ở tầng Controller khi cần
        return $this->hasOne(ChatMessage::class, 'conversation_id')->latestOfMany();
    }
}
