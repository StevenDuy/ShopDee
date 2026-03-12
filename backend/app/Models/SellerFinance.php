<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SellerFinance extends Model
{
    use HasFactory;

    protected $fillable = ['seller_id', 'order_id', 'type', 'amount', 'description', 'status'];

    protected $casts = ['amount' => 'decimal:2'];

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
