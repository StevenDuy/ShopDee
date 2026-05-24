<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ============================================================
        // USERS TABLE - đăng nhập lookup theo email rất quan trọng
        // ============================================================
        Schema::table('users', function (Blueprint $table) {
            // email đã có unique index từ migration gốc
            // Thêm index cho role_id để lọc theo vai trò nhanh hơn
            if (!$this->indexExists('users', 'users_role_id_status_index')) {
                $table->index(['role_id', 'status'], 'users_role_id_status_index');
            }
        });

        // ============================================================
        // NOTIFICATIONS TABLE - query unread count rất chậm hiện tại
        // ============================================================
        Schema::table('notifications', function (Blueprint $table) {
            if (!$this->indexExists('notifications', 'notif_user_read_idx')) {
                // Compound index: user_id + is_read - dùng cho cả filter lẫn count
                $table->index(['user_id', 'is_read'], 'notif_user_read_idx');
            }
            if (!$this->indexExists('notifications', 'notif_user_created_idx')) {
                // Sort by created_at khi load danh sách notification
                $table->index(['user_id', 'created_at'], 'notif_user_created_idx');
            }
        });

        // ============================================================
        // CHAT_CONVERSATIONS TABLE - lookup conversation của user
        // ============================================================
        Schema::table('chat_conversations', function (Blueprint $table) {
            if (!$this->indexExists('chat_conversations', 'conv_user1_updated_idx')) {
                $table->index(['user1_id', 'updated_at'], 'conv_user1_updated_idx');
            }
            if (!$this->indexExists('chat_conversations', 'conv_user2_updated_idx')) {
                $table->index(['user2_id', 'updated_at'], 'conv_user2_updated_idx');
            }
        });

        // ============================================================
        // CHAT_MESSAGES TABLE - đếm unread + load messages
        // ============================================================
        Schema::table('chat_messages', function (Blueprint $table) {
            if (!$this->indexExists('chat_messages', 'msg_conv_read_sender_idx')) {
                // Compound: dùng cho cả unreadCounts query lẫn messages list
                $table->index(['conversation_id', 'is_read', 'sender_id'], 'msg_conv_read_sender_idx');
            }
            if (!$this->indexExists('chat_messages', 'msg_conv_created_idx')) {
                // Sort messages by created_at
                $table->index(['conversation_id', 'created_at'], 'msg_conv_created_idx');
            }
        });

        // ============================================================
        // ORDERS TABLE - seller dashboard + customer orders
        // ============================================================
        Schema::table('orders', function (Blueprint $table) {
            if (!$this->indexExists('orders', 'orders_seller_status_created_idx')) {
                $table->index(['seller_id', 'status', 'created_at'], 'orders_seller_status_created_idx');
            }
            if (!$this->indexExists('orders', 'orders_customer_created_idx')) {
                $table->index(['customer_id', 'created_at'], 'orders_customer_created_idx');
            }
        });

        // ============================================================
        // PRODUCTS TABLE - filter by seller, status, category
        // ============================================================
        Schema::table('products', function (Blueprint $table) {
            if (!$this->indexExists('products', 'products_seller_status_created_idx')) {
                $table->index(['seller_id', 'status', 'created_at'], 'products_seller_status_created_idx');
            }
        });

        // ============================================================
        // PERSONAL_ACCESS_TOKENS - Sanctum auth lookup (RẤT QUAN TRỌNG)
        // ============================================================
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // tokenable_id + tokenable_type đã có index từ Sanctum
            // Nhưng thêm index cho tokenable_id riêng để lookup nhanh hơn
            if (!$this->indexExists('personal_access_tokens', 'pat_tokenable_id_idx')) {
                $table->index('tokenable_id', 'pat_tokenable_id_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_id_status_index');
        });
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notif_user_read_idx');
            $table->dropIndex('notif_user_created_idx');
        });
        Schema::table('chat_conversations', function (Blueprint $table) {
            $table->dropIndex('conv_user1_updated_idx');
            $table->dropIndex('conv_user2_updated_idx');
        });
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropIndex('msg_conv_read_sender_idx');
            $table->dropIndex('msg_conv_created_idx');
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_seller_status_created_idx');
            $table->dropIndex('orders_customer_created_idx');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_seller_status_created_idx');
        });
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropIndex('pat_tokenable_id_idx');
        });
    }

    /**
     * Kiểm tra index đã tồn tại chưa (tránh lỗi duplicate)
     */
    private function indexExists(string $table, string $indexName): bool
    {
        try {
            $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
            return count($indexes) > 0;
        } catch (\Throwable $e) {
            return false;
        }
    }
};
