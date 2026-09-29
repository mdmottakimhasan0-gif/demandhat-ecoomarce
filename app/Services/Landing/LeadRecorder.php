<?php

namespace App\Services\Landing;

use App\Models\LandingPage;
use App\Models\LandingPageLead;
use Illuminate\Http\Request;

/** Creates a lead row with attribution. Shared by lead forms and the order form. */
class LeadRecorder
{
    public function __construct(private AttributionService $attribution) {}

    /** @param  list<array{name:string,label:string,type:string,value:string}>  $rows */
    public function record(LandingPage $page, string $formId, Request $request, ?string $name, ?string $email, ?string $phone, array $rows, string $status = 'new'): LandingPageLead
    {
        $attr = $this->attribution->forLead($request);

        return LandingPageLead::create([
            'landing_page_id' => $page->id,
            'form_id' => $formId,
            'name' => $name ? mb_substr($name, 0, 255) : null,
            'email' => $email ? mb_substr($email, 0, 255) : null,
            'phone' => $phone ? mb_substr($phone, 0, 50) : null,
            'data_json' => $rows,
            'source' => $attr['utm']['utm_source'] ?? ($attr['referrer'] ? parse_url($attr['referrer'], PHP_URL_HOST) : 'direct'),
            'utm_source' => $attr['utm']['utm_source'] ?? null,
            'utm_medium' => $attr['utm']['utm_medium'] ?? null,
            'utm_campaign' => $attr['utm']['utm_campaign'] ?? null,
            'utm_term' => $attr['utm']['utm_term'] ?? null,
            'utm_content' => $attr['utm']['utm_content'] ?? null,
            'landing_url' => $attr['landing_url'] ?? null,
            'referrer' => $attr['referrer'] ?? null,
            'ip_hash' => AttributionService::ipHash($request->ip()),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 255),
            'status' => $status,
            'created_at' => now(),
        ]);
    }
}
