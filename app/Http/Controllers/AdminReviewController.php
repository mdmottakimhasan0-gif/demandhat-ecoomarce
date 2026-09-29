<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = Review::with(['user', 'product'])->latest();

        // 1. Filter by Status
        if ($request->filled('status')) {
            if ($request->status === 'approved')
                $query->where('is_approved', true);
            if ($request->status === 'pending')
                $query->where('is_approved', false);
        }



        // 2. Search by Product Name or User Name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })->orWhereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        return Inertia::render('Admin/Reviews/Reviews', [
            'reviews' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'status'])
        ]);
    }

    public function toggleStatus($id)
    {
        $review = Review::findOrFail($id);
        $review->is_approved = !$review->is_approved; // Flip the status
        $review->save();

        $status = $review->is_approved ? 'Approved' : 'Unapproved';
        return back()->with('success', "Review has been {$status}.");
    }

    public function destroy($id)
    {
        Review::findOrFail($id)->delete();
        return back()->with('success', 'Review deleted successfully.');
    }
}