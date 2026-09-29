<?php

namespace App\Landing\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Central sanitisation for everything that originates in builder JSON.
 * The renderer never trusts stored JSON: every URL, colour, length, class name,
 * CSS block and HTML fragment goes through here before reaching the page.
 */
class Sanitizer
{
    private const DROP_WITH_CONTENT = [
        'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea',
        'select', 'svg', 'math', 'link', 'meta', 'base', 'noscript', 'template', 'frame',
        'frameset', 'applet', 'audio', 'video', 'source', 'canvas', 'head', 'title',
    ];

    private const TAGS = [
        'rich' => ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'span', 'blockquote', 'hr', 'sub', 'sup', 'small', 'code', 'pre', 'mark'],
        'html' => ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'span', 'blockquote', 'hr', 'sub', 'sup', 'small', 'code', 'pre', 'mark', 'div', 'section', 'article',
            'header', 'footer', 'nav', 'figure', 'figcaption', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
            'caption', 'dl', 'dt', 'dd', 'address', 'details', 'summary'],
    ];

    private const ATTRS = [
        'a' => ['href', 'title', 'target', 'rel'],
        'img' => ['src', 'alt', 'width', 'height', 'loading', 'title'],
        'td' => ['colspan', 'rowspan'],
        'th' => ['colspan', 'rowspan'],
        '*' => ['class', 'id', 'style', 'title', 'lang', 'dir'],
    ];

    private const STYLE_PROPS = [
        'text-align' => '/^(left|right|center|justify)$/i',
        'color' => null, // validated via color()
        'background-color' => null,
        'font-size' => null, // validated via length()
        'font-weight' => '/^(normal|bold|bolder|lighter|[1-9]00)$/i',
        'font-style' => '/^(normal|italic)$/i',
        'text-decoration' => '/^(none|underline|line-through)$/i',
        'margin' => null, 'margin-top' => null, 'margin-bottom' => null, 'padding' => null,
    ];

    /** Sanitise an HTML fragment with an allowlist. $profile: rich|html */
    public static function html(?string $html, string $profile = 'rich'): string
    {
        $html = (string) $html;
        if (trim($html) === '') {
            return '';
        }

        $allowed = self::TAGS[$profile] ?? self::TAGS['rich'];
        $dom = new DOMDocument('1.0', 'UTF-8');
        $prev = libxml_use_internal_errors(true);
        $dom->loadHTML(
            '<?xml encoding="utf-8" ?><body><div id="lp-sanitize-root">'.$html.'</div></body>',
            LIBXML_HTML_NODEFDTD | LIBXML_NOERROR | LIBXML_NOWARNING
        );
        libxml_clear_errors();
        libxml_use_internal_errors($prev);

        $root = $dom->getElementById('lp-sanitize-root');
        if (! $root) {
            return e(strip_tags($html));
        }

        self::cleanChildren($root, $allowed);

        $out = '';
        foreach ($root->childNodes as $child) {
            $out .= $dom->saveHTML($child);
        }

        return trim($out);
    }

    private static function cleanChildren(DOMNode $parent, array $allowed): void
    {
        foreach (iterator_to_array($parent->childNodes) as $node) {
            if ($node->nodeType === XML_COMMENT_NODE || $node->nodeType === XML_PI_NODE || $node->nodeType === XML_CDATA_SECTION_NODE) {
                $parent->removeChild($node);

                continue;
            }
            if (! $node instanceof DOMElement) {
                continue;
            }

            $tag = strtolower($node->tagName);

            if (in_array($tag, self::DROP_WITH_CONTENT, true)) {
                $parent->removeChild($node);

                continue;
            }

            self::cleanChildren($node, $allowed);

            if (! in_array($tag, $allowed, true)) {
                // Unwrap: keep the (already cleaned) children, drop the element.
                while ($node->firstChild) {
                    $parent->insertBefore($node->firstChild, $node);
                }
                $parent->removeChild($node);

                continue;
            }

            self::cleanAttributes($node, $tag);
        }
    }

    private static function cleanAttributes(DOMElement $node, string $tag): void
    {
        $allowedAttrs = array_merge(self::ATTRS[$tag] ?? [], self::ATTRS['*']);

        foreach (iterator_to_array($node->attributes) as $attr) {
            $name = strtolower($attr->name);

            if (! in_array($name, $allowedAttrs, true) || str_starts_with($name, 'on')) {
                $node->removeAttribute($attr->name);

                continue;
            }

            $value = $attr->value;

            if ($name === 'href' || $name === 'src') {
                $clean = self::url($value, $name === 'src' ? ['http', 'https'] : ['http', 'https', 'mailto', 'tel']);
                $clean === '' ? $node->removeAttribute($attr->name) : $node->setAttribute($attr->name, $clean);
            } elseif ($name === 'style') {
                $clean = self::inlineStyle($value);
                $clean === '' ? $node->removeAttribute('style') : $node->setAttribute('style', $clean);
            } elseif ($name === 'class' || $name === 'id') {
                $clean = self::token($value, true);
                $clean === '' ? $node->removeAttribute($attr->name) : $node->setAttribute($attr->name, $clean);
            } elseif ($name === 'target') {
                in_array($value, ['_blank', '_self'], true) ? null : $node->removeAttribute('target');
            } elseif ($name === 'loading') {
                in_array($value, ['lazy', 'eager'], true) ? null : $node->removeAttribute('loading');
            } elseif (in_array($name, ['width', 'height', 'colspan', 'rowspan'], true)) {
                preg_match('/^\d{1,4}$/', $value) ? null : $node->removeAttribute($name);
            }
        }

        if ($tag === 'a' && $node->getAttribute('target') === '_blank') {
            $node->setAttribute('rel', 'noopener noreferrer');
        } elseif ($tag === 'a') {
            $node->removeAttribute('rel');
        }
        if ($tag === 'img' && ! $node->hasAttribute('loading')) {
            $node->setAttribute('loading', 'lazy');
        }
    }

    private static function inlineStyle(string $style): string
    {
        $out = [];
        foreach (explode(';', $style) as $decl) {
            [$prop, $val] = array_pad(explode(':', $decl, 2), 2, '');
            $prop = strtolower(trim($prop));
            $val = trim($val);
            if ($prop === '' || $val === '' || ! array_key_exists($prop, self::STYLE_PROPS)) {
                continue;
            }
            $rule = self::STYLE_PROPS[$prop];
            $clean = match (true) {
                $rule !== null => preg_match($rule, $val) ? $val : '',
                str_contains($prop, 'color') || $prop === 'color' => self::color($val) ?? '',
                default => self::length($val) ?? '',
            };
            if ($clean !== '') {
                $out[] = $prop.': '.$clean;
            }
        }

        return implode('; ', $out);
    }

    /**
     * Returns a safe URL or '' when it is not acceptable.
     * Relative URLs (/path, #anchor, ?query) are allowed; javascript:, data:, vbscript: never are.
     */
    public static function url(?string $url, array $schemes = ['http', 'https', 'mailto', 'tel'], bool $allowRelative = true): string
    {
        $url = trim((string) $url);
        if ($url === '' || strlen($url) > 2048) {
            return '';
        }
        // Strip control characters and whitespace that browsers ignore inside schemes.
        $probe = preg_replace('/[\x00-\x20\x7f]+/', '', $url);
        if (preg_match('/[<>"\'`]/', $url)) {
            return '';
        }

        if (preg_match('/^([a-z][a-z0-9+.\-]*):/i', $probe, $m)) {
            return in_array(strtolower($m[1]), $schemes, true) ? $url : '';
        }
        if (str_starts_with($probe, '//')) {
            return in_array('https', $schemes, true) ? $url : '';
        }
        if ($allowRelative && preg_match('#^([/\#?]|[A-Za-z0-9_\-.~%]+(/|$))#', $probe)) {
            return $url;
        }

        return '';
    }

    /** Hex / rgb / hsl / named colour, or null when invalid. */
    public static function color(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }
        $v = trim($value);
        if ($v === '') {
            return null;
        }
        if (preg_match('/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i', $v)) {
            return $v;
        }
        if (preg_match('/^(rgb|rgba|hsl|hsla)\(\s*[0-9.,%\s\/deg-]{3,60}\)$/i', $v)) {
            return $v;
        }
        if (preg_match('/^(transparent|currentcolor|inherit|[a-z]{3,20})$/i', $v)) {
            return $v;
        }

        return null;
    }

    /** CSS length / keyword / restricted calc(), or null when invalid. */
    public static function length(mixed $value): ?string
    {
        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }
        if (! is_string($value)) {
            return null;
        }
        $v = trim($value);
        if ($v === '') {
            return null;
        }
        if (preg_match('/^-?(\d+|\d*\.\d+)(px|em|rem|%|vh|vw|vmin|vmax|ch|s|ms|deg|fr)?$/i', $v)) {
            return $v;
        }
        if (preg_match('/^(auto|none|inherit|initial|unset|fit-content|min-content|max-content|normal|0)$/i', $v)) {
            return $v;
        }
        if (preg_match('/^calc\([0-9a-z%.+\-*\/() ]{1,80}\)$/i', $v)) {
            return $v;
        }
        if (preg_match('/^clamp\([0-9a-z%.,+\-*\/() ]{1,80}\)$/i', $v)) {
            return $v;
        }

        return null;
    }

    public static function number(mixed $value, float $min = -10000, float $max = 10000): ?string
    {
        if (! is_numeric($value)) {
            return null;
        }

        return (string) max($min, min($max, (float) $value));
    }

    public static function enum(mixed $value, array $allowed): ?string
    {
        return is_string($value) && in_array($value, $allowed, true) ? $value : null;
    }

    /** class/id token(s): letters, digits, dash, underscore, spaces (classes only). */
    public static function token(?string $value, bool $multi = false): string
    {
        $pattern = $multi ? '/[^A-Za-z0-9_\- ]+/' : '/[^A-Za-z0-9_\-]+/';
        $clean = trim(preg_replace($pattern, '', (string) $value));

        return substr(preg_replace('/\s+/', ' ', $clean), 0, 200);
    }

    /**
     * Scope-and-clean user CSS. `selector` is replaced with the element selector.
     * Anything that could load remote code or break out of the <style> tag is rejected.
     */
    public static function css(?string $css, string $selector = ''): string
    {
        $css = (string) $css;
        if (trim($css) === '' || strlen($css) > 20000) {
            return '';
        }
        $css = preg_replace('#/\*.*?\*/#s', '', $css);
        $css = str_ireplace('selector', $selector, $css);

        $bad = '/(<|>|@import|@charset|@namespace|expression\s*\(|behavior\s*:|-moz-binding|javascript:|vbscript:|data:text|\\\\)/i';
        if (preg_match($bad, $css)) {
            return '';
        }
        // url() only with http(s) or root-relative targets.
        if (preg_match_all('/url\(\s*([^)]*)\)/i', $css, $m)) {
            foreach ($m[1] as $target) {
                if (self::url(trim($target, " \t\n\r\"'"), ['http', 'https']) === '') {
                    return '';
                }
            }
        }
        if (substr_count($css, '{') !== substr_count($css, '}')) {
            return '';
        }

        return trim($css);
    }

    public static function fontFamily(?string $value): ?string
    {
        $map = self::fontStacks();

        return isset($map[$value]) ? $map[$value] : null;
    }

    /** Allowed font "keys" => CSS font-family stack. Web fonts are loaded on demand. */
    public static function fontStacks(): array
    {
        return [
            'system' => 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
            'serif' => 'Georgia,"Times New Roman",serif',
            'mono' => 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
            'Inter' => '"Inter",system-ui,sans-serif',
            'Poppins' => '"Poppins",system-ui,sans-serif',
            'Roboto' => '"Roboto",system-ui,sans-serif',
            'Montserrat' => '"Montserrat",system-ui,sans-serif',
            'Open Sans' => '"Open Sans",system-ui,sans-serif',
            'Lato' => '"Lato",system-ui,sans-serif',
            'Playfair Display' => '"Playfair Display",Georgia,serif',
            'Hind Siliguri' => '"Hind Siliguri","Noto Sans Bengali",system-ui,sans-serif',
        ];
    }

    public static function isWebFont(string $key): bool
    {
        return ! in_array($key, ['system', 'serif', 'mono'], true) && isset(self::fontStacks()[$key]);
    }
}
