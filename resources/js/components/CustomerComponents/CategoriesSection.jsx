import React from "react";
import { Link } from "@inertiajs/react";

function CategoriesSection({ categoriesComing }) {
    const categories = categoriesComing || [];

    if (categories.length === 0) return null;

    // Duplicate the list to create a seamless infinite loop
    const doubled = [...categories, ...categories];

    const isBangla = (text) => /[\u0980-\u09FF]/.test(text);

    return (
        <div className="bg-white py-6">
            {/* ── Header ── */}
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-3 font-poppins text-xl md:text-2xl font-bold text-slate-800">
                    <span className="h-7 w-1.5 rounded-full bg-gradient-to-b from-amber-400 to-emerald-600" />
                    Top Categories
                </h2>
                <Link
                    href="/categories"
                    className="text-sm font-semibold text-[#059669] hover:underline underline-offset-4 transition-all duration-200 font-inter"
                >
                    View All →
                </Link>
            </div>

            {/* ── Marquee Track ── */}
            {/*
                Overflow hidden on the outer wrapper clips the scrolling track.
                The inner .marquee-track is animated via a CSS keyframe defined
                in a <style> tag below — no JS interval needed.
                "pause on hover" is done via animation-play-state.
            */}
            <div className="overflow-hidden w-full">
                <style>{`
                    @keyframes marquee-rtl {
                        0%   { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .marquee-track {
                        display: flex;
                        width: max-content;
                        animation: marquee-rtl 28s linear infinite;
                    }
                    .marquee-track:hover {
                        animation-play-state: paused;
                    }
                `}</style>

                <div className="marquee-track gap-4 px-4">
                    {doubled.map((cat, index) => (
                        <Link
                            key={`${cat.id}-${index}`}
                            href={`/category/${cat.id}`}
                            className="group shrink-0 block"
                            style={{ width: "140px" }}
                        >
                            {/* ── Card ── */}
                            <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                 style={{ width: "140px", height: "175px" }}>

                                {/* Background: photo or gradient */}
                                {cat.photo ? (
                                    <img
                                        src={`/storage/${cat.photo}`}
                                        alt={cat.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#059669] to-[#065F46]" />
                                )}

                                {/* Dark scrim */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                                {/* Glassmorphic name panel */}
                                <div className="absolute bottom-0 left-0 right-0
                                                px-2.5 py-2.5
                                                bg-white/15 backdrop-blur-md
                                                border-t border-white/20
                                                group-hover:bg-white/25
                                                transition-all duration-300">
                                    <h3
                                        className={`text-white font-semibold text-xs leading-snug line-clamp-2 text-center drop-shadow-sm ${
                                            isBangla(cat.name) ? "" : "font-poppins"
                                        }`}
                                        style={isBangla(cat.name) ? { fontFamily: "'Hind Siliguri', sans-serif" } : {}}
                                    >
                                        {cat.name}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CategoriesSection;
