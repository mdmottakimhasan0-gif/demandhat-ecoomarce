<?php

namespace App\Landing\Builder;

use App\Landing\Support\Sanitizer;

/** Mutable state shared while rendering one page. */
class RenderContext
{
    /** Generated CSS chunks, appended in document order. */
    private array $css = [];

    /** Web fonts referenced by the page. */
    public array $fonts = [];

    public bool $hasAnimations = false;

    public bool $hasForm = false;

    public bool $hasCountdown = false;

    public bool $hasCustomCode = false;

    /** Page settings (including linked product_id, etc.) */
    public ?array $settings = null;

    /** Linked Product model if a product_id is set in page settings */
    public mixed $product = null;

    /** Elements that carry a tracking event: element id => config. */
    public array $trackedElements = [];

    public function __construct(
        public readonly bool $editing = false,
        /** Per-request values for [shortcodes] such as utm_source. */
        public readonly array $vars = [],
        public readonly bool $allowCustomCode = true,
        /** Emit [[lp:utm_x]] tokens for per-visitor values so the compiled page stays cacheable. */
        public readonly bool $deferVars = false,
    ) {}

    public function addCss(string $css): void
    {
        if ($css !== '') {
            $this->css[] = $css;
        }
    }

    public function css(): string
    {
        return implode('', $this->css);
    }

    public function useFont(?string $key): void
    {
        if ($key && Sanitizer::isWebFont($key)) {
            $this->fonts[$key] = true;
        }
    }
}
