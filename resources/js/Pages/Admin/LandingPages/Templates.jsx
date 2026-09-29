import React, { useRef, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { Copy, Download, Eye, PencilLine, PencilRuler, Plus, Trash2, Upload, X } from "lucide-react";
import LandingLayout, { Card, Empty, btn, field } from "@/components/AdminComponents/Landing/LandingLayout";

function UseModal({ tpl, onClose }) {
    const [f, setF] = useState({ title: "", slug: "" });
    if (!tpl) return null;
    const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                    e.preventDefault();
                    router.post(`/admin/landing-pages/templates/${tpl.id}/use`, { title: f.title, slug: f.slug || slugify(f.title) });
                }}
                className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5 space-y-3"
            >
                <div className="flex items-center">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Create page from "{tpl.name}"</h3>
                    <button type="button" onClick={onClose} className="ml-auto text-slate-500"><X size={18} /></button>
                </div>
                <input autoFocus required className={field} placeholder="Page title" value={f.title} onChange={(e) => setF({ title: e.target.value, slug: slugify(e.target.value) })} />
                <input className={field} placeholder="slug" value={f.slug} onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })} />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className={btn.outline}>Cancel</button>
                    <button className={btn.primary}>Create page</button>
                </div>
            </form>
        </div>
    );
}

function EditModal({ tpl, categories, onClose }) {
    const [f, setF] = useState(tpl ? { name: tpl.name, description: tpl.description || "", category: tpl.category, is_public: tpl.is_public } : null);
    if (!tpl) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                    e.preventDefault();
                    router.put(`/admin/landing-pages/templates/${tpl.id}`, f, { onSuccess: onClose });
                }}
                className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5 space-y-3"
            >
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Edit template</h3>
                <input required className={field} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                <select className={field} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
                <textarea rows={3} className={`${field} h-auto py-2`} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input type="checkbox" className="accent-blue-600" checked={f.is_public} onChange={(e) => setF({ ...f, is_public: e.target.checked })} /> Available when creating pages
                </label>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className={btn.outline}>Cancel</button>
                    <button className={btn.primary}>Save</button>
                </div>
            </form>
        </div>
    );
}

const tints = ["from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-orange-500 to-rose-600", "from-fuchsia-500 to-purple-600", "from-slate-600 to-slate-800", "from-sky-500 to-cyan-600"];

export default function Templates({ templates = [], categories = [], filters = {} }) {
    const [use, setUse] = useState(null);
    const [edit, setEdit] = useState(null);
    const fileRef = useRef(null);
    const { landing } = usePage().props;
    const canCreate = (landing?.can || []).includes("landing_pages.create");

    const importFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        router.post("/admin/landing-pages/templates/import", { file }, { forceFormData: true });
        e.target.value = "";
    };

    return (
        <LandingLayout
            title="Templates"
            actions={
                <>
                    <select className={`${field} w-48`} value={filters.category || ""} onChange={(e) => router.get("/admin/landing-pages/templates", e.target.value ? { category: e.target.value } : {})}>
                        <option value="">All categories</option>
                        {categories.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    {canCreate && (
                        <>
                            <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={importFile} />
                            <button className={btn.outline} title="Import a template exported from another server" onClick={() => fileRef.current.click()}>
                                <Upload size={15} /> Import
                            </button>
                        </>
                    )}
                </>
            }
        >
            {templates.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {templates.map((t, i) => (
                        <Card key={t.id} className="overflow-hidden flex flex-col">
                            <div className={`h-28 bg-gradient-to-br ${tints[i % tints.length]} relative`} style={t.thumbnail ? { backgroundImage: `url(${t.thumbnail})`, backgroundSize: "cover" } : {}}>
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/30 text-white text-[10px] font-semibold">{t.category}</span>
                                {!t.is_public && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 text-white text-[10px]">Hidden</span>}
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="font-semibold text-slate-800 dark:text-slate-100">{t.name}</div>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 flex-1">{t.description || "No description"}</p>
                                <div className="flex items-center gap-1.5 mt-3">
                                    <Link href={`/admin/landing-pages/templates/${t.id}/edit`} title="Edit design (sections & content)" className={`${btn.primary} h-8 px-3 flex-1 justify-center`}><PencilRuler size={14} /> Edit design</Link>
                                    {canCreate && <button title="Create a page from this template" className={btn.icon} onClick={() => setUse(t)}><Plus size={15} /></button>}
                                </div>
                                <div className="flex items-center gap-1 mt-1.5">
                                    <a href={t.preview_url} target="_blank" rel="noreferrer" title="Preview" className={btn.icon}><Eye size={15} /></a>
                                    <button title="Rename / category / visibility" className={btn.icon} onClick={() => setEdit(t)}><PencilLine size={15} /></button>
                                    <button title="Duplicate" className={btn.icon} onClick={() => router.post(`/admin/landing-pages/templates/${t.id}/duplicate`, {}, { preserveScroll: true })}><Copy size={15} /></button>
                                    <a href={`/admin/landing-pages/templates/${t.id}/export`} title="Export as JSON (move to another server)" className={btn.icon}><Download size={15} /></a>
                                    <button title="Delete" className={`${btn.icon} hover:text-red-600 ml-auto`} onClick={() => confirm(`Delete template "${t.name}"?`) && router.delete(`/admin/landing-pages/templates/${t.id}`, { preserveScroll: true })}><Trash2 size={15} /></button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <Empty>
                        No templates yet. Save any page as a template from the builder, or run <code>php artisan db:seed --class=LandingPageTemplatesSeeder</code>.
                    </Empty>
                </Card>
            )}
            <UseModal tpl={use} onClose={() => setUse(null)} />
            <EditModal key={edit?.id} tpl={edit} categories={categories} onClose={() => setEdit(null)} />
        </LandingLayout>
    );
}
