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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');

            $table->string('name');
            $table->string('slug')->unique(); // For URL friendly names
            $table->string('brand')->nullable();
            $table->string('sku')->unique()->nullable(); // Stock Keeping Unit

            // Physical attributes mone rakhte hobe
            $table->string('color')->nullable();
            $table->decimal('weight', 8, 2)->nullable(); // 999999.99
            $table->decimal('length', 8, 2)->nullable();
            $table->decimal('width', 8, 2)->nullable();

            $table->decimal('price', 10, 2);
            $table->integer('stock')->default(0);

            $table->text('description'); // Mapped to productDetails
            $table->string('image')->nullable();

            $table->timestamps();
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
