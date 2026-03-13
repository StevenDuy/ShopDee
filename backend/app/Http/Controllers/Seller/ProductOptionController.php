<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionValue;
use Illuminate\Http\Request;

class ProductOptionController extends Controller
{
    /**
     * GET /seller/products/{productId}/options
     * Returns all options with top-level values (and their sub_values).
     */
    public function index(Request $request, $productId)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::where('seller_id', $request->user()->id)->findOrFail($productId);

        // values() already filters parent_id = null and loads subValues
        $options = $product->options()->with('values')->get();

        return response()->json($options);
    }

    /**
     * POST /seller/products/{productId}/options/sync
     *
     * Payload:
     * {
     *   "options": [
     *     {
     *       "option_name": "Color",
     *       "values": [
     *         {
     *           "option_value": "Red",
     *           "price_adjustment": 0,
     *           "stock_quantity": 50,
     *           "sub_values": [
     *             { "option_value": "Stripe", "price_adjustment": 5000, "stock_quantity": 25 },
     *             { "option_value": "Plain",  "price_adjustment": 0,    "stock_quantity": 25 }
     *           ]
     *         },
     *         ...
     *       ]
     *     },
     *     ...
     *   ]
     * }
     */
    public function sync(Request $request, $productId)
    {
        if ($request->user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product = Product::where('seller_id', $request->user()->id)->findOrFail($productId);

        $request->validate([
            'options'                                   => 'array',
            'options.*.option_name'                     => 'required|string|max:100',
            'options.*.values'                          => 'required|array|min:2',
            'options.*.values.*.option_value'           => 'required|string|max:100',
            'options.*.values.*.price_adjustment'       => 'numeric|min:0',
            'options.*.values.*.stock_quantity'         => 'integer|min:0',
            'options.*.values.*.sub_values'             => 'sometimes|array',
            'options.*.values.*.sub_values.*.option_value'      => 'sometimes|nullable|string|max:100',
            'options.*.values.*.sub_values.*.price_adjustment'  => 'sometimes|numeric|min:0',
            'options.*.values.*.sub_values.*.stock_quantity'    => 'sometimes|integer|min:0',
        ]);

        // Delete all existing options + values (cascade handles sub-values via parent_id FK)
        foreach ($product->options as $oldOption) {
            // Delete ALL values including sub-values for this option
            ProductOptionValue::where('product_option_id', $oldOption->id)->delete();
            $oldOption->delete();
        }

        // Re-create from payload
        foreach ($request->input('options', []) as $optData) {
            $option = ProductOption::create([
                'product_id'  => $product->id,
                'option_name' => $optData['option_name'],
            ]);

            foreach ($optData['values'] as $valData) {
                // Create top-level value
                $parentValue = ProductOptionValue::create([
                    'product_option_id' => $option->id,
                    'parent_id'         => null,
                    'option_value'      => $valData['option_value'],
                    'price_adjustment'  => max(0, (float)($valData['price_adjustment'] ?? 0)),
                    'stock_quantity'    => max(0, (int)($valData['stock_quantity'] ?? 0)),
                ]);

                // Create sub-values (max 2, skip if empty option_value)
                foreach (array_slice($valData['sub_values'] ?? [], 0, 2) as $subData) {
                    if (!empty(trim($subData['option_value'] ?? ''))) {
                        ProductOptionValue::create([
                            'product_option_id' => $option->id,
                            'parent_id'         => $parentValue->id,
                            'option_value'      => trim($subData['option_value']),
                            'price_adjustment'  => max(0, (float)($subData['price_adjustment'] ?? 0)),
                            'stock_quantity'    => max(0, (int)($subData['stock_quantity'] ?? 0)),
                        ]);
                    }
                }
            }
        }

        // Return fresh data
        $options = $product->fresh()->options()->with('values')->get();
        return response()->json($options);
    }
}
