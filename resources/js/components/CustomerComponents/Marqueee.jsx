import React from "react";
import { usePage } from "@inertiajs/react";

function Marqueee() {
    // 1. Get the shared data from Inertia
    const { global } = usePage().props;

    // 2. Safely access the content (Fallback to default if DB is empty)
    const marqueeText =
        global?.marquee?.content ||
        "Welcome to our shop! Cash on delivery available.";

    // If you want to hide the marquee entirely if there is no text in DB:
    if (!marqueeText) return null;

    return (
        <>
            <div
                className="marquee-wrapper bg-amber-400 text-emerald-950 font-medium border-b border-amber-500/40 py-2 text-sm"
            >
                <div className="marquee-track tracking-wide font-hindSiliguri">
                    {/* Display the dynamic text twice for the loop effect */}
                    <span className="px-8 whitespace-nowrap">
                        {marqueeText}
                    </span>
                    <span className="px-8 whitespace-nowrap">
                        {marqueeText}
                    </span>
                </div>
            </div>
        </>
    );
}

export default Marqueee;
