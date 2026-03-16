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
        Schema::table('banners', function (Blueprint $table) {
            if (!Schema::hasColumn('banners', 'product_id')) {
                $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('cascade');
            }
            if (Schema::hasColumn('banners', 'link_url')) {
                $table->dropColumn('link_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            if (!Schema::hasColumn('banners', 'link_url')) {
               $table->string('link_url')->nullable();
            }
        });
    }
};
