<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CartController extends Controller
{
    public function index()
    {
        $cartItems = [];
        $subtotal = 0;

        // Use ONLY Session Logic now
        $sessionCart = session()->get('cart', []);

        if (!empty($sessionCart)) {
            $products = Product::whereIn('id', array_keys($sessionCart))->get();

            foreach ($products as $product) {
                $qty = $sessionCart[$product->id];

                $originalPrice = (float) $product->price;
                $discountPercent = $product->discount ? (float) $product->discount : 0;
                $discountedPrice = round($originalPrice - ($originalPrice * ($discountPercent / 100)));

                $cartItems[] = [
                    'id' => $product->id,
                    'name' => $product->name,
                    'image' => '/storage/' . $product->image,
                    'price' => $discountedPrice,
                    'original_price' => $originalPrice,
                    'discount_percent' => $discountPercent,
                    'quantity' => $qty,
                    'description' => $product->short_description ?? '',
                ];

                $subtotal += $discountedPrice * $qty;
            }
        }

        $totals = [
            'itemTotal' => $subtotal,
            'delivery' => $subtotal > 0 ? 60 : 0,
            'discount' => 0,
            'grandTotal' => $subtotal + ($subtotal > 0 ? 60 : 0)
        ];

        return Inertia::render('Customer/Cart', [
            'cartItems' => $cartItems,
            'totals' => $totals
        ]);
    }

    public function store(Request $request)
    {
        // 🛡️ SECURITY ADDED: Validate the request before doing anything!
        $request->validate([
            'product_id' => 'required|exists:products,id', // Make sure the product actually exists in the DB
            'quantity' => 'required|integer|min:1|max:50'  // Must be a number, no negatives, and limit to 50 items so they can't crash your server
        ]);

        $productId = $request->input('product_id');
        $quantity = $request->input('quantity', 1);

        $cart = session()->get('cart', []);
        $cart[$productId] = isset($cart[$productId]) ? $cart[$productId] + $quantity : $quantity;

        session()->put('cart', $cart);
        $this->syncCartToDatabase();
        return redirect()->back()->with('success', 'Product added to cart!');
    }



    public function update(Request $request, $id)
    {
        $cart = session()->get('cart', []);
        if (isset($cart[$id])) {
            $cart[$id] = max(1, $request->input('quantity'));
            session()->put('cart', $cart);
        }
        $this->syncCartToDatabase();
        return redirect()->back();
    }

    public function destroy($id)
    {
        $cart = session()->get('cart', []);
        if (isset($cart[$id])) {
            unset($cart[$id]);
            session()->put('cart', $cart);
        }
        $this->syncCartToDatabase();
        return redirect()->back();
    }

    protected function syncCartToDatabase()
    {
        if (auth()->check()) {
            $userId = auth()->id();
            $cart = session()->get('cart', []);

            \App\Models\Cart::where('user_id', $userId)->delete();

            foreach ($cart as $productId => $quantity) {
                \App\Models\Cart::create([
                    'user_id' => $userId,
                    'product_id' => $productId,
                    'quantity' => $quantity
                ]);
            }
        }
    }
}