import React from "react";
import { router } from "@inertiajs/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import LandingLayout, { Card, Empty, field } from "@/components/AdminComponents/Landing/LandingLayout";

const Stat = ({ label, value, sub }) => (
    <Card className="p-4">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
        <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1 tabular-nums">{value}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </Card>
);

export default function Analytics({ data, filters = {}, pages = [], events = [] }) {
    const t = data.totals;
    const go = (patch) => router.get("/admin/landing-pages/analytics", Object.fromEntries(Object.entries({ ...filters, ...patch }).filter(([, v]) => v)), { preserveState: true, replace: true });
    const capi = data.deliveries?.capi || {};
    const chart = data.daily.map((d) => ({ ...d, label: d.date.slice(5) }));

    return (
        <LandingLayout title="Analytics">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                <strong>Internal events</strong> recorded by this website (page loads, clicks, form submissions). These are not Meta Ads metrics - compare with Meta Events Manager for delivery and attribution.
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
                <select className={`${field} w-56`} value={filters.page_id || ""} onChange={(e) => go({ page_id: e.target.value })}>
                    <option value="">All landing pages</option>
                    {pages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <select className={`${field} w-48`} value={filters.event || ""} onChange={(e) => go({ event: e.target.value })}>
                    <option value="">All events</option>
                    {events.map((e) => <option key={e}>{e}</option>)}
                </select>
                <input type="date" className={`${field} w-40`} value={filters.from || data.range.from} onChange={(e) => go({ from: e.target.value })} />
                <input type="date" className={`${field} w-40`} value={filters.to || data.range.to} onChange={(e) => go({ to: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
                <Stat label="Page views" value={t.page_views} />
                <Stat label="Unique visitors" value={t.unique_visitors} sub="cookie based, anonymous" />
                <Stat label="Leads" value={t.leads} />
                <Stat label="Conversion rate" value={`${t.conversion_rate}%`} sub="leads / unique visitors" />
                <Stat label="Button clicks" value={t.button_clicks} />
                <Stat label="Form submissions" value={t.form_submissions} />
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
                <Card className="p-4 lg:col-span-2">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Views and leads per day</div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chart} margin={{ left: -20, right: 8, top: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                <Tooltip />
                                <Area type="monotone" dataKey="views" name="Views" stroke="#2563eb" fill="#2563eb33" />
                                <Area type="monotone" dataKey="leads" name="Leads" stroke="#16a34a" fill="#16a34a33" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Event counts (internal)</div>
                    {data.event_counts.length ? (
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                                {data.event_counts.map((e) => (
                                    <tr key={e.event}><td className="py-2 text-slate-600 dark:text-slate-300">{e.event}</td><td className="py-2 text-right font-semibold tabular-nums text-slate-800 dark:text-slate-100">{e.total}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <Empty>No events in this range.</Empty>}
                </Card>

                <Card className="p-4 lg:col-span-2">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Top UTM sources</div>
                    {data.top_sources.length ? (
                        <table className="w-full text-sm">
                            <thead><tr className="text-left text-[11px] uppercase text-slate-400"><th className="pb-2">Source</th><th className="pb-2 text-right">Views</th><th className="pb-2 text-right">Leads</th></tr></thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                                {data.top_sources.map((s) => (
                                    <tr key={s.source}><td className="py-2 text-slate-700 dark:text-slate-200">{s.source}</td><td className="py-2 text-right tabular-nums">{s.views}</td><td className="py-2 text-right tabular-nums font-semibold">{s.leads}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <Empty>No UTM-tagged traffic yet. Add ?utm_source=facebook to your ad URLs.</Empty>}
                </Card>

                <Card className="p-4">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Server-side delivery (CAPI)</div>
                    {Object.keys(capi).length ? (
                        <div className="space-y-2 text-sm">
                            {["sent", "failed", "skipped"].map((s) => (
                                <div key={s} className="flex justify-between"><span className="capitalize text-slate-500">{s}</span><span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{capi[s] || 0}</span></div>
                            ))}
                            <p className="text-[11px] text-slate-400 pt-1">"Sent" means Meta accepted the request, not that it attributed the event.</p>
                        </div>
                    ) : <Empty>No server events yet.</Empty>}
                </Card>
            </div>
        </LandingLayout>
    );
}
