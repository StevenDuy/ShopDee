<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'customer_id', 'order_item_id', 'rating', 'comment', 'media'];

    protected $casts = [
        'media' => 'array',
    ];

    protected $appends = ['resolved_media'];

    public function getResolvedMediaAttribute()
    {
        $media = $this->media ?? [];
        return array_map(function($path) {
            if (str_starts_with($path, 'http')) return $path;
            
            // Resolve local storage paths
            $cleanPath = ltrim($path, '/');
            if (str_starts_with($cleanPath, 'storage/')) {
                return asset($cleanPath);
            }
            return asset('storage/' . $cleanPath);
        }, $media);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }
}
