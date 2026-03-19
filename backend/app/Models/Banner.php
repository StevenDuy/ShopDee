<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'image_path',
        'link_url',
        'active',
        'order',
        'product_id',
        'public_id'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
