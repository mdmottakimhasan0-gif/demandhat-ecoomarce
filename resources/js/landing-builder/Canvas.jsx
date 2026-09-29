import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { api, errorInfo } from "./api";
import { find, ownValue, pathTo } from "./tree";

const WIDTHS = { desktop: "100%", tablet: 768, mobile: 375 };

/**
 * The canvas is an iframe that shows the SERVER-rendered page (same renderer and CSS as the public
 * site), so responsive behaviour is real media-query behaviour at the iframe width.
 * Edits are re-rendered through the API (debounced) and patched into the iframe.
 */
export default function Canvas({ builder, schema, urls, device, ruler, onContext, onKey }) {
    const frame = useRef(null);
    const ready = useRef(false);
    const seq = useRef(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const post = useCallback((msg) => {
        frame.current?.contentWindow?.postMessage({ lp: true, ...msg }, window.location.origin);
    }, []);

    const accepts = useRef({});
    const labels = useRef({});
    useEffect(() => {
        Object.values(schema.elements).forEach((e) => {
            accepts.current[e.type] = e.accepts;
            labels.current[e.type] = e.label;
        });
    }, [schema]);

    const render = useCallback(async () => {
        if (!ready.current) return;
        const id = ++seq.current;
        setLoading(true);
        try {
            const res = await api.post(urls.render, { content: builder.doc.content, settings: builder.doc.settings });
            if (id !== seq.current) return; // a newer render superseded this one
            post({ type: "render", html: res.html, css: res.css, fontsUrl: res.fontsUrl, bodyClass: res.bodyClass });
            setError(null);
        } catch (e) {
            if (id === seq.current) setError(errorInfo(e).message);
        } finally {
            if (id === seq.current) setLoading(false);
        }
    }, [urls.render, builder.doc.content, builder.doc.settings, post]);

    // Debounced re-render whenever the document changes.
    useEffect(() => {
        const t = setTimeout(render, 220);
        return () => clearTimeout(t);
    }, [render]);

    useEffect(() => post({ type: "select", id: builder.selectedId }), [builder.selectedId, post]);
    useEffect(() => post({ type: "reposition" }), [device, post]);
    useEffect(() => post({ type: "ruler", on: ruler }), [ruler, post]);

    // Messages coming from the canvas
    useEffect(() => {
        const handler = (e) => {
            if (e.origin !== window.location.origin || !e.data?.lp || e.source !== frame.current?.contentWindow) return;
            const m = e.data;
            switch (m.type) {
                case "ready":
                    ready.current = true;
                    post({ type: "schema", accepts: accepts.current, labels: labels.current });
                    render();
                    break;
                case "select":
                    builder.select(m.id);
                    break;
                case "context": {
                    const r = frame.current.getBoundingClientRect();
                    onContext(m.id, r.left + m.x, r.top + m.y);
                    break;
                }
                case "action":
                    if (m.action === "duplicate") builder.duplicate(m.id);
                    else if (m.action === "delete") builder.remove(m.id);
                    else if (m.action === "parent") {
                        const parent = pathTo(builder.sections, m.id).slice(-1)[0];
                        if (parent) builder.select(parent.id);
                    }
                    break;
                case "drop":
                    builder.drop({ kind: m.kind, payload: m.payload, parentId: m.parentId, index: m.index });
                    break;
                case "key":
                    onKey(m);
                    break;
                // A mouse-dragged spacing handle finished: "padding"/"margin" are per-side box values
                // (merged with whatever's already set for the other 3 sides at this device/breakpoint);
                // "width"/"min_height" are flat responsive values. Goes through the exact same
                // setSetting() the Style panel's own inputs use, so it undoes/autosaves/reflects in the
                // panel identically to typing a number there - no separate save path to keep in sync.
                case "resize": {
                    const node = find(builder.sections, m.id)?.node;
                    if (!node) break;
                    const current = ownValue(node.settings?.[m.prop], device) || {};
                    builder.setSetting(m.id, m.prop, { ...current, [m.side]: `${m.value}px` }, device, true);
                    break;
                }
                case "resizeFlat":
                    builder.setSetting(m.id, m.prop, `${m.value}px`, device, true);
                    break;
                case "updateCustomCode": {
                    const node = find(builder.sections, m.id)?.node;
                    if (node && node.content?.code !== m.html) {
                        builder.setContent(m.id, "code", m.html);
                    }
                    break;
                }
                case "updateText": {
                    const node = find(builder.sections, m.id)?.node;
                    if (node && node.content?.text !== m.text) {
                        builder.setContent(m.id, "text", m.text);
                    }
                    break;
                }
                case "updateHtml": {
                    const node = find(builder.sections, m.id)?.node;
                    if (node && node.content?.html !== m.html) {
                        builder.setContent(m.id, "html", m.html);
                    }
                    break;
                }
                case "updateButtonText": {
                    const node = find(builder.sections, m.id)?.node;
                    if (node && node.content?.text !== m.text) {
                        builder.setContent(m.id, "text", m.text);
                    }
                    break;
                }
                case "insertElement": {
                    const parent = pathTo(builder.sections, m.afterId).slice(-1)[0];
                    const parentId = parent ? parent.id : null;
                    const parentChildren = parent ? parent.children : builder.sections;
                    const idx = parentChildren.findIndex((n) => n.id === m.afterId);
                    builder.add(m.elementType, parentId, idx >= 0 ? idx + 1 : undefined);
                    break;
                }
                default:
            }
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [builder, device, onContext, onKey, render, post]);

    const w = WIDTHS[device];

    return (
        <div className="relative h-full w-full bg-slate-200 dark:bg-slate-950 overflow-auto flex justify-center" onClick={(e) => e.target === e.currentTarget && builder.select(null)}>
            <div className="h-full transition-[width] duration-200 bg-white shadow-xl" style={{ width: typeof w === "number" ? w : "100%", maxWidth: "100%", marginTop: device === "desktop" ? 0 : 16, height: device === "desktop" ? "100%" : "calc(100% - 32px)" }}>
                <iframe ref={frame} src={urls.canvas} title="Landing page canvas" className="w-full h-full border-0 block bg-white" />
            </div>

            {loading && (
                <div className="absolute top-3 right-4 flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-slate-900/80 text-white text-xs pointer-events-none">
                    <Loader2 size={12} className="animate-spin" /> Rendering
                </div>
            )}
            {error && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-md flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm shadow-lg">
                    <TriangleAlert size={16} className="shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button onClick={render} className="flex items-center gap-1 underline"><RefreshCw size={13} /> Retry</button>
                </div>
            )}
        </div>
    );
}
