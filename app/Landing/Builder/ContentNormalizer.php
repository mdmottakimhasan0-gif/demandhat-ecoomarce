<?php

namespace App\Landing\Builder;

use App\Landing\Builder\Exceptions\InvalidBuilderContent;
use Illuminate\Support\Str;

/**
 * Validates, versions and sanitises builder JSON before it is stored/imported.
 * Old schema versions are upgraded here so previously saved pages never break.
 */
class ContentNormalizer
{
    private array $seen = [];

    private int $nodes = 0;

    public function __construct(private ElementRegistry $registry) {}

    public static function emptyContent(): array
    {
        return ['version' => (int) config('landing.builder_version', 1), 'sections' => []];
    }

    /**
     * @param  bool  $allowCustomCode  keep raw custom_code contents (needs landing_pages.tracking)
     * @param  array|null  $previous  previously stored content; used to preserve custom code the editor may not change
     */
    public function normalize(mixed $content, bool $allowCustomCode = true, ?array $previous = null): array
    {
        if (is_string($content)) {
            $content = json_decode($content, true);
        }
        if (! is_array($content)) {
            return self::emptyContent();
        }

        if (strlen(json_encode($content)) > (int) config('landing.limits.max_content_bytes')) {
            throw new InvalidBuilderContent('The page is too large to save.');
        }

        $content = $this->migrate($content);
        $this->seen = [];
        $this->nodes = 0;

        $prevCode = [];
        if ($previous && ! $allowCustomCode) {
            foreach (ContentTree::ofType($previous, ['custom_code']) as $n) {
                $prevCode[$n['id']] = $n['content']['code'] ?? '';
            }
        }

        $sections = [];
        foreach ((array) ($content['sections'] ?? []) as $node) {
            $sections[] = $this->node($node, null, 1, $allowCustomCode, $prevCode);
        }

        return ['version' => (int) config('landing.builder_version', 1), 'sections' => $sections];
    }

    /** Upgrade older schema versions to the current one. */
    public function migrate(array $content): array
    {
        $version = (int) ($content['version'] ?? 1);

        // v0 (no version key) stored sections at the top level as "blocks".
        if (! isset($content['sections']) && isset($content['blocks']) && is_array($content['blocks'])) {
            $content['sections'] = $content['blocks'];
        }
        // Future: if ($version < 2) { ... transform ... }
        $content['version'] = max($version, 1);

        return $content;
    }

    private function node(mixed $node, ?string $parentType, int $depth, bool $allowCustomCode, array $prevCode): array
    {
        if (! is_array($node) || ! is_string($node['type'] ?? null)) {
            throw new InvalidBuilderContent('Every element needs a type.');
        }
        if ($depth > (int) config('landing.limits.max_depth')) {
            throw new InvalidBuilderContent('Elements are nested too deeply.');
        }
        if (++$this->nodes > (int) config('landing.limits.max_nodes')) {
            throw new InvalidBuilderContent('The page has too many elements.');
        }

        $type = $node['type'];
        $known = $this->registry->has($type);

        if ($known && ! $this->registry->accepts($parentType, $type)) {
            throw new InvalidBuilderContent(sprintf('A "%s" cannot be placed inside "%s".', $type, $parentType ?? 'the page'));
        }

        $out = [
            'id' => $this->uniqueId($node['id'] ?? null, $type),
            'type' => Str::limit(preg_replace('/[^a-z0-9_]/', '', strtolower($type)), 40, ''),
            'content' => is_array($node['content'] ?? null) ? $node['content'] : [],
            'settings' => is_array($node['settings'] ?? null) ? $node['settings'] : [],
        ];

        if ($known) {
            $out = $this->registry->get($type)->sanitizeNode($out, $allowCustomCode);
            if ($type === 'custom_code' && ! $allowCustomCode) {
                $out['content']['code'] = $prevCode[$out['id']] ?? '';
            }
        } else {
            // Unknown element: keep it (so it can be inspected/removed in the editor) but store nothing risky.
            $out['content'] = [];
            $out['settings'] = [];
        }

        $children = [];
        foreach ((array) ($node['children'] ?? []) as $child) {
            $children[] = $this->node($child, $type, $depth + 1, $allowCustomCode, $prevCode);
        }
        $out['children'] = $children;

        return $out;
    }

    /** Collision-resistant, stable element id: "<type>_<10 random chars>". */
    public static function newId(string $type = 'el'): string
    {
        return preg_replace('/[^a-z0-9_]/', '', strtolower($type)).'_'.strtolower(Str::random(10));
    }

    private function uniqueId(mixed $id, string $type): string
    {
        $id = is_string($id) ? $id : '';
        if (! preg_match('/^[a-z][a-z0-9_]{2,63}$/', $id) || isset($this->seen[$id])) {
            do {
                $id = self::newId($type);
            } while (isset($this->seen[$id]));
        }
        $this->seen[$id] = true;

        return $id;
    }

    /** Re-key every id (used when duplicating pages / creating from a template). */
    public function withFreshIds(array $content): array
    {
        $walk = function (array $nodes) use (&$walk) {
            foreach ($nodes as &$n) {
                $n['id'] = self::newId($n['type'] ?? 'el');
                if (! empty($n['children'])) {
                    $n['children'] = $walk($n['children']);
                }
            }

            return $nodes;
        };
        $content['sections'] = $walk($content['sections'] ?? []);

        return $content;
    }
}
