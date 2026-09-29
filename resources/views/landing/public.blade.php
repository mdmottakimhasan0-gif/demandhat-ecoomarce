<!DOCTYPE html>
<html lang="{{ $lang }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ $seo['title'] }}</title>
@foreach ($seo['meta'] as $m)
<meta {{ $m['attr'] }}="{{ $m['key'] }}" content="{{ $m['content'] }}">
@endforeach
@if ($seo['canonical'])
<link rel="canonical" href="{{ $seo['canonical'] }}">
@endif
@if ($favicon)
<link rel="icon" href="{{ $favicon }}">
@endif
<meta name="csrf-token" content="{{ csrf_token() }}">
@if ($fontsUrl)
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{{ $fontsUrl }}">
@endif
<style>{!! $css !!}</style>
@if ($flags['animations'])
<noscript><style>.lp-anim{opacity:1!important;transform:none!important}</style></noscript>
@endif
{!! $scripts['head'] !!}
</head>
<body class="lp-body {{ $bodyClass }}">
{!! $scripts['body_start'] !!}
@if ($headerHtml)
<header class="lp-site-header">{!! $headerHtml !!}</header>
@endif
<main class="lp-root" id="lp-root">{!! $body !!}</main>
@if ($footerHtml)
<footer class="lp-site-footer">{!! $footerHtml !!}</footer>
@endif
<script>window.__LP={!! $runtimeJs !!};</script>
<script src="{{ asset('vendor/landing/tracker.js') }}?v=3" defer></script>
{!! $scripts['body_end'] !!}
</body>
</html>
