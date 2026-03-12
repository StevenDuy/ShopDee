<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user1_id'); // usually customer
            $table->unsignedBigInteger('user2_id'); // usually seller
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->foreign('user1_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('user2_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['user1_id', 'user2_id']); // Only one conversation per user pair
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_conversations');
    }
};
