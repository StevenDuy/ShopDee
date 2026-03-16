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
        Schema::table('moderation_reports', function (Blueprint $table) {
            $table->unsignedBigInteger('reported_review_id')->nullable()->after('reported_product_id');
            $table->unsignedBigInteger('reported_message_id')->nullable()->after('reported_review_id');

            $table->foreign('reported_review_id')->references('id')->on('reviews')->onDelete('set null');
            $table->foreign('reported_message_id')->references('id')->on('chat_messages')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('moderation_reports', function (Blueprint $table) {
            $table->dropForeign(['reported_review_id']);
            $table->dropForeign(['reported_message_id']);
            $table->dropColumn(['reported_review_id', 'reported_message_id']);
        });
    }
};
