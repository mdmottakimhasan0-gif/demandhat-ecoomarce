import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, Download, History, Loader2, RotateCcw, Trash2, X } from "lucide-react";
import { api, errorInfo } from "./api";
import { ControlInput, inputCls } from "./controls";

const TABS = [["general", "General"], ["seo", "SEO"], ["tracking", "Tracking"], ["versions", "Versions"]];

function Row({ label, help, children, inline }) {
    return (
        <div className={inline ? "flex items-center justify-between gap-4" : ""}>
            <div className={inline ? "" : "mb-1"}>
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{label}</label>
                {help && <p className="text-[11px] text-slate-400 leading-snug">{help}</p>}
            </div>
            {children}
        </div>
    );
}

const Switch = ({ value, onChange }) => <ControlInput ctl={{ type: "switch" }} value={value} onChange={onChange} />;
const Text = ({ value, onChange, ...p }) => <input className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...p} />;
const Area = ({ value, onChange, rows = 3, mono }) => <textarea rows={rows} spellCheck={!mono} className={`${inputCls} h-auto py-1.5 resize-y ${mono ? "font-mono text-[12px]" : ""}`} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
const Section = ({ title, children }) => (
    <div className="space-y-3 pb-5 mb-5 border-b border-slate-200 dark:border-slate-800 last:border-0 last:mb-0 last:pb-0">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h4>
        {children}
    </div>
);

