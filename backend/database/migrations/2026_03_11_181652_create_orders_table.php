<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('seller_id');
            $table->unsignedBigInteger('shipping_address_id')->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->enum('status', ['pending', 'paid', 'shipping', 'completed', 'cancelled', 'refunded'])->default('pending');
            $table->enum('payment_method', ['cod', 'bank_transfer', 'momo', 'vnpay'])->default('cod');
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('seller_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('shipping_address_id')->references('id')->on('addresses')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
