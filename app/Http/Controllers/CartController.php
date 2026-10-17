<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CartController extends Controller
{
    public function index()
    {
        $cartItems = [];
        $subtotal = 0;

        $sessionCart = session()->get('cart', []);

        if (!empty($sessionCart)) {
            $productIds = [];
            foreach ($sessionCart as $key => $item) {
                $productIds[] = is_array($item) ? $item['product_id'] : $key;
            }
            $productIds = array_unique(array_filter($productIds));

            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

            foreach ($sessionCart as $cartKey => $item) {
                $pId = is_array($item) ? $item['product_id'] : $cartKey;
                $qty = is_array($item) ? ($item['quantity'] ?? 1) : $item;
                $color = is_array($item) ? ($item['color'] ?? null) : null;
                $size = is_array($item) ? ($item['size'] ?? null) : null;

                if (!$products->has($pId)) {
                    continue;
                }

                $product = $products->get($pId);
                $originalPrice = (float) $product->price;
                $discountPercent = $product->discount ? (float) $product->discount : 0;
                $discountedPrice = round($originalPrice - ($originalPrice * ($discountPercent / 100)));

                $cartItems[] = [
                    'id' => (string) $cartKey,
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'color' => $color,
                    'size' => $size,
                    'image' => '/storage/' . $product->image,
                    'price' => $discountedPrice,
                    'original_price' => $originalPrice,
                    'discount_percent' => $discountPercent,
                    'quantity' => $qty,
                    'bussiness_class' => $product->bussiness_class,
                    'stock' => $product->stock,
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
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1|max:50',
            'color' => 'nullable|string|max:100',
            'size' => 'nullable|string|max:100',
        ]);

        $productId = (int) $request->input('product_id');
        $quantity = (int) $request->input('quantity', 1);
        $color = $request->input('color') ? trim($request->input('color')) : null;
        $size = $request->input('size') ? trim($request->input('size')) : null;

        // Form unique key for product + variation combination
        $cartKey = (string) $productId;
        if ($color || $size) {
            $cartKey .= '-' . Str::slug($color ?? 'none') . '-' . Str::slug($size ?? 'none');
        }

        $cart = session()->get('cart', []);

        if (isset($cart[$cartKey])) {
            if (is_array($cart[$cartKey])) {
                $cart[$cartKey]['quantity'] = min(50, ($cart[$cartKey]['quantity'] ?? 1) + $quantity);
            } else {
                $cart[$cartKey] = min(50, $cart[$cartKey] + $quantity);
            }
        } else {
            $cart[$cartKey] = [
                'product_id' => $productId,
                'quantity' => $quantity,
                'color' => $color,
                'size' => $size,
            ];
        }

        session()->put('cart', $cart);
        $this->syncCartToDatabase();
        return redirect()->back()->with('success', 'Product added to cart!');
    }

    public function update(Request $request, $id)
    {
        $cart = session()->get('cart', []);
        if (isset($cart[$id])) {
            $newQty = max(1, min(50, (int) $request->input('quantity')));
            if (is_array($cart[$id])) {
                $cart[$id]['quantity'] = $newQty;
            } else {
                $cart[$id] = $newQty;
            }
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

            foreach ($cart as $key => $item) {
                $pId = is_array($item) ? $item['product_id'] : $key;
                $qty = is_array($item) ? $item['quantity'] : $item;
                \App\Models\Cart::create([
                    'user_id' => $userId,
                    'product_id' => $pId,
                    'quantity' => $qty
                ]);
            }
        }
    }
}