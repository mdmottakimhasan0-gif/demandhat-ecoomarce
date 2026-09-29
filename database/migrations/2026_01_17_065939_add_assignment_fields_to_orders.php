<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_xx_xx_xxxxxx_add_assignment_fields_to_orders.php

    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            // Who is supposed to work on this order
            $table->unsignedBigInteger('assigned_to')->nullable()->after('user_id');

            // Who actually completed/confirmed the order
            $table->unsignedBigInteger('authorized_by')->nullable()->after('assigned_to');

            // Foreign keys for safety
            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
            $table->foreign('authorized_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropForeign(['authorized_by']);
            $table->dropColumn(['assigned_to', 'authorized_by']);
        });
    }
};
