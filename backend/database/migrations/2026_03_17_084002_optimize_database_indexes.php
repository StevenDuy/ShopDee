<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add indexes to improve query performance
        Schema::table('products', function (Blueprint $table) {
            $table->index('seller_id');
            $table->index('category_id');
            $table->index('status');
            $table->index('created_at');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index('customer_id');
            $table->index('seller_id');
            $table->index('status');
            $table->index('created_at');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->index('order_id');
            $table->index('product_id');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->index('product_id');
            $table->index('rating');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->index('parent_id');
            $table->index('is_active');
        });

        Schema::table('product_media', function (Blueprint $table) {
            $table->index('product_id');
            $table->index(['product_id', 'is_primary']);
        });

        Schema::table('product_attributes', function (Blueprint $table) {
            $table->index('product_id');
        });

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->index('conversation_id');
            $table->index('sender_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['seller_id']);
            $table->dropIndex(['category_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['customer_id']);
            $table->dropIndex(['seller_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['order_id']);
            $table->dropIndex(['product_id']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
            $table->dropIndex(['rating']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['parent_id']);
            $table->dropIndex(['is_active']);
        });

        Schema::table('product_media', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
            $table->dropIndex(['product_id', 'is_primary']);
        });

        Schema::table('product_attributes', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
        });

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropIndex(['conversation_id']);
            $table->dropIndex(['sender_id']);
        });
    }
};
