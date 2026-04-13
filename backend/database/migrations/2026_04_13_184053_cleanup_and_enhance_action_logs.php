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
            // Xóa các cột thừa
            $table->dropColumn(['distance_jump', 'address_changes', 'click_count']);

            // Thêm các cột hành vi chi tiết
            $table->string('path')->nullable()->after('type'); // Trang hiện tại
            $table->string('prev_path')->nullable()->after('path'); // Trang trước đó
            $table->integer('nav_time_ms')->nullable()->after('prev_path'); // Thời gian chuyển trang
            $table->decimal('avg_purchase_value', 15, 2)->nullable()->after('purchase_value'); // Giá trị mua hàng TB lịch sử
            $table->boolean('is_fraud_labeled')->default(false)->after('is_anomaly'); // Nhãn do Admin gắn
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('action_logs', function (Blueprint $table) {
            $table->dropColumn(['path', 'prev_path', 'nav_time_ms', 'avg_purchase_value', 'is_fraud_labeled']);
            $table->decimal('distance_jump', 10, 2)->nullable();
            $table->integer('address_changes')->default(0);
            $table->integer('click_count')->default(0);
        });
    }
};
