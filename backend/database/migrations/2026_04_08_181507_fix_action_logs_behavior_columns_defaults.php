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
        Schema::table('action_logs', function (Blueprint $table) {
            $table->decimal('duration_ms', 10, 2)->default(0)->nullable()->change();
            $table->decimal('distance_jump', 12, 2)->default(0)->nullable()->change();
            $table->integer('wrong_password_attempts')->default(0)->nullable()->change();
            $table->integer('address_changes')->default(0)->nullable()->change();
            $table->integer('click_speed_ms')->default(0)->nullable()->change();
            $table->integer('purchase_quantity')->default(0)->nullable()->change();
            $table->decimal('purchase_value', 15, 2)->default(0)->nullable()->change();
            $table->integer('click_count')->default(0)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('action_logs', function (Blueprint $table) {
            // No need to revert specifically for this fix, 
            // but we could set them back to non-nullable if needed.
        });
    }
};
