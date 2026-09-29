<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

class VideoElement extends AbstractElement
{
    public function type(): string
    {
        return 'video';
    }

    public function label(): string
    {
        return 'Video';
    }

    public function category(): string
    {
        return 'basic';
    }

    public function defaults(): array
    {
        return ['content' => ['source' => 'youtube', 'url' => '', 'controls' => true], 'settings' => [], 'children' => []];
    }

    protected function contentControls(): array
    {
        return [
            Control::select('source', 'Source', ['youtube' => 'YouTube', 'vimeo' => 'Vimeo', 'file' => 'Video file (MP4/WebM)'], ['default' => 'youtube']),
            Control::url('url', 'Video URL', ['placeholder' => 'https://www.youtube.com/watch?v=...']),
            Control::image('poster', 'Poster image', ['if' => ['source' => ['file']]]),
            Control::switch('controls', 'Show controls', ['default' => true, 'if' => ['source' => ['file']]]),
            Control::switch('loop', 'Loop', ['if' => ['source' => ['file']]]),
            Control::switch('muted', 'Muted', ['if' => ['source' => ['file']]]),
        ];
    }

    protected function styleGroups(): array
    {
        return ['border', 'effects'];
    }

    protected function styleControls(): array
    {
        return [Control::text('max_width', 'Max width', ['tab' => 'style', 'section' => 'Size', 'responsive' => true, 'placeholder' => '800px'])];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        return $root.'{margin-left:auto;margin-right:auto}'.$root.' .lp-video-frame{position:relative;aspect-ratio:16/9;overflow:hidden;background:#000;border-radius:inherit}'
            .$root.' iframe,'.$root.' video{position:absolute;inset:0;width:100%;height:100%;border:0}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $source = $this->c($node, 'source', 'youtube');
        $url = Sanitizer::url($this->c($node, 'url', ''), ['http', 'https']);
        $inner = '';

        if ($url !== '') {
            if ($source === 'youtube' && preg_match('~(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/|shorts/))([A-Za-z0-9_-]{11})~', $url, $m)) {
                $inner = '<iframe src="https://www.youtube-nocookie.com/embed/'.$m[1].'" title="Video" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
            } elseif ($source === 'vimeo' && preg_match('~vimeo\.com/(?:video/)?(\d{5,12})~', $url, $m)) {
                $inner = '<iframe src="https://player.vimeo.com/video/'.$m[1].'?dnt=1" title="Video" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>';
            } elseif ($source === 'file') {
                $poster = Sanitizer::url($this->c($node, 'poster', ''), ['http', 'https']);
                $inner = '<video preload="none" playsinline'
                    .($this->c($node, 'controls', true) ? ' controls' : '')
                    .($this->c($node, 'loop') ? ' loop' : '')
                    .($this->c($node, 'muted') ? ' muted' : '')
                    .($poster !== '' ? ' poster="'.e($poster).'"' : '')
                    .' src="'.e($url).'"></video>';
            }
        }

        if ($inner === '') {
            $inner = $ctx->editing ? '<div class="lp-placeholder">Add a video URL</div>' : '';
            if ($inner === '') {
                return '';
            }
        }

        return $this->open($node, $ctx).'<div class="lp-video-frame">'.$inner.'</div></div>';
    }
}
