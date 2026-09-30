import React from "react";

export const BRAND_NAME = "Unity Haven";

/**
 * The Unity Haven wordmark.
 * tone="light" is for dark backgrounds, tone="dark" for light ones.
 */
export default function Brand({ tone = "light", size = "text-2xl", mark = true, className = "" }) {
    const first = tone === "light" ? "text-white" : "text-slate-900";
    const second = tone === "light" ? "text-violet-400" : "text-indigo-600";

    return (
        <span className={`inline-flex items-center gap-2.5 font-poppins font-bold tracking-tight leading-none ${size} ${className}`}>
            {mark && (
                <img
                    src="/logo.png"
                    alt="Unity Haven"
                    className="h-[1.4em] w-auto object-contain rounded-md shadow-sm"
                />
            )}
            <span>
                <span className={first}>Unity</span>
                <span className={second}> Haven</span>
            </span>
        </span>
    );
}
