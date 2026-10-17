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
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'colors')) {
                $table->json('colors')->nullable()->after('color');
            }
            if (!Schema::hasColumn('products', 'sizes')) {
                $table->json('sizes')->nullable()->after('colors');
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'color')) {
                $table->string('color', 100)->nullable()->after('product_name');
            }
            if (!Schema::hasColumn('order_items', 'size')) {
                $table->string('size', 100)->nullable()->after('color');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'sizes')) {
                $table->dropColumn('sizes');
            }
            if (Schema::hasColumn('products', 'colors')) {
                $table->dropColumn('colors');
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (Schema::hasColumn('order_items', 'size')) {
                $table->dropColumn('size');
            }
            if (Schema::hasColumn('order_items', 'color')) {
                $table->dropColumn('color');
            }
        });
    }
};
