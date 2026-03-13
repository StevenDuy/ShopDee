<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_option_values', function (Blueprint $table) {
            // Self-referential FK: sub-values point to their parent value
            $table->unsignedBigInteger('parent_id')->nullable()->after('product_option_id');
            $table->foreign('parent_id')
                  ->references('id')
                  ->on('product_option_values')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('product_option_values', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn('parent_id');
        });
    }
};
