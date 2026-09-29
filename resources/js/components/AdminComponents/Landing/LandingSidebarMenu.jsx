import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { ChevronDown, PanelsTopLeft } from "lucide-react";

const ITEMS = [
    ["All Landing Pages", "/admin/landing-pages", "landing_pages.view", true],
    ["Create Landing Page", "/admin/landing-pages/create", "landing_pages.create"],
    ["Templates", "/admin/landing-pages/templates", "landing_pages.templates"],
    ["Leads", "/admin/landing-pages/leads", "landing_pages.leads"],
    ["Events", "/admin/landing-pages/events", "landing_pages.analytics"],
    ["Media", "/admin/landing-pages/media", "landing_pages.view"],
    ["Tracking", "/admin/landing-pages/tracking", "landing_pages.tracking"],
    ["Settings", "/admin/landing-pages/settings", "landing_pages.tracking"],
];

/** "Landing Pages" entry with its submenu. Only items the user has permission for are shown. */
export default function LandingSidebarMenu({ collapsed }) {
    const { landing } = usePage().props;
    const can = landing?.can || [];
    const path = window.location.pathname;
    const inSection = path.startsWith("/admin/landing-pages");
    const [open, setOpen] = useState(inSection);

    if (!can.includes("landing_pages.view")) return null;

    const visible = ITEMS.filter(([, , perm]) => can.includes(perm));
    const hide = collapsed ? "opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0" : "";

    return (
        <div>
            <div className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${inSection ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white"}`}>
                <Link href="/admin/landing-pages" className="flex flex-1 items-center gap-3 px-3 py-2.5 min-w-0">
                    <span><PanelsTopLeft size={18} /></span>
                    <span className={`transition-all text-sm duration-300 whitespace-nowrap ${hide}`}>Landing Pages</span>
                </Link>
                {!collapsed && (
                    <button type="button" aria-label="Toggle landing pages menu" onClick={() => setOpen(!open)} className="px-2 py-2.5">
                        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                )}
            </div>

            {open && !collapsed && (
                <div className="mt-1 ml-4 pl-2 border-l border-slate-200 dark:border-slate-800 flex flex-col gap-0.5">
                    {visible.map(([label, href, , exact]) => {
                        const active = exact ? path === href : path.startsWith(href);
                        return (
                            <Link key={href} href={href} className={`px-2.5 py-1.5 rounded-md text-[12.5px] whitespace-nowrap ${active ? "font-semibold text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
                                {label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
