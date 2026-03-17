<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductMedia extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'media_type', 'url', 'public_id', 'is_primary', 'sort_order'];

    protected $casts = ['is_primary' => 'boolean'];

    protected $appends = ['full_url'];

    public function getFullUrlAttribute()
    {
        $url = $this->url ?? null;
        if (!$url) return null;
        if (str_starts_with($url, 'http')) return $url;
        
        // Remove leading slash if exists
        $cleanUrl = ltrim($url, '/');
        
        // If it already starts with storage/, just use asset()
        if (str_starts_with($cleanUrl, 'storage/')) {
            return asset($cleanUrl);
        }
        
        return asset('storage/' . $cleanUrl);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
