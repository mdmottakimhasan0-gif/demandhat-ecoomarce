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
    const eventId =
        "pageview_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    // 1. FB Pixel SPA Tracking
    ReactPixel.track("PageView", {}, { eventID: eventId });

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
        const pixelId = import.meta.env.VITE_FACEBOOK_PIXEL_ID;

        if (pixelId) {
            ReactPixel.init(pixelId, null, options);

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
