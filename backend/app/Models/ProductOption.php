<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductOption extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'option_name'];

    /**
     * Only top-level values (parent_id IS NULL), each with their sub_values.
     */
    public function values()
    {
        return $this->hasMany(ProductOptionValue::class)
                    ->whereNull('parent_id')
                    ->with('subValues');
    }
}
