<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seller_finances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('seller_id');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->enum('type', ['credit', 'debit'])->default('credit');
            $table->decimal('amount', 15, 2);
            $table->string('description')->nullable();
            $table->enum('status', ['pending', 'completed'])->default('pending');
            $table->timestamps();

            $table->foreign('seller_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seller_finances');
    }
};
