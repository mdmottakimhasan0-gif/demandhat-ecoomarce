<?php

namespace App\Services;

use App\Models\SiteSetting;

/**
 * Delivery fee rules shared by the website checkout and the landing page order form.
 * Extracted verbatim from CheckoutController so both always charge the same amount.
 * Configurable via Admin Settings > Integrations.
 */
class DeliveryFee
{
    /** [inside_dhaka, outside_dhaka] per class default fallback table. Also sent to the browser for live totals. */
    public const TABLE = [
        'high' => [300, 500],   // per unit
        'medium' => [150, 250], // per unit
        'base' => [60, 120],    // flat
    ];

    /**
     * Get dynamic rates from SiteSetting with fallback to default TABLE.
     * @return array{high: array{0: int, 1: int}, medium: array{0: int, 1: int}, base: array{0: int, 1: int}}
     */
    public static function rates(): array
    {
        $hasCustom = SiteSetting::read('delivery.inside_dhaka') !== null || SiteSetting::read('delivery.outside_dhaka') !== null;
        $inside = (int) SiteSetting::read('delivery.inside_dhaka', self::TABLE['base'][0]);
        $outside = (int) SiteSetting::read('delivery.outside_dhaka', self::TABLE['base'][1]);

        return [
            'high' => [
                (int) SiteSetting::read('delivery.high_inside', $hasCustom ? $inside : self::TABLE['high'][0]),
                (int) SiteSetting::read('delivery.high_outside', $hasCustom ? $outside : self::TABLE['high'][1]),
            ],
            'medium' => [
                (int) SiteSetting::read('delivery.medium_inside', $hasCustom ? $inside : self::TABLE['medium'][0]),
                (int) SiteSetting::read('delivery.medium_outside', $hasCustom ? $outside : self::TABLE['medium'][1]),
            ],
            'base' => [
                $inside,
                $outside,
            ],
        ];
    }

    /**
     * Check if free delivery is enabled for all products globally.
     */
    public static function isAllFree(): bool
    {
        $val = SiteSetting::read('delivery.all_free', false);
        return $val === true || $val === '1' || $val === 'true' || $val === 1;
    }

    /**
     * Check if there is a minimum order subtotal for free delivery.
     */
    public static function freeMinAmount(): int
    {
        return (int) SiteSetting::read('delivery.free_delivery_min_amount', 0);
    }

    /**
     * @param  array<int,array{bussiness_class?:?string,quantity:int,price?:float|int}>  $items
     * @param  array{0:?int,1:?int}|null  $fixed  optional [inside, outside] flat override
     * @param  float|int|null  $subtotal  optional order subtotal for minimum free shipping threshold
     */
    public function calculate(array $items, string $area, ?array $fixed = null, float|int|null $subtotal = null): int
    {
        $i = $area === 'inside_dhaka' ? 0 : 1;

        if ($fixed && $fixed[$i] !== null) {
            return (int) $fixed[$i];
        }

        // 1. Global free delivery for all products
        if (self::isAllFree()) {
            return 0;
        }

        // 2. Minimum order threshold for free delivery
        $minAmount = self::freeMinAmount();
        if ($minAmount > 0) {
            $computedSubtotal = $subtotal ?? array_sum(array_map(fn ($it) => (float) (($it['price'] ?? 0) * ($it['quantity'] ?? 1)), $items));
            if ($computedSubtotal >= $minAmount) {
                return 0;
            }
        }

        $rates = self::rates();

        $highQty = 0;
        $mediumQty = 0;
        $normalQty = 0;
        $freeQty = 0;

        foreach ($items as $item) {
            $class = strtolower($item['bussiness_class'] ?? 'normal');
            $qty = (int) ($item['quantity'] ?? 1);

            if ($class === 'free') {
                $freeQty += $qty;
            } elseif ($class === 'high') {
                $highQty += $qty;
            } elseif ($class === 'medium') {
                $mediumQty += $qty;
            } else {
                $normalQty += $qty;
            }
        }

        // If the cart only has free-shipping items -> 0
        if ($freeQty > 0 && $highQty === 0 && $mediumQty === 0 && $normalQty === 0) {
            return 0;
        }

        $hasCustom = SiteSetting::read('delivery.inside_dhaka') !== null || SiteSetting::read('delivery.outside_dhaka') !== null;
        if ($hasCustom) {
            return count($items) > 0 ? $rates['base'][$i] : 0;
        }

        if ($highQty > 0) {
            return $highQty * $rates['high'][$i];
        }
        if ($mediumQty > 0) {
            return $mediumQty * $rates['medium'][$i];
        }
        if ($normalQty > 0) {
            return $rates['base'][$i];
        }

        return count($items) > 0 ? $rates['base'][$i] : 0;
    }
}
