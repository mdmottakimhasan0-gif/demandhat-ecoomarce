<?php

namespace App\Services\Landing;

use App\Models\LandingPage;
use App\Models\LandingPageVersion;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LandingPageVersionService
{
    /** Snapshot the page's current draft. Call inside the caller's transaction when saving. */
    public function snapshot(LandingPage $page, ?User $user = null, ?string $label = null): LandingPageVersion
    {
        return DB::transaction(function () use ($page, $user, $label) {
            $next = ((int) LandingPageVersion::where('landing_page_id', $page->id)->lockForUpdate()->max('version_number')) + 1;

            $version = LandingPageVersion::create([
                'landing_page_id' => $page->id,
                'version_number' => $next,
                'label' => $label ? mb_substr($label, 0, 120) : null,
                'content_json' => $page->content_json,
                'settings_json' => $page->settings_json,
                'seo_json' => $page->seo_json,
                'tracking_json' => $page->tracking_json,
                'created_by' => $user?->id,
                'created_at' => now(),
            ]);

            $this->prune($page);

            return $version;
        });
    }

    /** Overwrite the DRAFT with an older version. The published version is untouched. */
    public function restore(LandingPage $page, LandingPageVersion $version, ?User $user = null): LandingPageVersion
    {
        abort_unless($version->landing_page_id === $page->id, 404);

        return DB::transaction(function () use ($page, $version, $user) {
            $page->fill([
                'content_json' => $version->content_json,
                'settings_json' => $version->settings_json,
                'seo_json' => $version->seo_json,
                'tracking_json' => $version->tracking_json,
            ])->save();

            return $this->snapshot($page->fresh(), $user, 'Restored from v'.$version->version_number);
        });
    }

    /** Refuses to delete the version visitors currently see. */
    public function delete(LandingPage $page, LandingPageVersion $version): void
    {
        abort_unless($version->landing_page_id === $page->id, 404);

        if ($page->published_version_id === $version->id) {
            throw new \DomainException('The published version cannot be deleted. Unpublish or publish a newer version first.');
        }
        $version->delete();
    }

    /** @return list<array> */
    public function list(LandingPage $page): array
    {
        $latest = (int) $page->versions()->max('version_number');

        return $page->versions()->with('creator:id,name')->get()->map(fn (LandingPageVersion $v) => [
            'id' => $v->id,
            'number' => $v->version_number,
            'label' => $v->label,
            'created_at' => $v->created_at?->toIso8601String(),
            'created_by' => $v->creator?->name,
            'elements' => \App\Landing\Builder\ContentTree::count($v->content_json ?? []),
            'size_kb' => round(strlen(json_encode($v->content_json ?? [])) / 1024, 1),
            'is_published' => $page->published_version_id === $v->id,
            'is_latest' => $v->version_number === $latest,
        ])->all();
    }

    private function prune(LandingPage $page): void
    {
        $max = (int) config('landing.max_versions', 50);
        $ids = LandingPageVersion::where('landing_page_id', $page->id)
            ->when($page->published_version_id, fn ($q) => $q->where('id', '!=', $page->published_version_id))
            ->orderByDesc('version_number')->skip($max)->take(1000)->pluck('id');

        if ($ids->isNotEmpty()) {
            LandingPageVersion::whereIn('id', $ids)->delete();
        }
    }
}
