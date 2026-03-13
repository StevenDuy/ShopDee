<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_option_values', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_option_id'); // FK to product_options
            $table->string('option_value');                  // e.g. "Red", "XL", "256GB"
            $table->decimal('price_adjustment', 15, 2)->default(0); // extra cost (>= 0)
            $table->unsignedInteger('stock_quantity')->default(0);
            $table->timestamps();

            $table->foreign('product_option_id')->references('id')->on('product_options')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_option_values');
    }
};