function General({ builder, can, ctx }) {
    const s = builder.doc.settings;
    const set = builder.setPageSetting;
    const p = builder.page;
    return (
        <div>
            <Section title="Page">
                <Row label="Title"><Text value={p.title} onChange={(v) => builder.setPage((x) => ({ ...x, title: v }))} /></Row>
                {p.slug !== null && (
                    <Row label="Slug (URL)" help={`Public URL: ${window.location.origin}/${p.slug}`}>
                        <Text value={p.slug} onChange={(v) => builder.setPage((x) => ({ ...x, slug: v.toLowerCase().replace(/[^a-z0-9-]+/g, "-") }))} />
                    </Row>
                )}
            </Section>
            <Section title="Featured Product (মূল পণ্য)">
                <Row label="Select Product" help="Select a product from your store. Its uploaded photo, title, price, and stock will automatically appear in order forms on this page, and orders will be submitted for this product.">
                    <ControlInput ctl={{ type: "product" }} value={s.product_id} onChange={(v) => set("product_id", v)} ctx={ctx} />
                </Row>
            </Section>
            <Section title="Layout">
                <Row label="Header / footer" help="Landing pages can run without the website navigation.">
                    <select className={inputCls} value={s.layout || "blank"} onChange={(e) => set("layout", e.target.value)}>
                        <option value="blank">Blank landing layout (no header/footer)</option>
                        <option value="website">Default website header &amp; footer</option>
                        <option value="custom">Custom landing header &amp; footer</option>
                    </select>
                </Row>
                {s.layout === "custom" && (
                    <>
                        <Row label="Custom header HTML"><Area value={s.header_html} onChange={(v) => set("header_html", v)} mono /></Row>
                        <Row label="Custom footer HTML"><Area value={s.footer_html} onChange={(v) => set("footer_html", v)} mono /></Row>
                    </>
                )}
                <Row label="Full-width mode" inline><Switch value={!!s.full_width} onChange={(v) => set("full_width", v)} /></Row>
                <Row label="Container width (px)" help="0 = use the global setting."><input type="number" className={inputCls} min={0} max={2400} value={s.container_width || 0} onChange={(e) => set("container_width", Number(e.target.value))} /></Row>
            </Section>
            <Section title="Appearance">
                <div className="grid grid-cols-2 gap-3">
                    <Row label="Page background"><ControlInput ctl={{ type: "color" }} value={s.background_color} onChange={(v) => set("background_color", v)} /></Row>
                    <Row label="Default text color"><ControlInput ctl={{ type: "color" }} value={s.text_color} onChange={(v) => set("text_color", v)} /></Row>
                </div>
                <Row label="Default font">
                    <select className={inputCls} value={s.font_family || ""} onChange={(e) => set("font_family", e.target.value)}>
                        <option value="">Global default</option>
                        {ctx.fonts.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                </Row>
                <Row label="Custom body class"><Text value={s.body_class} onChange={(v) => set("body_class", v)} /></Row>
                <Row label="Favicon URL"><Text value={s.favicon} onChange={(v) => set("favicon", v)} placeholder="https://..." /></Row>
            </Section>
            <Section title="Custom code">
                <Row label="Custom CSS" help='Applies to the whole page. Use "body.lp-body" or your own selectors.'><Area value={s.custom_css} onChange={(v) => set("custom_css", v)} rows={5} mono /></Row>
                {can.includes("landing_pages.tracking") ? (
                    <Row label="Custom JavaScript" help="Runs at the end of the page. Admin only."><Area value={s.custom_js} onChange={(v) => set("custom_js", v)} rows={5} mono /></Row>
                ) : (
                    <p className="text-xs text-slate-400">Custom JavaScript can only be edited by users with tracking permission.</p>
                )}
            </Section>
        </div>
    );
}

function Seo({ builder, ctx }) {
    const seo = builder.doc.seo;
    const set = builder.setSeo;
    const len = (v, n) => <span className={`text-[11px] ${(v || "").length > n ? "text-amber-600" : "text-slate-400"}`}>{(v || "").length}/{n}</span>;
    return (
        <div>
            <Section title="Search">
                <Row label={<>SEO title {len(seo.title, 60)}</>}><Text value={seo.title} onChange={(v) => set("title", v)} placeholder={builder.page.title} /></Row>
                <Row label={<>Meta description {len(seo.description, 160)}</>}><Area value={seo.description} onChange={(v) => set("description", v)} /></Row>
                <Row label="Canonical URL" help="Leave empty to use the page URL."><Text value={seo.canonical} onChange={(v) => set("canonical", v)} placeholder="https://" /></Row>
                <Row label="Robots">
                    <select className={inputCls} value={seo.robots || "index,follow"} onChange={(e) => set("robots", e.target.value)}>
                        <option value="index,follow">index, follow</option>
                        <option value="noindex,follow">noindex, follow</option>
                        <option value="index,nofollow">index, nofollow</option>
                        <option value="noindex,nofollow">noindex, nofollow</option>
                    </select>
                </Row>
            </Section>
            <Section title="Open Graph (Facebook, LinkedIn)">
                <Row label="OG title"><Text value={seo.og_title} onChange={(v) => set("og_title", v)} /></Row>
                <Row label="OG description"><Area value={seo.og_description} onChange={(v) => set("og_description", v)} rows={2} /></Row>
                <Row label="OG image"><ControlInput ctl={{ type: "image" }} value={seo.og_image} onChange={(v) => set("og_image", v)} ctx={ctx} /></Row>
            </Section>
            <Section title="Twitter / X card">
                <Row label="Twitter title"><Text value={seo.twitter_title} onChange={(v) => set("twitter_title", v)} /></Row>
                <Row label="Twitter description"><Area value={seo.twitter_description} onChange={(v) => set("twitter_description", v)} rows={2} /></Row>
                <Row label="Twitter image"><ControlInput ctl={{ type: "image" }} value={seo.twitter_image} onChange={(v) => set("twitter_image", v)} ctx={ctx} /></Row>
            </Section>
            <p className="text-xs text-slate-400">Draft and preview pages are always served as noindex.</p>
        </div>
    );
}

function Tracking({ builder, urls, can, config, globalMeta }) {
    const [t, setT] = useState(() => {
        const c = JSON.parse(JSON.stringify(builder.tracking));
        if (c.meta.use_global && !globalMeta.pixel_id) {
            c.meta.use_global = false;
            c.capi.use_global = false;
        }
        return c;
    });
    const [token, setToken] = useState("");
    const [clearToken, setClearToken] = useState(false);
    const [saving, setSaving] = useState(false);
    const canScripts = can.includes("landing_pages.tracking");
    const upd = (path, v) =>
        setT((cur) => {
            const next = JSON.parse(JSON.stringify(cur));
            let o = next;
            path.slice(0, -1).forEach((k) => (o = o[k] ||= {}));
            o[path[path.length - 1]] = v;
            return next;
        });

    // "Use global" is one switch for both Pixel and CAPI so a landing is never half-global.
    const useGlobal = !!t.meta.use_global;
    const setUseGlobal = (v) => setT((c) => ({ ...c, meta: { ...c.meta, use_global: v }, capi: { ...c.capi, use_global: v } }));
    const tokenSaved = t.has_capi_token && !clearToken;

    const problems = [];
    if (!useGlobal && t.meta.enabled && !t.meta.pixel_id) problems.push("Enter this landing's Pixel ID to start tracking.");
    if (!useGlobal && t.capi.enabled && !t.meta.pixel_id) problems.push("Conversions API needs the Pixel ID above.");
    if (!useGlobal && t.capi.enabled && !tokenSaved && !token) problems.push("Conversions API needs an access token.");

    const save = async () => {
        setSaving(true);
        try {
            // CAPI always uses this landing's own Pixel ID (no separate dataset id to keep in sync).
            const res = await api.put(urls.tracking, {
                tracking: { meta: t.meta, capi: { ...t.capi, pixel_id: "" }, utm: t.utm, scripts: t.scripts },
                capi_access_token: token || null,
                clear_capi_token: clearToken,
            });
            builder.setTracking(res.tracking);
            builder.setPage((p) => ({ ...p, ...res.page, title: p.title, slug: p.slug })); // tracking edits count as unpublished changes
            setT(JSON.parse(JSON.stringify(res.tracking)));
            setToken("");
            setClearToken(false);
            toast.success("Tracking saved. Publish the landing to make it live.");
        } catch (e) {
            toast.error(errorInfo(e).message);
        } finally {
            setSaving(false);
        }
    };

    const events = config.metaEvents.filter((ev) => ev !== "CustomEvent");

    return (
        <div>
            <p className="mb-4 text-xs rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 px-3 py-2">
                These settings belong to <strong>this landing only</strong>. They are saved on the draft and go live the next time you <strong>publish</strong>.
            </p>

            <Section title="Facebook Pixel (browser)">
                <Row label="Track this landing with a Pixel" inline><Switch value={t.meta.enabled} onChange={(v) => upd(["meta", "enabled"], v)} /></Row>
                <Row label="Pixel ID" help={useGlobal ? "This landing currently uses the shared Pixel. Typing an ID here gives it its own Pixel." : "Events Manager > Data sources > your Pixel > Settings."}>
                    <Text
                        value={t.meta.pixel_id}
                        onChange={(v) => setT((c) => ({ ...c, meta: { ...c.meta, pixel_id: v.replace(/\D/g, ""), enabled: true, use_global: false }, capi: { ...c.capi, use_global: false } }))}
                        placeholder="123456789012345"
                    />
                </Row>
            </Section>

            <Section title="Conversions API (server)">
                <Row label="Also send events from the server" inline><Switch value={t.capi.enabled} onChange={(v) => { upd(["capi", "enabled"], v); if (v && useGlobal && !globalMeta.capi_enabled) setUseGlobal(false); }} /></Row>
                {t.capi.enabled && (
                    <>
                        <Row label="Access token" help={tokenSaved ? "A token is saved for this landing (encrypted). Type a new one to replace it." : "Generate it in Events Manager > Settings > Conversions API. Stored encrypted; never sent to the browser."}>
                            <div className="flex gap-2">
                                <input type="password" autoComplete="new-password" className={inputCls} value={token} placeholder={tokenSaved ? "••••••••••••••" : "EAAB..."} onChange={(e) => { setToken(e.target.value); setClearToken(false); if (useGlobal) setUseGlobal(false); }} />
                                {t.has_capi_token && (
                                    <button type="button" className="h-8 px-2.5 text-xs rounded-md border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 whitespace-nowrap" onClick={() => { setClearToken(!clearToken); setToken(""); }}>
                                        {clearToken ? "Will remove" : "Remove"}
                                    </button>
                                )}
                            </div>
                        </Row>
                        <Row label="Test event code" help="Optional. Events Manager > Test events. Remove it before going live.">
                            <Text value={t.capi.test_event_code} onChange={(v) => upd(["capi", "test_event_code"], v)} placeholder="TEST12345" />
                        </Row>
                        <details className="text-xs text-slate-500">
                            <summary className="cursor-pointer">Advanced</summary>
                            <div className="mt-2">
                                <Row label="Graph API version"><Text value={t.capi.api_version} onChange={(v) => upd(["capi", "api_version"], v)} placeholder={config.metaApiVersion} /></Row>
                            </div>
                        </details>
                    </>
                )}
            </Section>

            {(t.meta.enabled || t.capi.enabled) && (
                <Section title="Events to send">
                    <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden text-[13px]">
                        <div className="grid grid-cols-[1fr_70px_70px] px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            <span>Event</span><span className="text-center">Browser</span><span className="text-center">Server</span>
                        </div>
                        {events.map((ev) => (
                            <div key={ev} className="grid grid-cols-[1fr_70px_70px] items-center px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                                <span>{ev}</span>
                                <input type="checkbox" className="accent-blue-600 justify-self-center" disabled={!t.meta.enabled} checked={!!t.meta.events?.[ev]} onChange={(e) => upd(["meta", "events", ev], e.target.checked)} />
                                <input type="checkbox" className="accent-blue-600 justify-self-center" disabled={!t.capi.enabled} checked={!!t.capi.events?.[ev]} onChange={(e) => upd(["capi", "events", ev], e.target.checked)} />
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-slate-400">Buttons, forms and the Order Form choose which of these they send in their own <em>Tracking</em> section. Browser and server copies share one event ID so Meta counts each event once.</p>
                </Section>
            )}

            <Section title="Global settings">
                <Row label="Use the shared (global) Pixel & Conversions API instead" help={globalMeta.pixel_id ? `Global Pixel ID: ${globalMeta.pixel_id}${globalMeta.capi_enabled ? " - global CAPI is on" : " - global CAPI is off"}` : "No global Pixel is set (Landing Pages > Tracking)."} inline>
                    <Switch value={useGlobal} onChange={setUseGlobal} />
                </Row>
                <Row label="Capture UTM parameters, referrer and landing URL" inline><Switch value={t.utm?.enabled !== false} onChange={(v) => upd(["utm", "enabled"], v)} /></Row>
            </Section>

            {canScripts && (
                <Section title="Custom scripts (admin only)">
                    <Row label="Head" help="e.g. Google Tag Manager"><Area value={t.scripts.head} onChange={(v) => upd(["scripts", "head"], v)} rows={4} mono /></Row>
                    <Row label="Body start"><Area value={t.scripts.body_start} onChange={(v) => upd(["scripts", "body_start"], v)} rows={3} mono /></Row>
                    <Row label="Body end"><Area value={t.scripts.body_end} onChange={(v) => upd(["scripts", "body_end"], v)} rows={4} mono /></Row>
                </Section>
            )}

            {problems.length > 0 && (
                <ul className="mb-3 text-xs text-amber-700 dark:text-amber-300 list-disc pl-5 space-y-0.5">
                    {problems.map((p) => <li key={p}>{p}</li>)}
                </ul>
            )}
            <button onClick={save} disabled={saving} className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save tracking for this landing
            </button>
        </div>
    );
}

function Versions({ builder, urls }) {
    const [rows, setRows] = useState(null);
    const [busy, setBusy] = useState(null);
    const load = useCallback(async () => {
        try {
            setRows((await api.get(urls.versions)).versions);
        } catch (e) {
            toast.error(errorInfo(e).message);
        }
    }, [urls.versions]);
    useEffect(() => { load(); }, [load]);

    const restore = async (v) => {
        if (!window.confirm(`Replace the current draft with version ${v.number}? The published page stays as it is.`)) return;
        setBusy(v.id);
        try {
            const res = await api.post(`${urls.versions}/${v.id}/restore`);
            builder.replaceFromServer(res);
            toast.success(res.message, { duration: 5000 });
            load();
        } catch (e) {
            toast.error(errorInfo(e).message);
        } finally {
            setBusy(null);
        }
    };
    const del = async (v) => {
        if (!window.confirm(`Delete version ${v.number}?`)) return;
        try {
            const res = await api.delete(`${urls.versions}/${v.id}`);
            setRows(res.versions);
        } catch (e) {
            toast.error(errorInfo(e).message);
        }
    };

    if (!rows) return <div className="py-10 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;
    return (
        <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-3">Every explicit save and publish creates a version. Autosaves only update the draft.</p>
            {rows.map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">v{v.number}</div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[13px] font-medium text-slate-800 dark:text-slate-100">
                            {v.label || "Saved"}
                            {v.is_published && <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-semibold">PUBLISHED</span>}
                            {v.is_latest && <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">LATEST</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">{new Date(v.created_at).toLocaleString()} · {v.created_by || "system"} · {v.elements} elements · {v.size_kb} KB</div>
                    </div>
                    <button title="Restore into draft" disabled={busy === v.id} onClick={() => restore(v)} className="h-8 px-2.5 text-xs inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                        {busy === v.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Restore
                    </button>
                    <button title={v.is_published ? "The published version cannot be deleted" : "Delete"} disabled={v.is_published} onClick={() => del(v)} className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400"><Trash2 size={15} /></button>
                </div>
            ))}
        </div>
    );
}

export default function PageSettings({ open, onClose, builder, urls, can, config, globalMeta, ctx, exportUrl, initialTab = "general" }) {
    const [tab, setTab] = useState(initialTab);
    useEffect(() => { if (open) setTab(initialTab); }, [open, initialTab]);
    if (!open) return null;
    const visible = TABS.filter(([k]) => (k !== "tracking" || can.includes("landing_pages.tracking")) && (k !== "versions" || !!urls.versions));

    return (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/40" onClick={onClose}>
            <div className="w-full max-w-xl h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-5 h-14 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Page settings</h3>
                    <a href={exportUrl} className="ml-auto text-xs inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"><Download size={13} /> Export JSON</a>
                    <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={18} /></button>
                </div>
                <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0 px-3">
                    {visible.map(([k, label]) => (
                        <button key={k} onClick={() => setTab(k)} className={`px-4 h-10 text-[13px] font-medium border-b-2 ${tab === k ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>
                            {k === "versions" && <History size={13} className="inline mr-1 -mt-0.5" />}{label}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                    {tab === "general" && <General builder={builder} can={can} ctx={{ ...ctx, fonts: config.fonts }} />}
                    {tab === "seo" && <Seo builder={builder} ctx={ctx} />}
                    {tab === "tracking" && <Tracking builder={builder} urls={urls} can={can} config={config} globalMeta={globalMeta} />}
                    {tab === "versions" && <Versions builder={builder} urls={urls} />}
                </div>
            </div>
        </div>
    );
}
