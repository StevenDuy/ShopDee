<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductOptionValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_option_id',
        'parent_id',        // null = top-level value; non-null = sub-value
        'option_value',
        'price_adjustment',
        'stock_quantity',
    ];

    /** Sub-values (children) of this value */
    public function subValues()
    {
        return $this->hasMany(ProductOptionValue::class, 'parent_id');
    }

    /** Parent value (null for top-level) */
    public function parent()
    {
        return $this->belongsTo(ProductOptionValue::class, 'parent_id');
    }
}
