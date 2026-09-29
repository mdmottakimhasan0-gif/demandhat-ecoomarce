<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Canvas</title>
<link id="lp-fonts" rel="stylesheet" href="{{ $fontsUrl ?: '' }}" @if (! $fontsUrl) disabled @endif>
<style id="lp-css">{!! $compiled['css'] !!}</style>
<link rel="stylesheet" href="{{ asset('vendor/landing/canvas-editor.css') }}?v=3">
</head>
<body class="lp-body lp-editing {{ $bodyClass }}">
<main class="lp-root" id="lp-root">{!! $compiled['body'] !!}</main>
<div id="lp-drop-line" hidden></div>
<script src="{{ asset('vendor/landing/canvas-bridge.js') }}?v=3"></script>
</body>
</html>
