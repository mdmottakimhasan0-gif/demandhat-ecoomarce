import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { Check, Minus } from "lucide-react";
import LandingLayout, { Badge, Card, Empty, Pager, field, fmt } from "@/components/AdminComponents/Landing/LandingLayout";

const Yes = ({ on }) => (on ? <Check size={16} className="text-green-600" /> : <Minus size={16} className="text-slate-300 dark:text-slate-600" />);

export default function Events({ configured = [], log, filters = {}, pages = [], events = [] }) {
    const [tab, setTab] = useState("configured");
    const go = (patch) => router.get("/admin/landing-pages/events", { ...filters, ...patch }, { preserveState: true, replace: true });
    const rows = log.data || [];

    return (
        <LandingLayout title="Event manager">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                These are <strong>internal</strong> events recorded by this website. They are not Meta Ads metrics - check Meta Events Manager for how Meta counted them.
            </p>
            <div className="flex gap-1 mb-4">
                {[["configured", "Configured events"], ["log", "Event log"]].map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)} className={`px-3.5 h-8 rounded-lg text-sm font-medium ${tab === k ? "bg-blue-600 text-white" : "border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}>{l}</button>
                ))}
            </div>

            {tab === "configured" ? (
                <Card className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                {["Event", "Trigger", "Landing page", "Element", "Pixel", "Browser", "Server (CAPI)", "Status"].map((h) => <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                            {configured.map((e, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{e.event}</td>
                                    <td className="px-4 py-2.5 text-slate-500">{e.trigger}</td>
                                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{e.page}</td>
                                    <td className="px-4 py-2.5 text-slate-500">{e.element}</td>
                                    <td className="px-4 py-2.5 text-slate-500 tabular-nums">{e.pixel || "-"}</td>
                                    <td className="px-4 py-2.5"><Yes on={e.browser} /></td>
                                    <td className="px-4 py-2.5"><Yes on={e.server} /></td>
                                    <td className="px-4 py-2.5"><Badge value={e.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!configured.length && <Empty>No landing pages yet.</Empty>}
                </Card>
            ) : (
                <Card>
                    <div className="flex flex-wrap gap-2 p-3 border-b border-slate-200 dark:border-slate-800">
                        <select className={`${field} w-48`} value={filters.page_id || ""} onChange={(e) => go({ page_id: e.target.value || undefined })}>
                            <option value="">All landing pages</option>
                            {pages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                        <select className={`${field} w-44`} value={filters.event || ""} onChange={(e) => go({ event: e.target.value || undefined })}>
                            <option value="">All events</option>
                            {events.map((e) => <option key={e}>{e}</option>)}
                        </select>
                        <select className={`${field} w-40`} value={filters.source || ""} onChange={(e) => go({ source: e.target.value || undefined })}>
                            <option value="">All sources</option>
                            {["pageload", "click", "form_submit"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                    {["Time", "Event", "Page", "Source", "Event ID", "Browser", "Server (CAPI)"].map((h) => <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                                {rows.map((e) => {
                                    const d = (ch) => e.deliveries.find((x) => x.channel === ch);
                                    const cell = (x) => (x ? <span title={x.error || (x.code ? `HTTP ${x.code}` : "")}><Badge value={x.status} />{x.code ? <span className="ml-1 text-[11px] text-slate-400">{x.code}</span> : null}</span> : <span className="text-slate-300">-</span>);
                                    return (
                                        <tr key={e.id}>
                                            <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{fmt(e.created_at)}</td>
                                            <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100">{e.event}</td>
                                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{e.page}</td>
                                            <td className="px-4 py-2.5 text-slate-500">{e.source}</td>
                                            <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">{e.event_id.slice(0, 13)}...</td>
                                            <td className="px-4 py-2.5">{cell(d("browser"))}</td>
                                            <td className="px-4 py-2.5">{cell(d("capi"))}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {!rows.length && <Empty>No events recorded yet. Visit a published landing page to generate a PageView.</Empty>}
                    </div>
                    <Pager paginator={log} />
                </Card>
            )}
        </LandingLayout>
    );
}
