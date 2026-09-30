<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacebookCapiService
{
    protected $pixelId;
    protected $accessToken;

    public function __construct()
    {
        $this->pixelId = \App\Models\SiteSetting::read('site.meta_pixel_id') ?: env('VITE_FACEBOOK_PIXEL_ID');
        $this->accessToken = \App\Models\SiteSetting::read('site.meta_capi_token') ?: env('FACEBOOK_CAPI_TOKEN');
    }

    /**
     * Send an event to the Facebook Conversions API.
     *
     * @param string $eventName Event name (e.g. Purchase, InitiateCheckout)
     * @param array $userData User profile info (email, phone, ip, user_agent)
     * @param array $customData Custom purchase values (currency, value, contents)
     * @param string|null $eventId Unique event ID for deduplication
     * @return bool
     */
    public function sendEvent(string $eventName, array $userData = [], array $customData = [], string $eventId = null)
    {
        if (empty($this->pixelId) || empty($this->accessToken)) {
            Log::debug('Facebook CAPI skipped: Missing Pixel ID or CAPI Access Token in ENV.');
            return false;
        }

        // 1. Structure User Data (Hashed using SHA-256 where required by Meta)
        $formattedUserData = [
            'client_ip_address' => $userData['ip'] ?? request()->ip(),
            'client_user_agent' => $userData['user_agent'] ?? request()->userAgent(),
        ];

        if (!empty($userData['email'])) {
            $formattedUserData['em'] = hash('sha256', strtolower(trim($userData['email'])));
        }

        if (!empty($userData['phone'])) {
            // Clean phone number to include country code (e.g. 88017xxxxxxxx)
            $phone = preg_replace('/\D/', '', $userData['phone']);
            if (str_starts_with($phone, '0')) {
                $phone = '88' . $phone;
            }
            $formattedUserData['ph'] = hash('sha256', $phone);
        }

        if (!empty($userData['name'])) {
            $formattedUserData['fn'] = hash('sha256', strtolower(trim($userData['name'])));
        }

        // 2. Format Event Body
        $eventData = [
            'event_name' => $eventName,
            'event_time' => time(),
            'event_source_url' => url()->current(),
            'action_source' => 'website',
            'user_data' => $formattedUserData,
        ];

        if ($eventId) {
            $eventData['event_id'] = $eventId;
        }

        if (!empty($customData)) {
            $eventData['custom_data'] = [
                'currency' => $customData['currency'] ?? 'BDT',
                'value' => (float) ($customData['value'] ?? 0),
                'content_type' => 'product',
            ];

            if (!empty($customData['contents'])) {
                $eventData['custom_data']['contents'] = $customData['contents'];
            }
        }

        // 3. Dispatch to Meta Endpoint (Asynchronously using Laravel Http)
        try {
            $response = Http::timeout(5)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post("https://graph.facebook.com/v19.0/{$this->pixelId}/events", [
                    'data' => [$eventData],
                    'access_token' => $this->accessToken,
                ]);

            if ($response->successful()) {
                Log::info("Facebook CAPI event '{$eventName}' sent successfully. EventID: {$eventId}");
                return true;
            } else {
                Log::error("Facebook CAPI event failed: " . $response->body());
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Facebook CAPI connection error: " . $e->getMessage());
            return false;
        }
    }
}
