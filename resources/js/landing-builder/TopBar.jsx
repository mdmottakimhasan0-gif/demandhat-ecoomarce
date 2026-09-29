import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, CircleAlert, ExternalLink, Eye, Loader2, Monitor, PanelLeft, Radar, Redo2, Ruler, Save, Settings2, ShoppingBag, Smartphone, Tablet, Undo2, Globe } from "lucide-react";

const DEVICES = [["desktop", Monitor, "Desktop"], ["tablet", Tablet, "Tablet"], ["mobile", Smartphone, "Mobile"]];

const IconBtn = ({ title, onClick, disabled, children, active }) => (
    <button type="button" title={title} onClick={onClick} disabled={disabled} className={`h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${active ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
        {children}
    </button>
);

function SaveStatus({ status, message }) {
    const map = {
        saved: ["Saved", "text-green-600 dark:text-green-400", <Check key="i" size={13} />],
        saving: ["Saving...", "text-slate-500", <Loader2 key="i" size={13} className="animate-spin" />],
        unsaved: ["Unsaved changes", "text-amber-600 dark:text-amber-400", <CircleAlert key="i" size={13} />],
        error: ["Save failed", "text-red-600 dark:text-red-400", <CircleAlert key="i" size={13} />],
    };
    const [label, cls, icon] = map[status] || map.saved;
    return (
        <span title={message || ""} className={`hidden lg:inline-flex items-center gap-1 text-xs font-medium ${cls}`}>
            {icon} {label}
        </span>
    );
}

export default function TopBar({ builder, device, setDevice, urls, can, onPreview, onSettings, leftOpen, toggleLeft, onSaveTemplate, onTracking, globalMeta, ruler, toggleRuler }) {
    const { page, status, statusMessage } = builder;
    const [menu, setMenu] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const ref = useRef(null);
    const canPublish = can.includes("landing_pages.publish");

    useEffect(() => {
        const away = (e) => !ref.current?.contains(e.target) && setMenu(false);
        window.addEventListener("mousedown", away);
        return () => window.removeEventListener("mousedown", away);
    }, []);

    const publish = async () => {
        setPublishing(true);
        await builder.publish();
        setPublishing(false);
    };

    const publishLabel = page.is_live ? (page.has_unpublished_changes || status !== "saved" ? "Publish changes" : "Published") : "Publish";

    return (
        <header className="h-12 shrink-0 flex items-center gap-2 px-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
            <IconBtn title="Toggle left panel" onClick={toggleLeft} active={leftOpen}><PanelLeft size={17} /></IconBtn>
            <a href={urls.back} className="h-8 px-2 inline-flex items-center gap-1 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={(e) => { if (status !== "saved" && !window.confirm("You have unsaved changes. Leave anyway?")) e.preventDefault(); }}>
                <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
            </a>

            <input value={page.title} onChange={(e) => builder.setPage((p) => ({ ...p, title: e.target.value }))} className="w-40 md:w-64 h-8 px-2 text-sm font-semibold bg-transparent rounded-md border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:outline-none" title="Landing page name" />
            <span className={`hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${page.is_live ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{page.is_live ? "LIVE" : String(page.status).toUpperCase()}</span>

            <div className="flex-1 flex justify-center">
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {DEVICES.map(([k, Icon, label]) => (
                        <button key={k} type="button" title={label} onClick={() => setDevice(k)} className={`h-7 w-9 inline-flex items-center justify-center rounded-md ${device === k ? "bg-white dark:bg-slate-700 shadow text-blue-600" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>
                            <Icon size={16} />
                        </button>
                    ))}
                </div>
            </div>

            <IconBtn title="Undo (Ctrl+Z)" onClick={builder.undo} disabled={!builder.canUndo}><Undo2 size={16} /></IconBtn>
            <IconBtn title="Redo (Ctrl+Shift+Z)" onClick={builder.redo} disabled={!builder.canRedo}><Redo2 size={16} /></IconBtn>
            <IconBtn title={ruler ? "Hide ruler" : "Show ruler (pixel measurements along the canvas edges)"} onClick={toggleRuler} active={ruler}><Ruler size={16} /></IconBtn>
            {can.includes("landing_pages.tracking") && (() => {
                const t = builder.tracking;
                // A landing set to the shared Pixel only counts as tracked if a shared Pixel actually exists.
                const px = t?.meta?.use_global ? (globalMeta?.pixel_id ? "global" : null) : t?.meta?.pixel_id;
                const on = !!t?.meta?.enabled && !!px;
                const tip = on ? `Facebook Pixel ${px === "global" ? "(global)" : px}${t?.capi?.enabled ? " + Conversions API" : ""}` : "Set this landing's Facebook Pixel and Conversions API";
                return (
                    <button type="button" onClick={onTracking} title={tip} className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Radar size={15} className={on ? "text-green-600" : "text-slate-400"} />
                        <span className="hidden lg:inline">{on ? (t?.capi?.enabled ? "Pixel + CAPI" : "Pixel") : "Tracking"}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${on ? "bg-green-500" : "bg-amber-400"}`} />
                    </button>
                );
            })()}
            <button
                type="button"
                onClick={onSettings}
                title={builder.doc?.settings?.product_id ? "Store product linked to this landing page" : "Link a store product to this landing page"}
                className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                <ShoppingBag size={15} className={builder.doc?.settings?.product_id ? "text-blue-600" : "text-slate-400"} />
                <span className="hidden xl:inline">{builder.doc?.settings?.product_id ? "Product" : "+ Product"}</span>
                {builder.doc?.settings?.product_id && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
            </button>
            <IconBtn title="Page settings" onClick={onSettings}><Settings2 size={17} /></IconBtn>
            <SaveStatus status={status} message={statusMessage} />

            <button type="button" onClick={onPreview} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                <Eye size={15} /> <span className="hidden md:inline">Preview</span>
            </button>
            <button type="button" onClick={builder.save} disabled={status === "saving"} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60">
                <Save size={15} /> <span className="hidden md:inline">Save Draft</span>
            </button>

            {canPublish && (
                <div className="relative flex" ref={ref}>
                    <button type="button" onClick={publish} disabled={publishing || (page.is_live && !page.has_unpublished_changes && status === "saved")} className="h-8 pl-3 pr-2.5 inline-flex items-center gap-1.5 rounded-l-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60">
                        {publishing ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />} {publishLabel}
                    </button>
                    <button type="button" onClick={() => setMenu(!menu)} className="h-8 w-7 inline-flex items-center justify-center rounded-r-md bg-blue-600 hover:bg-blue-700 text-white border-l border-blue-500">
                        <ChevronDown size={14} />
                    </button>
                    {menu && (
                        <div className="absolute right-0 top-9 z-50 w-52 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl text-[13px]">
                            {page.is_live && (
                                <a href={page.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 h-8 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"><ExternalLink size={14} /> View live page</a>
                            )}
                            <button disabled={!page.is_live} onClick={() => { setMenu(false); builder.unpublish(); }} className="w-full text-left flex items-center gap-2 px-3 h-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40">Unpublish</button>
                            {can.includes("landing_pages.templates") && (
                                <button onClick={() => { setMenu(false); onSaveTemplate(); }} className="w-full text-left flex items-center gap-2 px-3 h-8 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Save page as template</button>
                            )}
                            <a href={urls.analytics} className="flex items-center gap-2 px-3 h-8 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Analytics</a>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
