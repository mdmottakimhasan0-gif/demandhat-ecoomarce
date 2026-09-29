<?php

namespace App\Landing\Builder;

/** Read-only helpers for walking builder JSON. */
final class ContentTree
{
    public static function walk(array $content, callable $fn): void
    {
        $visit = function (array $nodes, ?array $parent) use (&$visit, $fn) {
            foreach ($nodes as $node) {
                if (! is_array($node)) {
                    continue;
                }
                $fn($node, $parent);
                if (! empty($node['children']) && is_array($node['children'])) {
                    $visit($node['children'], $node);
                }
            }
        };
        $visit($content['sections'] ?? [], null);
    }

    public static function find(array $content, string $id): ?array
    {
        $found = null;
        self::walk($content, function ($node) use ($id, &$found) {
            if ($found === null && ($node['id'] ?? null) === $id) {
                $found = $node;
            }
        });

        return $found;
    }

    /** Find by the CSS-safe id used in data-lp-ev attributes. */
    public static function findSafe(array $content, string $safeId): ?array
    {
        $found = null;
        self::walk($content, function ($node) use ($safeId, &$found) {
            if ($found === null && AbstractElement::safeId($node['id'] ?? '') === $safeId) {
                $found = $node;
            }
        });

        return $found;
    }

    /** Find first node matching predicate. */
    public static function findFirst(array $content, callable $predicate): ?array
    {
        $found = null;
        self::walk($content, function ($node) use ($predicate, &$found) {
            if ($found === null && $predicate($node)) {
                $found = $node;
            }
        });

        return $found;
    }

    /** @return list<array> every node of one of the given types */
    public static function ofType(array $content, array $types): array
    {
        $out = [];
        self::walk($content, function ($node) use ($types, &$out) {
            if (in_array($node['type'] ?? '', $types, true)) {
                $out[] = $node;
            }
        });

        return $out;
    }

    public static function count(array $content): int
    {
        $n = 0;
        self::walk($content, function () use (&$n) {
            $n++;
        });

        return $n;
    }
}
