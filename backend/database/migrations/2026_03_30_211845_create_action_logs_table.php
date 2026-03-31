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
        Schema::create('action_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('type'); // GPS_TICK, CLICK, PAGE_VIEW, INTERACTION, FRAUD_SIM
            $table->json('payload')->nullable(); // Metadata: hardware, path, speed, browser
            $table->decimal('lat', 10, 8)->nullable();
            $table->decimal('lng', 11, 8)->nullable();
            $table->boolean('is_anomaly')->default(false); // Sandbox: Mark for AI Training
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index('type');
            $table->index('is_anomaly');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('action_logs');
    }
};
