<?php

namespace App\Services\Landing;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Server-side Meta Conversions API client (Laravel -> Graph API).
 * Never throws for delivery problems: callers get a result array and decide what to log.
 */
class MetaConversionsApiService
{
    /**
     * @param  array  $event  event_name, event_id, event_time, event_source_url, user_data (already hashed), custom_data
     * @return array{ok:bool,status:?int,error:?string}
     */
    public function send(MetaConfig $config, array $event): array
    {
        $token = $config->token();
        if (! $config->capiPixelId || ! $token) {
            return ['ok' => false, 'status' => null, 'error' => 'Conversions API is not fully configured (missing pixel or access token).'];
        }

        $payload = [
            'data' => [[
                'event_name' => $event['event_name'],
                'event_time' => $event['event_time'] ?? time(),
                'event_id' => $event['event_id'],
                'action_source' => 'website',
                'event_source_url' => $event['event_source_url'] ?? null,
                'user_data' => $event['user_data'] ?? [],
                'custom_data' => (object) ($event['custom_data'] ?? []),
            ]],
            'access_token' => $token,
        ];
        if ($config->testEventCode) {
            $payload['test_event_code'] = $config->testEventCode;
        }

        $url = sprintf('https://graph.facebook.com/%s/%s/events', $config->apiVersion, $config->capiPixelId);

        try {
            $response = Http::timeout(6)->retry(2, 300, throw: false)->asJson()->post($url, $payload);
        } catch (\Throwable $e) {
            Log::warning('Landing CAPI connection error', ['event' => $event['event_name'], 'error' => $this->scrub($e->getMessage(), $token)]);

            return ['ok' => false, 'status' => null, 'error' => $this->scrub($e->getMessage(), $token)];
        }

        if ($response->successful()) {
            return ['ok' => true, 'status' => $response->status(), 'error' => null];
        }

        $message = (string) ($response->json('error.message') ?? 'Meta API error');
        $message = $this->scrub($message, $token);
        Log::warning('Landing CAPI request failed', ['event' => $event['event_name'], 'status' => $response->status(), 'error' => $message]);

        return ['ok' => false, 'status' => $response->status(), 'error' => $message];
    }

    /** Meta-normalised, SHA-256 hashed user data. Raw values never leave this method. */
    public static function hashUserData(array $raw): array
    {
        $out = [];
        $hash = fn (string $v) => hash('sha256', $v);

        if (! empty($raw['email'])) {
            $out['em'] = [$hash(strtolower(trim($raw['email'])))];
        }
        if (! empty($raw['phone'])) {
            $digits = ltrim(preg_replace('/\D/', '', $raw['phone']), '0');
            if ($digits !== '') {
                $out['ph'] = [$hash($digits)];
            }
        }
        if (! empty($raw['name'])) {
            $parts = preg_split('/\s+/', mb_strtolower(trim($raw['name'])), 2);
            $out['fn'] = [$hash($parts[0])];
            if (! empty($parts[1])) {
                $out['ln'] = [$hash($parts[1])];
            }
        }
        // Not hashed per Meta's spec:
        foreach (['client_ip_address', 'client_user_agent', 'fbp', 'fbc'] as $k) {
            if (! empty($raw[$k])) {
                $out[$k] = $raw[$k];
            }
        }
        if (! empty($raw['external_id'])) {
            $out['external_id'] = [$hash((string) $raw['external_id'])];
        }

        return $out;
    }

    private function scrub(string $text, string $token): string
    {
        return str_replace($token, '[token]', $text);
    }
}
