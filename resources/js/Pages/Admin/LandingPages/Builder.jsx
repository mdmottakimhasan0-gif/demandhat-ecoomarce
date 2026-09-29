import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import toast, { Toaster } from "react-hot-toast";
import { Copy, ClipboardPaste, Layers, ListTree, Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { useBuilder } from "@/landing-builder/useBuilder";
import { api, errorInfo } from "@/landing-builder/api";
import { find } from "@/landing-builder/tree";
import TopBar from "@/landing-builder/TopBar";
import ElementsPanel from "@/landing-builder/ElementsPanel";
import Navigator from "@/landing-builder/Navigator";
import Inspector from "@/landing-builder/Inspector";
import Canvas from "@/landing-builder/Canvas";
import ContextMenu from "@/landing-builder/ContextMenu";
import MediaPicker from "@/landing-builder/MediaPicker";
import PageSettings from "@/landing-builder/PageSettings";
import { inputCls } from "@/landing-builder/controls";

function SaveTemplateModal({ open, onClose, categories, onSave }) {
    const [f, setF] = useState({ name: "", category: "Custom", description: "" });
    const [busy, setBusy] = useState(false);
    if (!open) return null;
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        await onSave(f);
        setBusy(false);
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5 space-y-3">
                <div className="flex items-center">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Save as template</h3>
                    <button type="button" onClick={onClose} className="ml-auto p-1 text-slate-500"><X size={18} /></button>
                </div>
                <div>
                    <label className="text-[13px] font-medium text-slate-700 dark:text-slate-200">Name</label>
                    <input autoFocus required className={`${inputCls} mt-1`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                </div>
                <div>
                    <label className="text-[13px] font-medium text-slate-700 dark:text-slate-200">Category</label>
                    <select className={`${inputCls} mt-1`} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                        {categories.map((c) => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[13px] font-medium text-slate-700 dark:text-slate-200">Description</label>
                    <textarea rows={2} className={`${inputCls} mt-1 h-auto py-1.5`} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200">Cancel</button>
                    <button disabled={busy} className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60">
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save template
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function Builder({ page, content, settings, seo, tracking, schema, urls, can, config, globalMeta }) {
    const builder = useBuilder({ schema, initial: { page, content, settings, seo, tracking }, urls, config });
    const [device, setDevice] = useState("desktop");
    const [ruler, setRuler] = useState(false);
    const [leftOpen, setLeftOpen] = useState(true);
    const [leftTab, setLeftTab] = useState("elements");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState("general");
    const openSettings = (tab = "general") => { setSettingsTab(tab); setSettingsOpen(true); };
    const [media, setMedia] = useState(null);
    const [menu, setMenu] = useState(null);
    const [tpl, setTpl] = useState(null); // { node|null }

    // Follow the admin theme (same localStorage key the admin layout uses).
    useEffect(() => {
        let theme = null;
        try { theme = localStorage.getItem("theme"); } catch { /* ignore */ }
        const dark = theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.classList.toggle("dark", dark);
    }, []);

    const ctx = useMemo(
        () => ({ schema, device, fonts: config.fonts, productSearchUrl: urls.productSearch, setContent: builder.setContent, setSetting: builder.setSetting, openMedia: (cb) => setMedia({ cb }) }),
        [schema, device, config.fonts, urls.productSearch, builder.setContent, builder.setSetting]
    );

    // ---- keyboard shortcuts (works from the canvas iframe too) -------------------------
    const handleKey = useCallback((k) => {
        const key = k.key;
        if (k.ctrl && key === "z" && !k.shift) builder.undo();
        else if (k.ctrl && (key === "y" || (key === "z" && k.shift))) builder.redo();
        else if (k.ctrl && key === "s") builder.save();
        else if (k.ctrl && key === "c" && builder.selectedId) builder.copy(builder.selectedId);
        else if (k.ctrl && key === "v") builder.paste();
        else if (k.ctrl && key === "d" && builder.selectedId) builder.duplicate(builder.selectedId);
        else if ((key === "delete" || key === "backspace") && builder.selectedId) builder.remove(builder.selectedId);
        else if (key === "escape") builder.select(null);
    }, [builder]);

    useEffect(() => {
        const onKey = (e) => {
            const t = e.target;
            const typing = t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName);
            const mod = e.ctrlKey || e.metaKey;
            const key = e.key.toLowerCase();
            if (typing && !(mod && key === "s")) return; // let native undo/copy work inside fields
            if (mod && ["z", "y", "c", "v", "d", "s"].includes(key)) e.preventDefault();
            else if (!(key === "delete" || key === "backspace" || key === "escape")) return;
            if ((key === "delete" || key === "backspace") && typing) return;
            handleKey({ key, ctrl: mod, shift: e.shiftKey });
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [handleKey]);

    // ---- preview: real frontend at a signed, expiring URL ------------------------------
    const preview = async () => {
        const win = window.open("", "_blank"); // open synchronously to avoid popup blockers
        const saved = await builder.persist("autosave");
        if (!saved.ok) {
            win?.close();
            return toast.error(saved.info.message);
        }
        try {
            const res = await api.post(urls.previewLink);
            if (win) win.location = res.url;
            else window.location = res.url;
        } catch (e) {
            win?.close();
            toast.error(errorInfo(e).message);
        }
    };

    const saveTemplate = async (form) => {
        const saved = await builder.persist("autosave");
        if (!saved.ok) return toast.error(saved.info.message);
        try {
            const res = await api.post(urls.saveTemplate, { ...form, landing_page_id: page.id, ...(tpl?.node ? { element: tpl.node } : {}) });
            toast.success(res.message);
            setTpl(null);
        } catch (e) {
            toast.error(errorInfo(e).message);
        }
    };

    const openContext = useCallback((id, x, y) => setMenu({ id, x, y }), []);

    const menuItems = useMemo(() => {
        if (!menu) return [];
        const node = find(builder.sections, menu.id)?.node;
        if (!node) return [];
        const items = [
            { label: "Edit", icon: <Pencil size={14} />, run: () => builder.select(node.id) },
            { label: "Duplicate", icon: <Copy size={14} />, shortcut: "Ctrl+D", run: () => builder.duplicate(node.id) },
            { label: "Copy", icon: <Copy size={14} />, shortcut: "Ctrl+C", run: () => builder.copy(node.id) },
            { label: "Paste", icon: <ClipboardPaste size={14} />, shortcut: "Ctrl+V", disabled: !builder.clipboard, run: () => { builder.select(node.id); setTimeout(builder.paste, 0); } },
        ];
        if (can.includes("landing_pages.templates")) items.push({ label: "Save as template", icon: <Save size={14} />, run: () => setTpl({ node }) });
        items.push({ label: "Navigator", icon: <ListTree size={14} />, run: () => { setLeftOpen(true); setLeftTab("navigator"); builder.select(node.id); } });
        items.push("-", { label: "Delete", icon: <Trash2 size={14} />, danger: true, shortcut: "Del", run: () => builder.remove(node.id) });

        return items;
    }, [menu, builder.sections, builder.clipboard, builder.paste, can]);

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden">
            <Head title={`Builder - ${builder.page.title}`} />
            <Toaster position="top-center" />

            <TopBar
                builder={builder} device={device} setDevice={setDevice} urls={urls} can={can}
                onPreview={preview} onSettings={() => openSettings()} onTracking={() => openSettings("tracking")} globalMeta={globalMeta}
                leftOpen={leftOpen} toggleLeft={() => setLeftOpen(!leftOpen)}
                onSaveTemplate={() => setTpl({ node: null })}
                ruler={ruler} toggleRuler={() => setRuler(!ruler)}
            />

            <div className="flex-1 flex min-h-0">
                {leftOpen && (
                    <aside className="w-[290px] shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-0">
                        <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
                            {[["elements", "Elements", Layers], ["navigator", "Navigator", ListTree]].map(([k, label, Icon]) => (
                                <button key={k} onClick={() => setLeftTab(k)} className={`flex-1 h-10 inline-flex items-center justify-center gap-1.5 text-[13px] font-medium border-b-2 ${leftTab === k ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>
                                    <Icon size={15} /> {label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 min-h-0">
                            {leftTab === "elements" ? <ElementsPanel schema={schema} onAdd={(t) => builder.add(t)} /> : <Navigator schema={schema} builder={builder} />}
                        </div>
                    </aside>
                )}

                <main className="flex-1 min-w-0 min-h-0">
                    <Canvas builder={builder} schema={schema} urls={urls} device={device} ruler={ruler} onContext={openContext} onKey={handleKey} />
                </main>

                <aside className="w-[320px] shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-0">
                    <Inspector schema={schema} builder={builder} ctx={ctx} />
                </aside>
            </div>

            <ContextMenu menu={menu} onClose={() => setMenu(null)} items={menuItems} />
            <MediaPicker open={!!media} onClose={() => setMedia(null)} onSelect={(m) => media?.cb(m)} listUrl={urls.mediaList} uploadUrl={urls.mediaUpload} />
            <PageSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} builder={builder} urls={urls} can={can} config={config} globalMeta={globalMeta} ctx={ctx} exportUrl={urls.export} initialTab={settingsTab} />
            <SaveTemplateModal open={!!tpl} onClose={() => setTpl(null)} categories={config.templateCategories} onSave={saveTemplate} />
        </div>
    );
}
