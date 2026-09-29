<?php

namespace App\Services;

/**
 * Delivery fee rules shared by the website checkout and the landing page order form.
 * Extracted verbatim from CheckoutController so both always charge the same amount.
 */
class DeliveryFee
{
    /** [inside_dhaka, outside_dhaka] per class. Also sent to the browser for live totals. */
    public const TABLE = [
        'high' => [300, 500],   // per unit
        'medium' => [150, 250], // per unit
        'base' => [60, 120],    // flat
    ];

    /**
     * @param  array<int,array{bussiness_class?:?string,quantity:int}>  $items
     * @param  array{0:?int,1:?int}|null  $fixed  optional [inside, outside] flat override
     */
    public function calculate(array $items, string $area, ?array $fixed = null): int
    {
        $i = $area === 'inside_dhaka' ? 0 : 1;

        if ($fixed && $fixed[$i] !== null) {
            return (int) $fixed[$i];
        }

        $highQty = 0;
        $mediumQty = 0;
        foreach ($items as $item) {
            $class = strtolower($item['bussiness_class'] ?? 'normal');
            if ($class === 'high') {
                $highQty += $item['quantity'];
            } elseif ($class === 'medium') {
                $mediumQty += $item['quantity'];
            }
        }

        if ($highQty > 0) {
            return $highQty * self::TABLE['high'][$i];
        }
        if ($mediumQty > 0) {
            return $mediumQty * self::TABLE['medium'][$i];
        }

        return self::TABLE['base'][$i];
    }
}
