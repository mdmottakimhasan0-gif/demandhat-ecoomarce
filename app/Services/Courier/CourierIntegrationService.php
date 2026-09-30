<?php

namespace App\Services\Courier;

use App\Models\Order;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CourierIntegrationService
{
    // Defaults & Constants
    public const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1';
    public const PATHAO_SANDBOX_URL = 'https://courier-api-sandbox.pathao.com';
    public const PATHAO_PROD_URL = 'https://api-hermes.pathao.com';
    public const BD_COURIER_URL = 'https://api.bdcourier.com/courier-check';

    /**
     * Read a setting from SiteSetting with fallback to config/env.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $val = SiteSetting::read('courier.' . $key);
        if ($val !== null && $val !== '') {
            if ($val === '1' || $val === 'true') return true;
            if ($val === '0' || $val === 'false') return false;
            return $val;
        }

        // Fallbacks to env/config
        return match ($key) {
            'steadfast_enabled' => (bool) env('STEADFAST_ENABLED', false),
            'steadfast_api_key' => env('STEADFAST_API_KEY', ''),
            'steadfast_secret_key' => env('STEADFAST_SECRET_KEY', ''),
            'steadfast_base_url' => env('STEADFAST_BASE_URL', self::STEADFAST_BASE_URL),
            'pathao_enabled' => (bool) env('PATHAO_ENABLED', false),
            'pathao_environment' => env('PATHAO_ENVIRONMENT', 'sandbox'),
            'pathao_base_url' => env('PATHAO_BASE_URL', ''),
            'pathao_client_id' => env('PATHAO_CLIENT_ID', ''),
            'pathao_client_secret' => env('PATHAO_CLIENT_SECRET', ''),
            'pathao_username' => env('PATHAO_USERNAME', ''),
            'pathao_password' => env('PATHAO_PASSWORD', ''),
            'pathao_store_id' => env('PATHAO_STORE_ID', ''),
            'fraud_provider' => env('FRAUD_CHECK_PROVIDER', 'auto'),
            'bd_courier_api_key' => config('services.bd_courier.api_key') ?: env('BD_COURIER_API_KEY', ''),
            'steadfast_fraud_enabled' => (bool) env('STEADFAST_FRAUD_ENABLED', true),
            'meta_pixel_enabled' => (bool) (SiteSetting::read('site.meta_pixel_enabled') ?? true),
            'meta_pixel_id' => SiteSetting::read('site.meta_pixel_id') ?: env('VITE_FACEBOOK_PIXEL_ID', ''),
            'meta_capi_token' => SiteSetting::read('site.meta_capi_token') ?: env('FACEBOOK_CAPI_TOKEN', ''),
            default => $default,
        };
    }

    /**
     * Get Pathao effective base URL based on environment.
     */
    public function getPathaoBaseUrl(): string
    {
        $custom = $this->get('pathao_base_url');
        if (!empty($custom)) {
            return rtrim($custom, '/');
        }

        $env = $this->get('pathao_environment', 'sandbox');
        return $env === 'production' ? self::PATHAO_PROD_URL : self::PATHAO_SANDBOX_URL;
    }

    /**
     * Get Steadfast effective base URL.
     */
    public function getSteadfastBaseUrl(): string
    {
        $url = $this->get('steadfast_base_url', self::STEADFAST_BASE_URL);
        return rtrim($url ?: self::STEADFAST_BASE_URL, '/');
    }

    /**
     * Settings panel data passed to frontend Admin Settings.
     */
    public function panel(): array
    {
        return [
            'steadfast' => [
                'enabled' => (bool) $this->get('steadfast_enabled', false),
                'api_key' => (string) $this->get('steadfast_api_key', ''),
                'secret_key' => (string) $this->get('steadfast_secret_key', ''),
                'base_url' => $this->getSteadfastBaseUrl(),
                'is_configured' => !empty($this->get('steadfast_api_key')) && !empty($this->get('steadfast_secret_key')),
            ],
            'pathao' => [
                'enabled' => (bool) $this->get('pathao_enabled', false),
                'environment' => $this->get('pathao_environment', 'sandbox'),
                'base_url' => $this->getPathaoBaseUrl(),
                'client_id' => (string) $this->get('pathao_client_id', ''),
                'client_secret' => (string) $this->get('pathao_client_secret', ''),
                'username' => (string) $this->get('pathao_username', ''),
                'password' => (string) $this->get('pathao_password', ''),
                'store_id' => (string) $this->get('pathao_store_id', ''),
                'is_configured' => !empty($this->get('pathao_client_id')) && !empty($this->get('pathao_client_secret')) && !empty($this->get('pathao_username')),
            ],
            'fraud' => [
                'provider' => $this->get('fraud_provider', 'auto'),
                'bd_courier_api_key' => (string) $this->get('bd_courier_api_key', ''),
                'steadfast_fraud_enabled' => (bool) $this->get('steadfast_fraud_enabled', true),
                'is_bd_courier_configured' => !empty($this->get('bd_courier_api_key')),
                'is_steadfast_configured' => !empty($this->get('steadfast_api_key')) && !empty($this->get('steadfast_secret_key')),
            ],
            'pixel' => [
                'enabled' => (bool) $this->get('meta_pixel_enabled', true),
                'pixel_id' => (string) $this->get('meta_pixel_id', ''),
                'capi_token' => (string) $this->get('meta_capi_token', ''),
                'is_configured' => !empty($this->get('meta_pixel_id')),
            ],
        ];
    }

    /**
     * Save settings to SiteSetting table.
     */
    public function saveSettings(array $data): void
    {
        // Global Website Meta Pixel
        if (isset($data['meta_pixel_enabled'])) {
            SiteSetting::write('site.meta_pixel_enabled', (bool) $data['meta_pixel_enabled']);
        }
        if (array_key_exists('meta_pixel_id', $data)) {
            SiteSetting::write('site.meta_pixel_id', trim((string) $data['meta_pixel_id']));
        }
        if (array_key_exists('meta_capi_token', $data)) {
            SiteSetting::write('site.meta_capi_token', trim((string) $data['meta_capi_token']));
        }

        // Steadfast
        if (isset($data['steadfast_enabled'])) {
            SiteSetting::write('courier.steadfast_enabled', (bool) $data['steadfast_enabled']);
        }
        if (isset($data['steadfast_api_key'])) {
            SiteSetting::write('courier.steadfast_api_key', trim((string) $data['steadfast_api_key']));
        }
        if (isset($data['steadfast_secret_key'])) {
            SiteSetting::write('courier.steadfast_secret_key', trim((string) $data['steadfast_secret_key']));
        }
        if (isset($data['steadfast_base_url'])) {
            SiteSetting::write('courier.steadfast_base_url', trim((string) $data['steadfast_base_url']));
        }

        // Pathao
        if (isset($data['pathao_enabled'])) {
            SiteSetting::write('courier.pathao_enabled', (bool) $data['pathao_enabled']);
        }
        if (isset($data['pathao_environment'])) {
            SiteSetting::write('courier.pathao_environment', $data['pathao_environment'] === 'production' ? 'production' : 'sandbox');
        }
        if (isset($data['pathao_base_url'])) {
            SiteSetting::write('courier.pathao_base_url', trim((string) $data['pathao_base_url']));
        }
        if (isset($data['pathao_client_id'])) {
            SiteSetting::write('courier.pathao_client_id', trim((string) $data['pathao_client_id']));
        }
        if (isset($data['pathao_client_secret'])) {
            SiteSetting::write('courier.pathao_client_secret', trim((string) $data['pathao_client_secret']));
        }
        if (isset($data['pathao_username'])) {
            SiteSetting::write('courier.pathao_username', trim((string) $data['pathao_username']));
        }
        if (isset($data['pathao_password'])) {
            SiteSetting::write('courier.pathao_password', (string) $data['pathao_password']);
        }
        if (isset($data['pathao_store_id'])) {
            SiteSetting::write('courier.pathao_store_id', trim((string) $data['pathao_store_id']));
        }

        // Fraud
        if (isset($data['fraud_provider'])) {
            SiteSetting::write('courier.fraud_provider', $data['fraud_provider']);
        }
        if (isset($data['bd_courier_api_key'])) {
            SiteSetting::write('courier.bd_courier_api_key', trim((string) $data['bd_courier_api_key']));
        }
        if (isset($data['steadfast_fraud_enabled'])) {
            SiteSetting::write('courier.steadfast_fraud_enabled', (bool) $data['steadfast_fraud_enabled']);
        }

        // Invalidate token cache if credentials changed
        Cache::forget('pathao_access_token');
    }

    /**
     * Test connection to Steadfast API.
     */
    public function testSteadfast(): array
    {
        $apiKey = $this->get('steadfast_api_key');
        $secretKey = $this->get('steadfast_secret_key');
        $baseUrl = $this->getSteadfastBaseUrl();

        if (empty($apiKey) || empty($secretKey)) {
            return [
                'status' => 'error',
                'message' => 'Steadfast API Key and Secret Key are required.',
            ];
        }

        try {
            // Ping service check
            $pingResponse = Http::withoutVerifying()->timeout(10)->get("{$baseUrl}/ping");
            if (!$pingResponse->successful()) {
                return [
                    'status' => 'error',
                    'message' => 'Cannot reach Steadfast server at ' . $baseUrl,
                    'details' => $pingResponse->body(),
                ];
            }

            // Authenticated balance check to verify keys
            $balanceResponse = Http::withoutVerifying()
                ->timeout(10)
                ->withHeaders([
                    'Api-Key' => $apiKey,
                    'Secret-Key' => $secretKey,
                    'Content-Type' => 'application/json',
                ])
                ->get("{$baseUrl}/get_balance");

            if ($balanceResponse->successful()) {
                $data = $balanceResponse->json();
                return [
                    'status' => 'success',
                    'message' => 'Steadfast connected successfully! Server responded OK.',
                    'balance' => $data['current_balance'] ?? null,
                ];
            }

            if ($balanceResponse->status() === 401) {
                return [
                    'status' => 'error',
                    'message' => 'Steadfast Authentication Failed: Invalid Api-Key or Secret-Key.',
                ];
            }

            return [
                'status' => 'error',
                'message' => 'Steadfast returned code ' . $balanceResponse->status(),
                'details' => $balanceResponse->json() ?? $balanceResponse->body(),
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'error',
                'message' => 'Steadfast Connection Exception: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get or refresh Pathao access token.
     */
    public function getPathaoToken(bool $forceRefresh = false): string
    {
        $cacheKey = 'pathao_access_token';
        if (!$forceRefresh && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $clientId = $this->get('pathao_client_id');
        $clientSecret = $this->get('pathao_client_secret');
        $username = $this->get('pathao_username');
        $password = $this->get('pathao_password');
        $baseUrl = $this->getPathaoBaseUrl();

        if (empty($clientId) || empty($clientSecret) || empty($username) || empty($password)) {
            throw new \Exception('Pathao credentials (Client ID, Client Secret, Username, Password) are incomplete.');
        }

        $refreshToken = SiteSetting::read('courier.pathao_refresh_token');

        // Try refresh token if available and not explicitly requesting a full password grant
        if ($refreshToken && !$forceRefresh) {
            try {
                $refResp = Http::withoutVerifying()
                    ->timeout(15)
                    ->post("{$baseUrl}/aladdin/api/v1/issue-token", [
                        'client_id' => $clientId,
                        'client_secret' => $clientSecret,
                        'grant_type' => 'refresh_token',
                        'refresh_token' => $refreshToken,
                    ]);

                if ($refResp->successful() && isset($refResp['access_token'])) {
                    $token = $refResp['access_token'];
                    $expiresIn = (int) ($refResp['expires_in'] ?? 432000);
                    Cache::put($cacheKey, $token, now()->addSeconds(max(60, $expiresIn - 300)));
                    if (isset($refResp['refresh_token'])) {
                        SiteSetting::write('courier.pathao_refresh_token', $refResp['refresh_token']);
                    }
                    return $token;
                }
            } catch (\Throwable $e) {
                Log::warning('Pathao refresh token failed, falling back to password grant: ' . $e->getMessage());
            }
        }

        // Password grant
        $response = Http::withoutVerifying()
            ->timeout(15)
            ->post("{$baseUrl}/aladdin/api/v1/issue-token", [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'grant_type' => 'password',
                'username' => $username,
                'password' => $password,
            ]);

        if (!$response->successful()) {
            $err = $response->json();
            $msg = $err['message'] ?? $err['error_description'] ?? 'Failed to authenticate with Pathao API.';
            throw new \Exception('Pathao Auth Error (' . $response->status() . '): ' . $msg);
        }

        $tokenData = $response->json();
        $accessToken = $tokenData['access_token'] ?? null;
        if (!$accessToken) {
            throw new \Exception('Pathao did not return an access token in the response.');
        }

        $expiresIn = (int) ($tokenData['expires_in'] ?? 432000);
        Cache::put($cacheKey, $accessToken, now()->addSeconds(max(60, $expiresIn - 300)));

        if (!empty($tokenData['refresh_token'])) {
            SiteSetting::write('courier.pathao_refresh_token', $tokenData['refresh_token']);
        }

        return $accessToken;
    }

    /**
     * Test connection to Pathao API and return stores.
     */
    public function testPathao(): array
    {
        try {
            $token = $this->getPathaoToken(true);
            $stores = $this->getPathaoStores($token);

            return [
                'status' => 'success',
                'message' => 'Pathao connected successfully! Token issued and store(s) fetched.',
                'stores' => $stores,
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Fetch merchant stores from Pathao.
     */
    public function getPathaoStores(?string $token = null): array
    {
        $token = $token ?: $this->getPathaoToken();
        $baseUrl = $this->getPathaoBaseUrl();

        $response = Http::withoutVerifying()
            ->timeout(15)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])
            ->get("{$baseUrl}/aladdin/api/v1/stores");

        if ($response->successful()) {
            $json = $response->json();
            return $json['data']['data'] ?? $json['data'] ?? [];
        }

        throw new \Exception('Failed to retrieve Pathao stores: ' . ($response->json('message') ?? $response->body()));
    }

    /**
     * Fetch cities list from Pathao.
     */
    public function getPathaoCities(): array
    {
        $token = $this->getPathaoToken();
        $baseUrl = $this->getPathaoBaseUrl();

        $response = Http::withoutVerifying()
            ->timeout(15)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
            ])
            ->get("{$baseUrl}/aladdin/api/v1/city-list");

        if ($response->successful()) {
            return $response->json('data.data') ?? $response->json('data') ?? [];
        }

        return [];
    }

    /**
     * Fetch zones inside city from Pathao.
     */
    public function getPathaoZones(int|string $cityId): array
    {
        $token = $this->getPathaoToken();
        $baseUrl = $this->getPathaoBaseUrl();

        $response = Http::withoutVerifying()
            ->timeout(15)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
            ])
            ->get("{$baseUrl}/aladdin/api/v1/cities/{$cityId}/zone-list");

        if ($response->successful()) {
            return $response->json('data.data') ?? $response->json('data') ?? [];
        }

        return [];
    }

    /**
     * Fetch areas inside zone from Pathao.
     */
    public function getPathaoAreas(int|string $zoneId): array
    {
        $token = $this->getPathaoToken();
        $baseUrl = $this->getPathaoBaseUrl();

        $response = Http::withoutVerifying()
            ->timeout(15)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
            ])
            ->get("{$baseUrl}/aladdin/api/v1/zones/{$zoneId}/area-list");

        if ($response->successful()) {
            return $response->json('data.data') ?? $response->json('data') ?? [];
        }

        return [];
    }

    /**
     * Dispatch order to Steadfast Courier.
     */
    public function sendToSteadfast(Order $order, array $params = []): array
    {
        $apiKey = $this->get('steadfast_api_key');
        $secretKey = $this->get('steadfast_secret_key');
        $baseUrl = $this->getSteadfastBaseUrl();

        if (empty($apiKey) || empty($secretKey)) {
            return [
                'status' => 'error',
                'message' => 'Steadfast credentials are not configured. Please set them in Admin Settings > Integrations.',
            ];
        }

        $invoice = trim((string) ($params['invoice'] ?? $order->courier_invoice_id ?? $order->id));
        $recipientName = trim((string) ($params['recipient_name'] ?? $order->name));
        $recipientPhone = $this->cleanPhone($params['recipient_phone'] ?? $order->phone);
        $recipientAddress = trim((string) ($params['recipient_address'] ?? $order->address));
        $codAmount = (float) ($params['cod_amount'] ?? $order->grand_total);
        $note = (string) ($params['note'] ?? '');

        try {
            $response = Http::withoutVerifying()
                ->timeout(20)
                ->withHeaders([
                    'Api-Key' => $apiKey,
                    'Secret-Key' => $secretKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$baseUrl}/create_order", [
                    'invoice' => $invoice,
                    'recipient_name' => mb_substr($recipientName, 0, 100),
                    'recipient_phone' => mb_substr($recipientPhone, 0, 40),
                    'recipient_address' => mb_substr($recipientAddress, 0, 490),
                    'cod_amount' => $codAmount,
                    'note' => mb_substr($note, 0, 480),
                ]);

            $result = $response->json();

            if ($response->successful() && isset($result['status']) && $result['status'] == 200) {
                $consignment = $result['consignment'] ?? [];

                $order->update([
                    'order_status' => 'shipped',
                    'courier_name' => 'steadfast',
                    'courier_invoice_id' => $invoice,
                    'courier_consignment_id' => $consignment['consignment_id'] ?? null,
                    'courier_tracking_code' => $consignment['tracking_code'] ?? null,
                    'courier_status' => $consignment['status'] ?? 'in_review',
                ]);

                return [
                    'status' => 'success',
                    'message' => 'Order submitted to Steadfast successfully!',
                    'data' => [
                        'consignment_id' => $consignment['consignment_id'] ?? null,
                        'tracking_code' => $consignment['tracking_code'] ?? null,
                        'invoice' => $invoice,
                    ],
                ];
            }

            $errMsg = $result['message'] ?? 'Failed to create Steadfast consignment.';
            if (isset($result['errors'])) {
                $errMsg .= ' ' . json_encode($result['errors']);
            }

            return [
                'status' => 'error',
                'message' => 'Steadfast Error: ' . $errMsg,
            ];
        } catch (\Throwable $e) {
            Log::error('Steadfast API Error: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to connect to Steadfast: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Dispatch order to Pathao Courier.
     */
    public function sendToPathao(Order $order, array $params = []): array
    {
        $token = $this->getPathaoToken();
        $baseUrl = $this->getPathaoBaseUrl();

        $storeId = (int) ($params['store_id'] ?? $this->get('pathao_store_id'));
        if (!$storeId) {
            // Auto fetch default store if not provided
            $stores = $this->getPathaoStores($token);
            if (!empty($stores)) {
                $default = collect($stores)->firstWhere('is_default_store', 1) ?? $stores[0];
                $storeId = (int) ($default['store_id'] ?? 0);
            }
        }

        if (!$storeId) {
            return [
                'status' => 'error',
                'message' => 'Pathao Store ID is required. Please select or configure a store in Settings.',
            ];
        }

        $recipientPhone = $this->cleanPhone($params['recipient_phone'] ?? $order->phone);
        $invoice = trim((string) ($params['invoice'] ?? $order->courier_invoice_id ?? $order->id));
        $recipientName = trim((string) ($params['recipient_name'] ?? $order->name));
        $recipientAddress = trim((string) ($params['recipient_address'] ?? $order->address));
        $codAmount = (float) ($params['cod_amount'] ?? $order->grand_total);

        // Pathao expects 11 digit mobile number
        if (strlen($recipientPhone) !== 11) {
            return [
                'status' => 'error',
                'message' => 'Recipient phone must be an 11-digit mobile number (e.g. 017XXXXXXXX) for Pathao.',
            ];
        }

        $payload = [
            'store_id' => $storeId,
            'merchant_order_id' => $invoice,
            'recipient_name' => mb_substr($recipientName, 0, 100),
            'recipient_phone' => $recipientPhone,
            'recipient_address' => mb_substr($recipientAddress, 0, 220),
            'delivery_type' => (int) ($params['delivery_type'] ?? 48), // 48: Normal, 12: On Demand
            'item_type' => (int) ($params['item_type'] ?? 2),         // 1: Document, 2: Parcel
            'item_quantity' => (int) ($params['item_quantity'] ?? 1),
            'item_weight' => max(0.5, min(10.0, (float) ($params['item_weight'] ?? 0.5))),
            'amount_to_collect' => (int) round($codAmount),
            'item_description' => mb_substr((string) ($params['item_description'] ?? 'Order #' . $order->id), 0, 200),
            'special_instruction' => mb_substr((string) ($params['special_instruction'] ?? $params['note'] ?? ''), 0, 200),
        ];

        // Optional city, zone, area (if provided)
        if (!empty($params['recipient_city'])) {
            $payload['recipient_city'] = (int) $params['recipient_city'];
        }
        if (!empty($params['recipient_zone'])) {
            $payload['recipient_zone'] = (int) $params['recipient_zone'];
        }
        if (!empty($params['recipient_area'])) {
            $payload['recipient_area'] = (int) $params['recipient_area'];
        }
        if (!empty($params['recipient_secondary_phone'])) {
            $payload['recipient_secondary_phone'] = $this->cleanPhone($params['recipient_secondary_phone']);
        }

        try {
            $response = Http::withoutVerifying()
                ->timeout(20)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $token,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post("{$baseUrl}/aladdin/api/v1/orders", $payload);

            $result = $response->json();

            if ($response->successful() && isset($result['type']) && $result['type'] === 'success') {
                $data = $result['data'] ?? [];
                $consignmentId = $data['consignment_id'] ?? null;

                $order->update([
                    'order_status' => 'shipped',
                    'courier_name' => 'pathao',
                    'courier_invoice_id' => $invoice,
                    'courier_consignment_id' => $consignmentId,
                    'courier_tracking_code' => $consignmentId,
                    'courier_status' => $data['order_status'] ?? 'Pending',
                ]);

                return [
                    'status' => 'success',
                    'message' => 'Order submitted to Pathao successfully!',
                    'data' => [
                        'consignment_id' => $consignmentId,
                        'order_status' => $data['order_status'] ?? 'Pending',
                        'delivery_fee' => $data['delivery_fee'] ?? 0,
                    ],
                ];
            }

            $errMsg = $result['message'] ?? 'Failed to submit order to Pathao.';
            if (isset($result['errors'])) {
                $errMsg .= ' Details: ' . json_encode($result['errors']);
            }

            return [
                'status' => 'error',
                'message' => 'Pathao Error: ' . $errMsg,
            ];
        } catch (\Throwable $e) {
            Log::error('Pathao API Error: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to connect to Pathao: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Unified Fraud Check across configured providers (BD Courier and/or Steadfast).
     */
    public function checkFraud(string $phone): array
    {
        $cleanPhone = $this->cleanPhone($phone);
        $provider = $this->get('fraud_provider', 'auto');

        $bdApiKey = $this->get('bd_courier_api_key');
        $steadfastApiKey = $this->get('steadfast_api_key');
        $steadfastSecret = $this->get('steadfast_secret_key');
        $steadfastFraudEnabled = (bool) $this->get('steadfast_fraud_enabled', true);

        // 1. Try BD Courier if provider is bd_courier or auto (with BD API key configured)
        if (($provider === 'bd_courier' || $provider === 'auto') && !empty($bdApiKey)) {
            try {
                $response = Http::withoutVerifying()
                    ->timeout(12)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $bdApiKey,
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                    ])
                    ->post(self::BD_COURIER_URL, [
                        'phone' => $cleanPhone,
                    ]);

                if ($response->successful()) {
                    $json = $response->json();
                    if (isset($json['status']) && $json['status'] === 'success') {
                        $json['provider'] = 'bd_courier';
                        return $json;
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('BD Courier API check failed: ' . $e->getMessage());
            }
        }

        // 2. Try Steadfast Fraud Check score if provider is steadfast or fallback
        if (($provider === 'steadfast' || $provider === 'auto') && $steadfastFraudEnabled && !empty($steadfastApiKey) && !empty($steadfastSecret)) {
            try {
                $baseUrl = $this->getSteadfastBaseUrl();
                $response = Http::withoutVerifying()
                    ->timeout(12)
                    ->withHeaders([
                        'Api-Key' => $apiKey = $steadfastApiKey,
                        'Secret-Key' => $steadfastSecret,
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                    ])
                    ->get("{$baseUrl}/fraud_check/score/{$cleanPhone}");

                if ($response->successful()) {
                    $raw = $response->json();
                    // Steadfast returns score & delivery stats
                    return $this->formatSteadfastFraudResponse($raw, $cleanPhone);
                }
            } catch (\Throwable $e) {
                Log::warning('Steadfast Fraud Check failed: ' . $e->getMessage());
            }
        }

        // If neither was configured or both failed
        if (empty($bdApiKey) && (empty($steadfastApiKey) || empty($steadfastSecret))) {
            return [
                'status' => 'error',
                'message' => 'Fraud checker is not configured. Please add your BD Courier API Key or Steadfast API keys in Admin Settings > Integrations.',
            ];
        }

        return [
            'status' => 'error',
            'message' => 'Failed to reach fraud check databases. Please verify your API credentials in Admin Settings > Integrations.',
        ];
    }

    /**
     * Standardize Steadfast fraud response to match FraudCheckModal format.
     */
    protected function formatSteadfastFraudResponse(array $raw, string $phone): array
    {
        // Steadfast score format handling
        $total = (int) ($raw['total_parcels'] ?? $raw['total'] ?? $raw['data']['total_parcels'] ?? 0);
        $delivered = (int) ($raw['delivered_parcels'] ?? $raw['delivered'] ?? $raw['data']['delivered_parcels'] ?? 0);
        $cancelled = (int) ($raw['cancelled_parcels'] ?? $raw['returned'] ?? $raw['cancelled'] ?? $raw['data']['cancelled_parcels'] ?? 0);
        
        $ratio = $total > 0 ? round(($delivered / $total) * 100, 2) : 0;
        if (isset($raw['delivery_rate'])) {
            $ratio = (float) $raw['delivery_rate'];
        }

        return [
            'status' => 'success',
            'provider' => 'steadfast',
            'phone' => $phone,
            'data' => [
                'summary' => [
                    'total_parcel' => $total,
                    'success_parcel' => $delivered,
                    'cancelled_parcel' => $cancelled,
                    'success_ratio' => $ratio,
                ],
                'steadfast' => [
                    'name' => 'Steadfast Courier',
                    'total_parcel' => $total,
                    'success_parcel' => $delivered,
                    'cancelled_parcel' => $cancelled,
                    'success_ratio' => $ratio,
                ],
            ],
            'raw' => $raw,
        ];
    }

    /**
     * Helper to clean Bangladeshi phone numbers.
     */
    public function cleanPhone(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleaned, '8801')) {
            $cleaned = substr($cleaned, 2);
        }
        return $cleaned;
    }
}
