<?php

namespace App\Services;

use App\Models\BlockedOrderSource;
use App\Models\Order;
use App\Models\SiteSetting;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\IpUtils;

/**
 * Duplicate / abusive order protection, shared by the shop checkout and the landing page
 * order form. Everything can be switched off from Admin > Settings > Order Protection.
 *
 * Rules (each independent, all only apply while the master switch is on):
 *  - blocklist : phone numbers / IPs / CIDR ranges you blocked by hand
 *  - phone     : the phone number already has an active (not delivered/cancelled/returned) order
 *  - ip        : the IP already placed N orders within the last X hours
 */
class OrderProtection
{
    public const DEFAULTS = [
        'enabled' => true,
        'block_phone' => true,   // same behaviour the shop had before this setting existed
        'block_ip' => false,     // off by default: many customers share one IP (offices, mobile carriers)
        'ip_limit' => 3,
        'window_hours' => 24,
    ];

    public const INACTIVE_STATUSES = ['delivered', 'cancelled', 'returned'];

    public function settings(): array
    {
        $d = self::DEFAULTS;

        return [
            'enabled' => $this->bool('order_protection.enabled', $d['enabled']),
            'block_phone' => $this->bool('order_protection.block_phone', $d['block_phone']),
            'block_ip' => $this->bool('order_protection.block_ip', $d['block_ip']),
            'ip_limit' => max(1, min(100, (int) SiteSetting::read('order_protection.ip_limit', $d['ip_limit']))),
            'window_hours' => max(1, min(720, (int) SiteSetting::read('order_protection.window_hours', $d['window_hours']))),
        ];
    }

    public function update(array $data): void
    {
        foreach (['enabled', 'block_phone', 'block_ip'] as $k) {
            SiteSetting::write('order_protection.'.$k, (bool) ($data[$k] ?? false));
        }
        SiteSetting::write('order_protection.ip_limit', max(1, min(100, (int) ($data['ip_limit'] ?? self::DEFAULTS['ip_limit']))));
        SiteSetting::write('order_protection.window_hours', max(1, min(720, (int) ($data['window_hours'] ?? self::DEFAULTS['window_hours']))));
    }

    /** Data for the admin Settings tab. Safe to call before the migration has run. */
    public function panel(): array
    {
        try {
            return [
                'ready' => true,
                'settings' => $this->settings(),
                'blocked' => BlockedOrderSource::query()->latest()->limit(300)->get(['id', 'type', 'value', 'reason', 'created_at']),
            ];
        } catch (QueryException) {
            return ['ready' => false, 'settings' => self::DEFAULTS, 'blocked' => []];
        }
    }

    /**
     * @param  bool  $skipPhoneRule  a form may opt out of the "active order" rule
     * @return array{code:string,message:string}|null  null = order allowed
     */
    public function check(?string $phone, ?string $ip, bool $skipPhoneRule = false): ?array
    {
        try {
            return $this->evaluate($phone, $ip, $skipPhoneRule);
        } catch (QueryException $e) {
            // Migration not run yet: keep the shop's original rule instead of breaking checkout.
            $p = self::normalizePhone($phone);

            return (! $skipPhoneRule && $p && Order::where('phone', $p)->whereNotIn('order_status', self::INACTIVE_STATUSES)->exists())
                ? ['code' => 'pending_order', 'message' => 'You already have an active order with this number.']
                : null;
        }
    }

    /** Columns to store the buyer IP on an order (empty until the migration has run). */
    public static function orderIp(?string $ip): array
    {
        static $has = null;
        $has ??= Schema::hasColumn('orders', 'ip_address');

        return $has && $ip ? ['ip_address' => $ip] : [];
    }

    private function evaluate(?string $phone, ?string $ip, bool $skipPhoneRule): ?array
    {
        $s = $this->settings();
        if (! $s['enabled']) {
            return null;
        }

        $phone = self::normalizePhone($phone);

        // 1. Manual blocklist
        foreach ($this->blocklist() as $b) {
            if ($b['type'] === 'phone' && $phone && $b['value'] === $phone) {
                return ['code' => 'blocked', 'message' => 'We are unable to accept an order from this number. Please contact us by phone.'];
            }
            if ($b['type'] === 'ip' && $ip && IpUtils::checkIp($ip, $b['value'])) {
                return ['code' => 'blocked', 'message' => 'We are unable to accept orders from your connection right now. Please contact us by phone.'];
            }
        }

        // 2. Phone with an active order
        if ($s['block_phone'] && ! $skipPhoneRule && $phone
            && Order::where('phone', $phone)->whereNotIn('order_status', self::INACTIVE_STATUSES)->exists()) {
            return ['code' => 'pending_order', 'message' => 'You already have an active order with this number. We will contact you soon - please call us if you need to change it.'];
        }

        // 3. Too many orders from one IP
        if ($s['block_ip'] && $ip) {
            $count = Order::where('ip_address', $ip)
                ->where('created_at', '>=', now()->subHours($s['window_hours']))
                ->whereNotIn('order_status', ['cancelled'])
                ->count();
            if ($count >= $s['ip_limit']) {
                return ['code' => 'ip_limit', 'message' => 'Too many orders have been placed from your connection recently. Please try again later or call us to order.'];
            }
        }

        return null;
    }

    /** @return list<array{type:string,value:string}> */
    private function blocklist(): array
    {
        return Cache::remember('order_protection.blocklist', 600, fn () => BlockedOrderSource::query()->get(['type', 'value'])->map(fn ($b) => ['type' => $b->type, 'value' => $b->value])->all());
    }

    private function bool(string $key, bool $default): bool
    {
        $v = SiteSetting::read($key);

        return $v === null ? $default : $v === '1';
    }

    /** 8801712345678 / +8801712345678 / 1712345678 / 01712345678 -> 01712345678 */
    public static function normalizePhone(?string $phone): ?string
    {
        $d = preg_replace('/\D/', '', (string) $phone);
        if ($d === '') {
            return null;
        }
        if (str_starts_with($d, '880')) {
            $d = '0'.substr($d, 3);
        } elseif (strlen($d) === 10 && $d[0] === '1') {
            $d = '0'.$d;
        }

        return $d;
    }

    /** Validate + normalise a blocklist value. Returns null when invalid. */
    public static function normalizeValue(string $type, string $value): ?string
    {
        $value = trim($value);
        if ($type === 'phone') {
            $p = self::normalizePhone($value);

            return $p && preg_match('/^01[0-9]{9}$/', $p) ? $p : null;
        }
        if ($type === 'ip') {
            $ip = explode('/', $value)[0];
            if (! filter_var($ip, FILTER_VALIDATE_IP)) {
                return null;
            }
            if (str_contains($value, '/')) {
                $bits = (int) explode('/', $value)[1];
                $max = str_contains($ip, ':') ? 128 : 32;
                if ($bits < 8 || $bits > $max) { // refuse absurdly wide ranges like /0
                    return null;
                }
            }

            return $value;
        }

        return null;
    }
}
