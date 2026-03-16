<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModerationReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'reporter_id', 'reported_user_id', 'reported_product_id',
        'reported_review_id', 'reported_message_id',
        'reason', 'status', 'admin_notes',
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reportedUser()
    {
        return $this->belongsTo(User::class, 'reported_user_id');
    }

    public function reportedProduct()
    {
        return $this->belongsTo(Product::class, 'reported_product_id');
    }

    public function reportedReview()
    {
        return $this->belongsTo(Review::class, 'reported_review_id');
    }

    public function reportedMessage()
    {
        return $this->belongsTo(ChatMessage::class, 'reported_message_id');
    }
}
