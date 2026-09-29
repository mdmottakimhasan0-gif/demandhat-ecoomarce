import React, { useEffect, useRef, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { Download, Search } from "lucide-react";
import LandingLayout, { Badge, Card, Empty, Pager, btn, field, fmt } from "@/components/AdminComponents/Landing/LandingLayout";

export default function Leads({ leads, filters = {}, pages = [], statuses = [], sources = [] }) {
    const [f, setF] = useState({ search: "", status: "", landing_page_id: "", source: "", from: "", to: "", ...filters });
    const first = useRef(true);
    const clean = () => Object.fromEntries(Object.entries(f).filter(([, v]) => v));

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => router.get("/admin/landing-pages/leads", clean(), { preserveState: true, replace: true }), 350);
        return () => clearTimeout(t);
    }, [f.search, f.status, f.landing_page_id, f.source, f.from, f.to]);

    const rows = leads.data || [];
    const qs = new URLSearchParams(clean()).toString();

    return (
        <LandingLayout
            title="Leads"
            actions={
                <a href={`/admin/landing-pages/leads/export${qs ? `?${qs}` : ""}`} className={btn.outline}>
                    <Download size={15} /> Export CSV
                </a>
            }
        >
            <Card>
                <div className="flex flex-wrap gap-2 p-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className={`${field} pl-9`} placeholder="Search name, email or phone" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
                    </div>
                    <select className={`${field} w-44`} value={f.landing_page_id} onChange={(e) => setF({ ...f, landing_page_id: e.target.value })}>
                        <option value="">All landing pages</option>
                        {pages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    <select className={`${field} w-36`} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                        <option value="">All statuses</option>
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className={`${field} w-36`} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>
                        <option value="">All sources</option>
                        {sources.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <input type="date" className={`${field} w-38`} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} title="From" />
                    <input type="date" className={`${field} w-38`} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} title="To" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                {["Date", "Name", "Email", "Phone", "Landing page", "Source", "Campaign", "Status"].map((h) => <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                            {rows.map((l) => (
                                <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 cursor-pointer" onClick={() => router.get(`/admin/landing-pages/leads/${l.id}`)}>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(l.created_at)}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{l.name || "-"}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{l.email || "-"}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{l.phone || "-"}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{l.landing_page?.title || "-"}</td>
                                    <td className="px-4 py-3 text-slate-500">{l.source || "-"}</td>
                                    <td className="px-4 py-3 text-slate-500">{l.utm_campaign || "-"}</td>
                                    <td className="px-4 py-3"><Badge value={l.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!rows.length && <Empty>No leads match these filters.</Empty>}
                </div>
                <Pager paginator={leads} />
            </Card>
        </LandingLayout>
    );
}
