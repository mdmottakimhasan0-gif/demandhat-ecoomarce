<?php

namespace App\Landing\Builder;

/**
 * Tiny factory for control schema arrays. The schema is serialised to the
 * builder UI, so adding an element only needs PHP - no JS changes.
 *
 * Types: text textarea richtext number slider select choose switch color url image
 *        icon dimensions repeater code datetime
 */
final class Control
{
    public static function make(string $type, string $key, string $label, array $opts = []): array
    {
        $tab = $opts['tab'] ?? 'content';

        return array_merge([
            'type' => $type,
            'key' => $key,
            'label' => $label,
            'tab' => $tab,
            'store' => $tab === 'content' ? 'content' : 'settings',
            'section' => null,
            'responsive' => false,
        ], $opts);
    }

    public static function text(string $key, string $label, array $o = []): array
    {
        return self::make('text', $key, $label, $o);
    }

    public static function textarea(string $key, string $label, array $o = []): array
    {
        return self::make('textarea', $key, $label, $o);
    }

    public static function richtext(string $key, string $label, array $o = []): array
    {
        return self::make('richtext', $key, $label, $o);
    }

    public static function url(string $key, string $label, array $o = []): array
    {
        return self::make('url', $key, $label, $o);
    }

    public static function image(string $key, string $label, array $o = []): array
    {
        return self::make('image', $key, $label, $o);
    }

    public static function icon(string $key, string $label, array $o = []): array
    {
        return self::make('icon', $key, $label, $o);
    }

    public static function color(string $key, string $label, array $o = []): array
    {
        return self::make('color', $key, $label, $o);
    }

    public static function switch(string $key, string $label, array $o = []): array
    {
        return self::make('switch', $key, $label, $o);
    }

    public static function number(string $key, string $label, array $o = []): array
    {
        return self::make('number', $key, $label, $o);
    }

    public static function slider(string $key, string $label, array $o = []): array
    {
        return self::make('slider', $key, $label, $o);
    }

    public static function code(string $key, string $label, array $o = []): array
    {
        return self::make('code', $key, $label, $o);
    }

    public static function datetime(string $key, string $label, array $o = []): array
    {
        return self::make('datetime', $key, $label, $o);
    }

    public static function dimensions(string $key, string $label, array $o = []): array
    {
        return self::make('dimensions', $key, $label, $o + ['responsive' => true]);
    }

    /** @param array<string,string> $options value => label */
    public static function select(string $key, string $label, array $options, array $o = []): array
    {
        return self::make('select', $key, $label, $o + ['options' => self::opts($options)]);
    }

    /** Segmented buttons (icons/short labels). */
    public static function choose(string $key, string $label, array $options, array $o = []): array
    {
        return self::make('choose', $key, $label, $o + ['options' => self::opts($options)]);
    }

    public static function repeater(string $key, string $label, array $fields, array $default = [], array $o = []): array
    {
        return self::make('repeater', $key, $label, $o + ['fields' => $fields, 'item_default' => $default]);
    }

    private static function opts(array $options): array
    {
        $out = [];
        foreach ($options as $value => $label) {
            $out[] = ['value' => (string) $value, 'label' => $label];
        }

        return $out;
    }
}
