<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
// use Stripe\Stripe;
// use Stripe\Checkout\Session;
// use Inertia\Inertia;

class StripeController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Stripe Payment Gateway (Deactivated - COD Only Platform)
    |--------------------------------------------------------------------------
    |
    public function checkout(Request $request)
    {
        // Stripe::setApiKey(env('STRIPE_SECRET'));
        // $session = Session::create([...]);
        return response()->json(['message' => 'Online payments are currently deactivated. Please use Cash on Delivery.'], 403);
    }

    public function success(Request $request)
    {
        return redirect('/');
    }

    public function cancel()
    {
        return redirect('/');
    }
    */
}