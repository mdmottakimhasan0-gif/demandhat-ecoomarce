<?php

namespace App\Landing\Builder;

/**
 * Collects declarations per breakpoint and emits mobile-first CSS:
 *   base            -> mobile
 *   min-width:768   -> tablet
 *   min-width:1025  -> desktop
 * Only declarations that differ from the previous (smaller) breakpoint are emitted.
 */
class CssBuilder
{
    public const TABLET_MIN = 768;
    public const DESKTOP_MIN = 1025;

    /** @var array<string, array<string, array<string,string>>> bp => selector => prop => value */
    private array $rules = ['base' => [], 'tablet' => [], 'desktop' => []];

    /** Raw blocks (custom CSS, visibility media queries). */
    private array $raw = [];

    /** @param array{mobile:mixed,tablet:mixed,desktop:mixed} $resolved */
    public function add(string $selector, string $prop, array $resolved): void
    {
        $prev = null;
        foreach (['base' => 'mobile', 'tablet' => 'tablet', 'desktop' => 'desktop'] as $bp => $device) {
            $value = $resolved[$device] ?? null;
            if ($value !== $prev) {
                $this->rules[$bp][$selector][$prop] = $value ?? 'unset';
                $prev = $value;
            }
        }
    }

    /** Add the same value at every breakpoint. */
    public function set(string $selector, string $prop, string $value): void
    {
        $this->rules['base'][$selector][$prop] = $value;
    }

    public function raw(string $css): void
    {
        if ($css !== '') {
            $this->raw[] = $css;
        }
    }

    public function toString(): string
    {
        $out = '';
        foreach ($this->rules['base'] as $sel => $decls) {
            $out .= $sel.'{'.$this->decls($decls).'}';
        }
        foreach (['tablet' => self::TABLET_MIN, 'desktop' => self::DESKTOP_MIN] as $bp => $min) {
            if (! $this->rules[$bp]) {
                continue;
            }
            $inner = '';
            foreach ($this->rules[$bp] as $sel => $decls) {
                $inner .= $sel.'{'.$this->decls($decls).'}';
            }
            $out .= '@media(min-width:'.$min.'px){'.$inner.'}';
        }

        return $out.implode('', $this->raw);
    }

    private function decls(array $decls): string
    {
        $s = '';
        foreach ($decls as $p => $v) {
            $s .= $p.':'.$v.';';
        }

        return $s;
    }
}
