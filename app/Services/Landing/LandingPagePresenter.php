<?php

namespace App\Services\Landing;

use App\Models\LandingPage;

/** Arrays handed to the admin UI. The CAPI access token is never included. */
class LandingPagePresenter
{
    public static function row(LandingPage $p): array
    {
        return [
            'id' => $p->id,
            'title' => $p->title,
            'slug' => $p->slug,
            'status' => $p->status,
            'url' => $p->publicUrl(),
            'published_at' => $p->published_at?->toIso8601String(),
            'updated_at' => $p->updated_at?->toIso8601String(),
            'is_live' => $p->isPublished(),
            'builder_url' => route('admin.landing.builder', $p),
        ];
    }

    public static function builder(LandingPage $p): array
    {
        return self::row($p) + [
            'has_unpublished_changes' => $p->isPublished() && $p->updated_at && $p->published_at && $p->updated_at->gt($p->published_at->copy()->addSeconds(1)),
        ];
    }

    /** Tracking JSON plus token *presence* - never the token. Scripts only for authorised users. */
    public static function tracking(LandingPage $p, bool $canManage): array
    {
        $t = array_replace_recursive(TrackingConfig::defaults(), $p->tracking_json ?? []);
        if (! $canManage) {
            $t['scripts'] = ['head' => '', 'body_start' => '', 'body_end' => ''];
        }

        return $t + ['has_capi_token' => $p->hasCapiToken()];
    }
}
