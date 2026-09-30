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
                $cart = $request->session()->get('cart', []);
                if (!is_array($cart) || empty($cart)) {
                    return 0;
                }

                $productIds = array_keys($cart);
                $existingIds = \App\Models\Product::whereIn('id', $productIds)->pluck('id')->toArray();
                if (count($existingIds) !== count($cart)) {
                    $cart = array_intersect_key($cart, array_flip($existingIds));
                    $request->session()->put('cart', $cart);
                }

                return count($cart);
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

            'sitePixel' => [
                'enabled' => (bool) \App\Models\SiteSetting::read('site.meta_pixel_enabled', true),
                'id' => (string) (\App\Models\SiteSetting::read('site.meta_pixel_id') ?: env('VITE_FACEBOOK_PIXEL_ID', '')),
            ],
        ];
    }
}