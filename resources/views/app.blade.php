<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="facebook-domain-verification" content="rq7mn5jdlxuul12lwlev3y881n6rq4" />
   <link rel="icon" type="image/png" sizes="25" href="{{ asset('facon.png') }}?v=3">
    <title inertia>{{ config('app.name', 'Unity Haven') }}</title>
    
    @php
        $gtmId = \App\Models\SiteSetting::read('site.google_tag_manager_id', null);
        $pixelId = \App\Models\SiteSetting::read('site.meta_pixel_id') ?: env('VITE_FACEBOOK_PIXEL_ID', '1586781472722788');
        $pixelEnabled = (bool) \App\Models\SiteSetting::read('site.meta_pixel_enabled', true);
        $isLandingPageView = ($page['component'] ?? '') === 'Customer/LandingPageView';
    @endphp
    @if(!empty($gtmId))
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','{{ $gtmId }}');</script>
    <!-- End Google Tag Manager -->
    @endif

    @if(!empty($pixelId) && $pixelEnabled && !$isLandingPageView)
    <!-- Meta Pixel Code -->
    <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '{{ $pixelId }}');
    fbq('track', 'PageView');
    window._fbqInitialPageViewFired = true;
    </script>
    <noscript><img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id={{ $pixelId }}&ev=PageView&noscript=1"
    /></noscript>
    <!-- End Meta Pixel Code -->
    @endif

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    
    @inertiaHead
</head>
<body>
    @if(!empty($gtmId))
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ $gtmId }}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    @endif

    @inertia
</body>
</html>