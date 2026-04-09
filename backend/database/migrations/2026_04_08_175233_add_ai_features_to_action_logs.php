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
            if (!Schema::hasColumn('action_logs', 'duration_ms')) {
                $table->integer('duration_ms')->default(0)->after('type');
            }
            if (!Schema::hasColumn('action_logs', 'distance_jump')) {
                $table->decimal('distance_jump', 12, 2)->default(0)->after('duration_ms');
            }
            if (!Schema::hasColumn('action_logs', 'wrong_password_attempts')) {
                $table->integer('wrong_password_attempts')->default(0)->after('distance_jump');
            }
            if (!Schema::hasColumn('action_logs', 'address_changes')) {
                $table->integer('address_changes')->default(0)->after('wrong_password_attempts');
            }
            if (!Schema::hasColumn('action_logs', 'click_speed_ms')) {
                $table->integer('click_speed_ms')->default(0)->after('address_changes');
            }
            if (!Schema::hasColumn('action_logs', 'purchase_quantity')) {
                $table->integer('purchase_quantity')->default(0)->after('click_speed_ms');
            }
            if (!Schema::hasColumn('action_logs', 'purchase_value')) {
                $table->decimal('purchase_value', 15, 2)->default(0)->after('purchase_quantity');
            }
            if (!Schema::hasColumn('action_logs', 'click_count')) {
                $table->integer('click_count')->default(0)->after('purchase_value');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('action_logs', function (Blueprint $table) {
            $table->dropColumn([
                'duration_ms',
                'distance_jump',
                'wrong_password_attempts',
                'address_changes',
                'click_speed_ms',
                'purchase_quantity',
                'purchase_value',
                'click_count',
            ]);
        });
    }
};
