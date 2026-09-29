<?php

namespace App\Services\Landing;

use App\Models\LandingPageMedia;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LandingPageMediaService
{
    /**
     * Validate by CONTENT (not the client supplied name/mime) and store under a random name.
     * SVG and everything non-raster is rejected.
     */
    public function store(UploadedFile $file, User $user): LandingPageMedia
    {
        $cfg = config('landing.media');
        $path = $file->getRealPath();

        $info = $path ? @getimagesize($path) : false;
        $mime = $path ? (new \finfo(FILEINFO_MIME_TYPE))->file($path) : null;

        if (! $info || ! in_array($mime, $cfg['mimes'], true) || ! in_array($info['mime'] ?? '', $cfg['mimes'], true)) {
            throw ValidationException::withMessages(['file' => 'Only JPEG, PNG or WEBP images are allowed.']);
        }
        if ($file->getSize() > $cfg['max_kb'] * 1024) {
            throw ValidationException::withMessages(['file' => 'The image may not be larger than '.round($cfg['max_kb'] / 1024, 1).' MB.']);
        }

        $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime];
        $name = Str::lower(Str::random(28)).'.'.$ext;
        $dir = trim($cfg['directory'], '/').'/'.date('Y/m');

        Storage::disk($cfg['disk'])->putFileAs($dir, $file, $name, 'public');

        return LandingPageMedia::create([
            'uploaded_by' => $user->id,
            'disk' => $cfg['disk'],
            'path' => $dir.'/'.$name,
            'original_name' => mb_substr(preg_replace('/[^\w.\- ]+/u', '', $file->getClientOriginalName()), 0, 200) ?: 'image.'.$ext,
            'mime' => $mime,
            'size' => $file->getSize(),
            'width' => $info[0] ?? null,
            'height' => $info[1] ?? null,
            'alt' => null,
        ]);
    }

    public function delete(LandingPageMedia $media): void
    {
        $media->deleteFile();
        $media->delete();
    }
}
