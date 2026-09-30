import { createInertiaApp, router } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import NProgress from "nprogress";
import ReactPixel from "react-facebook-pixel";

import "@fontsource/delius";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/700.css";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/500.css";
import "@fontsource/hind-siliguri/600.css";
import "@fontsource/hind-siliguri/700.css";

// Initialize dataLayer for GTM
window.dataLayer = window.dataLayer || [];

router.on("start", () => NProgress.start());
router.on("finish", () => NProgress.done());

router.on("navigate", (event) => {
    const pageComponent = event.detail.page?.component || "";
    // If navigating to a builder-created landing page, DO NOT fire the global site pixel
    // Note: Customer/LandingPage is the store's main homepage, whereas Customer/LandingPageView is the landing page builder
    if (pageComponent === "Customer/LandingPageView") {
        return;
    }

    const pixelId = event.detail.page?.props?.sitePixel?.id;
    const pixelEnabled = event.detail.page?.props?.sitePixel?.enabled !== false;
    if (pixelId && pixelEnabled && !window._hasGlobalPixel) {
        ReactPixel.init(pixelId, null, { autoConfig: true, debug: false });
        window._hasGlobalPixel = true;
    }

    const eventId =
        "pageview_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    // 1. FB Pixel SPA Tracking (only for main website)
    if (window._hasGlobalPixel) {
        ReactPixel.track("PageView", {}, { eventID: eventId });
    }

    // 2. GTM SPA Tracking
    window.dataLayer.push({
        event: "page_view",
        event_id: eventId,
        page_path: event.detail.page.url,
    });
});

createInertiaApp({
    progress: {
        showSpinner: false,
        color: "#29d",
        includeCSS: true,
        delay: 0,
    },
    resolve: (name) => {
        const pages = import.meta.glob("./Pages/**/*.jsx");
        return pages[`./Pages/${name}.jsx`]();
    },

    setup({ el, App, props }) {
        const options = { autoConfig: true, debug: false };
        const initialPage = props.initialPage;
        const sitePixel = initialPage?.props?.sitePixel;
        const pixelId = sitePixel?.enabled ? sitePixel?.id : null;
        const pageComponent = initialPage?.component || "";
        const isLandingPage = pageComponent === "Customer/LandingPageView";

        if (pixelId && !isLandingPage) {
            ReactPixel.init(pixelId, null, options);
            window._hasGlobalPixel = true;

            const initialEventId =
                "pageview_" +
                Date.now() +
                "_" +
                Math.floor(Math.random() * 1000);

            // Initial FB tracking
            ReactPixel.track("PageView", {}, { eventID: initialEventId });

            // Initial GTM tracking
            window.dataLayer.push({
                event: "page_view",
                event_id: initialEventId,
                page_path: window.location.pathname,
            });
        }

        createRoot(el).render(<App {...props} />);
    },
});
