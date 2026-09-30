<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'courier_name')) {
                $table->string('courier_name', 50)->nullable()->after('courier_invoice_id');
            }
            if (!Schema::hasColumn('orders', 'courier_consignment_id')) {
                $table->string('courier_consignment_id', 100)->nullable()->after('courier_name');
            }
            if (!Schema::hasColumn('orders', 'courier_tracking_code')) {
                $table->string('courier_tracking_code', 100)->nullable()->after('courier_consignment_id');
            }
            if (!Schema::hasColumn('orders', 'courier_status')) {
                $table->string('courier_status', 50)->nullable()->after('courier_tracking_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $cols = [];
            foreach (['courier_name', 'courier_consignment_id', 'courier_tracking_code', 'courier_status'] as $col) {
                if (Schema::hasColumn('orders', $col)) {
                    $cols[] = $col;
                }
            }
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
