import React, { useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import toast from "react-hot-toast";
import AdminLayout from "../../../Layouts/AdminLayouts/AdminLayout";

const NAV = [
    ["All Landing Pages", "/admin/landing-pages", "landing_pages.view", (p) => p === "/admin/landing-pages"],
    ["Create Landing Page", "/admin/landing-pages/create", "landing_pages.create"],
    ["Templates", "/admin/landing-pages/templates", "landing_pages.templates"],
    ["Leads", "/admin/landing-pages/leads", "landing_pages.leads"],
    ["Events", "/admin/landing-pages/events", "landing_pages.analytics"],
    ["Analytics", "/admin/landing-pages/analytics", "landing_pages.analytics"],
    ["Media", "/admin/landing-pages/media", "landing_pages.view"],
    ["Tracking", "/admin/landing-pages/tracking", "landing_pages.tracking"],
    ["Settings", "/admin/landing-pages/settings", "landing_pages.tracking"],
];

/** Shared shell for every Landing Pages admin screen: admin layout + section navigation + flash toasts. */
export default function LandingLayout({ title, actions, children }) {
    const { landing, flash, errors } = usePage().props;
    const can = landing?.can || [];
    const path = window.location.pathname;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    return (
        <AdminLayout>
            <div className="max-w-[1400px] mx-auto font-poppins">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
                    <div className="flex items-center gap-2">{actions}</div>
                </div>

                <nav className="flex gap-1 overflow-x-auto mb-5 border-b border-slate-200 dark:border-slate-800">
                    {NAV.filter(([, , perm]) => can.includes(perm)).map(([label, href, , match]) => {
                        const active = match ? match(path) : path.startsWith(href);
                        return (
                            <Link key={href} href={href} className={`px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px ${active ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}>
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {errors && Object.keys(errors).length > 0 && (
                    <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                        {Object.values(errors).map((e, i) => <div key={i}>{e}</div>)}
                    </div>
                )}

                {children}
            </div>
        </AdminLayout>
    );
}

export const Card = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-sm ${className}`}>{children}</div>
);

export const btn = {
    primary: "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60",
    outline: "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-60",
    danger: "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-red-300 dark:border-red-900 text-red-600 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30",
    icon: "p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white",
};

export const field = "w-full h-9 px-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500";

const badgeColors = {
    published: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    live: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    archived: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    contacted: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    qualified: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    converted: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    lost: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    sent: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    skipped: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export const Badge = ({ value, children }) => (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${badgeColors[value] || badgeColors.draft}`}>{children ?? value}</span>
);

export const fmt = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-");

export function Pager({ paginator }) {
    if (!paginator?.links || paginator.links.length <= 3) return null;
    return (
        <div className="flex flex-wrap gap-1 justify-end p-3 border-t border-slate-200 dark:border-slate-800">
            {paginator.links.map((l, i) =>
                l.url ? (
                    <Link key={i} href={l.url} preserveScroll className={`px-3 h-8 inline-flex items-center rounded-md text-sm border ${l.active ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`} dangerouslySetInnerHTML={{ __html: l.label }} />
                ) : (
                    <span key={i} className="px-3 h-8 inline-flex items-center rounded-md text-sm text-slate-300 dark:text-slate-600" dangerouslySetInnerHTML={{ __html: l.label }} />
                )
            )}
        </div>
    );
}

export const Empty = ({ children }) => <div className="py-14 text-center text-sm text-slate-400">{children}</div>;
