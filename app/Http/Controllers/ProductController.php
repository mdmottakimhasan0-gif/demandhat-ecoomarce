<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Product;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\Review;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
{
    public function showDetails($id)
    {

        // Fetch product with images AND ONLY approved reviews + the user who wrote them
        $product = Product::with([
            'images',
            'reviews' => function ($query) {
                $query->where('is_approved', true)->with('user')->latest();
            }
        ])->findOrFail($id);

        $contact = cache()->remember('global_contact', 86400, fn() => Contact::latest()->first());

        // Fetch related products
        $relatedProducts = Product::where('category_id', $product->category_id)
            ->where('id', '!=', $id)
            ->where('stock', '>', 0)
            ->latest()
            ->take(7)
            ->get();

        return inertia('Customer/ProductDetailsPage', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
            'contact' => $contact,
        ]);
    }

    public function storeReview(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'required|string|max:1000' // Made review required for better quality
        ]);

        Review::create([
            'product_id' => $request->product_id,
            'user_id' => Auth::id(),
            'rating' => $request->rating,
            'review' => $request->review,
            'is_approved' => false, // Requires Admin Approval
        ]);

        return back()->with('success', 'Thank you! Your review has been submitted for approval.');
    }

    public function showCart()
    {
        return Inertia::render('Customer/Cart');
    }
}