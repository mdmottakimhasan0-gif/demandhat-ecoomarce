<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Generic key/value store for website settings (first user: order protection).
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('blocked_order_sources', function (Blueprint $table) {
            $table->id();
            $table->string('type', 10);          // ip | phone
            $table->string('value', 64);         // exact IP, CIDR range, or 01XXXXXXXXX
            $table->string('reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['type', 'value']);
        });

        // Additive: needed for the per-IP order limit. Existing rows stay NULL.
        Schema::table('orders', function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable()->after('phone');
            $table->index(['ip_address', 'created_at'], 'orders_ip_created_index');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_ip_created_index');
            $table->dropColumn('ip_address');
        });
        Schema::dropIfExists('blocked_order_sources');
        Schema::dropIfExists('site_settings');
    }
};
