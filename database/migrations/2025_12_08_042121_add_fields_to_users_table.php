<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('address')->nullable();
            $table->string('phone')->unique()->nullable();
            $table->string('role')->default('customer')->nullable();
            $table->string('otp')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->timestamp('otp_expires_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'address',
                'phone',
                'role',
                'otp',
                'phone_verified_at',
                'otp_expires_at',
            ]);
        });
    }
};
