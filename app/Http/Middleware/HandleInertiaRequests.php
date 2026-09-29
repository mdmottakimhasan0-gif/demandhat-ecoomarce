<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Auth;
use App\Models\Marquee;
// use App\Models\Cart; // Uncomment this if you are using a Cart model

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),

            // Sends authenticated user to React through Inertia props(UsePage)
            'auth' => [
                'user' => Auth::user(),
            ],

            // 🛒 ADD THIS FOR THE CART BADGE 🛒
            'cartCount' => function () use ($request) {
                /* 
                 * OPTION 1: IF YOUR CART IS STORED IN THE DATABASE
                 * Uncomment the line below if you have a Cart model linked to the user.
                 * (Make sure to import App\Models\Cart at the top)
                 */
                // return Auth::check() ? Cart::where('user_id', Auth::id())->sum('quantity') : 0;
    

                /* 
                 * OPTION 2: IF YOUR CART IS STORED IN THE SESSION
                 * Uncomment the lines below if you save cart items in the Laravel session.
                 */
                $cart = $request->session()->get('cart', []);
                return is_array($cart) ? count($cart) : 0; // Use collect($cart)->sum('quantity') if you want total items instead of unique products
    

                // Default return if neither is set yet (Replace this once you choose Option 1 or 2)
                return 0;
            },

            // Flash messages
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
                'warning' => fn() => $request->session()->get('warning'),
                'info' => fn() => $request->session()->get('info'),
            ],

            // Landing page builder permissions (used to filter the admin menu / actions)
            'landing' => [
                'can' => fn () => in_array(Auth::user()?->role, ['admin', 'manager'], true)
                    ? \App\Services\Landing\LandingPermissions::for(Auth::user())
                    : [],
            ],

            'global' => [
                // Fetch the first marquee, or add logic to find the 'active' one
                'marquee' => cache()->remember('global_marquee', 86400, fn() => Marquee::first()),
            ],
        ];
    }
}