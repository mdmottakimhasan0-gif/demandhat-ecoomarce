<?php

namespace App\Http\Controllers\Landing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Landing\UploadMediaRequest;
use App\Models\LandingPageMedia;
use App\Services\Landing\LandingPageMediaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class LandingMediaController extends Controller
{
    public function __construct(private LandingPageMediaService $media) {}

    public function index()
    {
        Gate::authorize('landing_pages.view');

        return Inertia::render('Admin/LandingPages/Media', ['maxKb' => config('landing.media.max_kb')]);
    }

    /** JSON list used by the page and the builder's media picker. */
    public function list(Request $request)
    {
        Gate::authorize('landing_pages.view');

        $paginator = LandingPageMedia::query()
            ->when($request->filled('search'), function ($q) use ($request) {
                $t = '%'.addcslashes((string) $request->string('search'), '%_\\').'%';
                $q->where(fn ($w) => $w->where('original_name', 'like', $t)->orWhere('alt', 'like', $t));
            })
            ->latest()->paginate(24)->withQueryString();

        return response()->json($paginator);
    }

    public function store(UploadMediaRequest $request)
    {
        $media = $this->media->store($request->file('file'), $request->user());
        if ($request->filled('alt')) {
            $media->update(['alt' => $request->input('alt')]);
        }

        return response()->json(['ok' => true, 'media' => $media], 201);
    }

    public function update(Request $request, LandingPageMedia $media)
    {
        Gate::authorize('landing_pages.edit');
        $data = $request->validate(['alt' => ['nullable', 'string', 'max:255']]);
        $media->update($data);

        return response()->json(['ok' => true, 'media' => $media]);
    }

    public function destroy(LandingPageMedia $media)
    {
        Gate::authorize('landing_pages.delete');
        $this->media->delete($media);

        return response()->json(['ok' => true]);
    }
}
