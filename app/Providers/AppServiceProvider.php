<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Behind a reverse proxy / load balancer that terminates TLS (common in production),
        // Laravel otherwise can't tell the original request was HTTPS and generates http://
        // links (route(), url(), asset()...). That breaks anything embedded same-origin, e.g.
        // the landing page builder's canvas iframe: an http:// iframe inside an https:// admin
        // page is blocked as mixed content, so it never loads and never signals "ready" - the
        // builder's "Rendering" spinner then never clears. Forcing the scheme from APP_URL
        // fixes this without having to trust arbitrary proxy IPs.
        if (str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }
    }
}
