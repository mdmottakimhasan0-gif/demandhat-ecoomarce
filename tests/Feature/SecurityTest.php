<?php

use App\Models\User;
use App\Models\Category;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guest cannot access admin dashboard and order index', function () {
    $response = $this->get('/admin/orders');
    $response->assertRedirect('/login');
});

test('customer cannot access management pages', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $response = $this->actingAs($customer)->get('/admin/users');
    $response->assertRedirect('/dashboard');
});

test('cart rejects invalid quantities via validation constraints', function () {
    $category = Category::create(['name' => 'Cart Cat']);
    $product = \App\Models\Product::create([
        'category_id' => $category->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'price' => 100,
        'stock' => 100,
        'description' => 'Details',
        'quick_view' => 'Quick View',
        'bussiness_class' => 'normal',
    ]);

    // Negative Testing: Try to add quantity greater than maximum allowed limit (50)
    $response = $this->post('/cart/add', [
        'product_id' => $product->id,
        'quantity' => 100, // Limit is 50
    ]);

    $response->assertSessionHasErrors(['quantity']);

    // Negative Testing: Try to add negative quantity
    $response = $this->post('/cart/add', [
        'product_id' => $product->id,
        'quantity' => -5,
    ]);

    $response->assertSessionHasErrors(['quantity']);
});

test('admin product store validation rejects images larger than 500KB', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $category = Category::create(['name' => 'Test Cat']);

    Storage::fake('public');

    // Negative Testing: Upload an image file of 600 Kilobytes (larger than 500KB limit)
    $oversizedImage = UploadedFile::fake()->image('product.jpg')->size(600); 

    $response = $this->actingAs($admin)->post('/admin/products', [
        'productName' => 'New Product',
        'category' => $category->id,
        'price' => 100,
        'stock' => 10,
        'productDetails' => 'Details',
        'image' => $oversizedImage,
        'bussiness_class' => 'normal',
    ]);

    $response->assertSessionHasErrors(['image']);
});
