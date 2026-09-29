<?php

namespace App\Providers;

use App\Landing\Builder\ElementRegistry;
use App\Models\LandingPage;
use App\Models\LandingPageLead;
use App\Models\LandingPageTemplate;
use App\Models\User;
use App\Policies\LandingPageLeadPolicy;
use App\Policies\LandingPagePolicy;
use App\Policies\LandingPageTemplatePolicy;
use App\Services\Landing\LandingPermissions;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class LandingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // One registry per request/process; extend it via ElementRegistry::register().
        $this->app->singleton(ElementRegistry::class);
    }

    public function boot(): void
    {
        foreach (config('landing.all_permissions') as $permission) {
            Gate::define($permission, fn (?User $user) => LandingPermissions::allows($user, $permission));
        }

        Gate::policy(LandingPage::class, LandingPagePolicy::class);
        Gate::policy(LandingPageTemplate::class, LandingPageTemplatePolicy::class);
        Gate::policy(LandingPageLead::class, LandingPageLeadPolicy::class);

        // Order forms render live product prices: refresh cached pages when a product changes.
        $flush = fn () => \App\Services\Landing\LandingPageCache::flushAll();
        \App\Models\Product::saved($flush);
        \App\Models\Product::deleted($flush);

        RateLimiter::for('landing-forms', function (Request $request) {
            $key = $request->ip().'|'.$request->route('slug');

            return [
                Limit::perMinute((int) config('landing.forms.rate_limit_per_minute'))->by($key),
                Limit::perHour(60)->by($request->ip()),
            ];
        });

        RateLimiter::for('landing-track', function (Request $request) {
            return Limit::perMinute((int) config('landing.forms.track_rate_limit_per_minute'))->by($request->ip());
        });
    }
}
