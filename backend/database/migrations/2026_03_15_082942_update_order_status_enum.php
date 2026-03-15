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
        Schema::table('orders', function (Blueprint $table) {
            // Use raw query for enum modification as it's more reliable across DB engines
            $table->string('status')->default('pending')->change();
        });
        
        // If we want to keep it as enum, we can run a raw statement after changing to string and back, 
        // but string is more flexible for development.
        // For now, let's just make it a string to avoid enum issues, or use raw for MySQL:
        // DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned') DEFAULT 'pending'");
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });
    }
};
