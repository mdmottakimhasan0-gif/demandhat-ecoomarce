import React from "react";

export const BRAND_NAME = "Demand Bazar";

/**
 * The Demand Bazar wordmark.
 * tone="light" is for dark backgrounds, tone="dark" for light ones.
 */
export default function Brand({ tone = "light", size = "text-2xl", mark = true, className = "" }) {
    const first = tone === "light" ? "text-white" : "text-slate-900";
    const second = tone === "light" ? "text-amber-300" : "text-emerald-600";

    return (
        <span className={`inline-flex items-center gap-2 font-poppins font-bold tracking-tight leading-none ${size} ${className}`}>
            {mark && (
                <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-emerald-900 shadow-sm w-[1.35em] h-[1.35em] text-[0.7em] font-extrabold">
                    D
                </span>
            )}
            <span>
                <span className={first}>Demand</span>
                <span className={second}> Bazar</span>
            </span>
        </span>
    );
}
