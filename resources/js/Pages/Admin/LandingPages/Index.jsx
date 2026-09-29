import React, { useEffect, useRef, useState } from "react";
import { Link, router } from "@inertiajs/react";
import toast from "react-hot-toast";
import { BarChart3, Copy, ExternalLink, Eye, EyeOff, Globe, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import LandingLayout, { Badge, Card, Empty, Pager, btn, field, fmt } from "@/components/AdminComponents/Landing/LandingLayout";
import { api, errorInfo } from "@/landing-builder/api";

export default function Index({ pages, filters = {}, can = [] }) {
    const [f, setF] = useState({ search: filters.search || "", status: filters.status || "", from: filters.from || "", to: filters.to || "" });
    const first = useRef(true);
    const fileRef = useRef(null);

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(
            () => router.get("/admin/landing-pages", Object.fromEntries(Object.entries(f).filter(([, v]) => v)), { preserveState: true, replace: true }),
            350
        );
        return () => clearTimeout(t);
    }, [f.search, f.status, f.from, f.to]);

    const act = async (p, action) => {
        try {
            const res = await api.post(`/admin/landing-pages/${p.id}/${action}`);
            toast.success(res.message || "Done");
            router.reload({ only: ["pages"], preserveScroll: true });
        } catch (e) {
            const info = errorInfo(e);
            toast.error(info.errors?.publish?.[0] || info.message);
        }
    };

    const preview = async (p) => {
        const win = window.open("", "_blank");
        try {
            const res = await api.post(`/admin/landing-pages/${p.id}/preview-link`);
            win.location = res.url;
        } catch (e) {
            win?.close();
            toast.error(errorInfo(e).message);
        }
    };

    const importFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        router.post("/admin/landing-pages/import", { file }, { forceFormData: true });
        e.target.value = "";
    };

    const rows = pages.data || [];

    return (
        <LandingLayout
            title="Landing Pages"
            actions={
                can.includes("landing_pages.create") && (
                    <>
                        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={importFile} />
                        <button className={btn.outline} onClick={() => fileRef.current.click()}>
                            <Upload size={15} /> Import
                        </button>
                        <Link href="/admin/landing-pages/create" className={btn.primary}>
                            <Plus size={15} /> New landing page
                        </Link>
                    </>
                )
            }
        >
            <Card>
                <div className="flex flex-wrap gap-2 p-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className={`${field} pl-9`} placeholder="Search title or slug" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
                    </div>
                    <select className={`${field} w-40`} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                        <option value="">All statuses</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                    <input type="date" className={`${field} w-40`} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} title="Updated from" />
                    <input type="date" className={`${field} w-40`} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} title="Updated to" />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                {["Title", "URL", "Status", "Views", "Leads", "Updated", "Published", "Actions"].map((h) => (
                                    <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                            {rows.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50">
                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                                        <Link href={p.builder_url} className="hover:text-blue-600">{p.title}</Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.is_live ? (
                                            <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                                                /{p.slug} <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">/{p.slug}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3"><Badge value={p.status} /></td>
                                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{p.views}</td>
                                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{p.leads}</td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(p.updated_at)}</td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmt(p.published_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-0.5">
                                            {can.includes("landing_pages.edit") && <Link href={p.builder_url} title="Edit" className={btn.icon}><Pencil size={15} /></Link>}
                                            <button title="Preview" className={btn.icon} onClick={() => preview(p)}><Eye size={15} /></button>
                                            {can.includes("landing_pages.create") && (
                                                <button title="Duplicate" className={btn.icon} onClick={() => router.post(`/admin/landing-pages/${p.id}/duplicate`)}><Copy size={15} /></button>
                                            )}
                                            {can.includes("landing_pages.publish") &&
                                                (p.is_live ? (
                                                    <button title="Unpublish" className={btn.icon} onClick={() => act(p, "unpublish")}><EyeOff size={15} /></button>
                                                ) : (
                                                    <button title="Publish" className={`${btn.icon} hover:text-green-600`} onClick={() => act(p, "publish")}><Globe size={15} /></button>
                                                ))}
                                            {can.includes("landing_pages.analytics") && (
                                                <Link href={`/admin/landing-pages/analytics?page_id=${p.id}`} title="Analytics" className={btn.icon}><BarChart3 size={15} /></Link>
                                            )}
                                            {can.includes("landing_pages.delete") && (
                                                <button title="Delete" className={`${btn.icon} hover:text-red-600`} onClick={() => confirm(`Delete "${p.title}"? Its URL will stop working immediately.`) && router.delete(`/admin/landing-pages/${p.id}`)}>
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!rows.length && (
                        <Empty>
                            No landing pages yet. <Link href="/admin/landing-pages/create" className="text-blue-600 hover:underline">Create your first one</Link>.
                        </Empty>
                    )}
                </div>
                <Pager paginator={pages} />
            </Card>
        </LandingLayout>
    );
}
