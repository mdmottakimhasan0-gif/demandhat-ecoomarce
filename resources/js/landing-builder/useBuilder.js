import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api, errorInfo, withRetry } from "./api";
import * as T from "./tree";

const HISTORY_LIMIT = 100;
const CLIPBOARD_KEY = "lp-clipboard";

function reducer(state, action) {
    switch (action.type) {
        case "apply": {
            // Edits are functions of the CURRENT state, so several edits in one tick never overwrite each other.
            const r = action.fn(state);
            if (!r || r.doc === state.doc) return r && r.selectedId !== undefined ? { ...state, selectedId: r.selectedId } : state;
            return reducer(state, { type: "commit", doc: r.doc, coalesce: action.coalesce, selectedId: r.selectedId });
        }
        case "commit": {
            // Consecutive edits with the same coalesce key (typing in one field) share one undo step.
            const now = Date.now();
            const merge = action.coalesce && action.coalesce === state.coalesceKey && now - state.coalesceAt < 1200;
            const past = merge ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT);
            return {
                ...state,
                doc: action.doc,
                past,
                future: [],
                coalesceKey: action.coalesce || null,
                coalesceAt: now,
                version: state.version + 1,
                selectedId: action.selectedId !== undefined ? action.selectedId : state.selectedId,
            };
        }
        case "undo": {
            if (!state.past.length) return state;
            const prev = state.past[state.past.length - 1];
            return { ...state, doc: prev, past: state.past.slice(0, -1), future: [state.doc, ...state.future], coalesceKey: null, version: state.version + 1, selectedId: keepSelection(prev, state.selectedId) };
        }
        case "redo": {
            if (!state.future.length) return state;
            const next = state.future[0];
            return { ...state, doc: next, past: [...state.past, state.doc], future: state.future.slice(1), coalesceKey: null, version: state.version + 1, selectedId: keepSelection(next, state.selectedId) };
        }
        case "select":
            return { ...state, selectedId: action.id };
        case "replace": // server-driven replacement (restore version) - resets history
            return { ...state, doc: action.doc, past: [], future: [], version: state.version + 1, selectedId: null, coalesceKey: null };
        default:
            return state;
    }
}

const keepSelection = (doc, id) => (id && T.find(doc.content.sections, id) ? id : null);

export function useBuilder({ schema, initial, urls, config, canPublish }) {
    const [state, dispatch] = useReducer(reducer, {
        doc: {
            content: T.normalizeContent(initial.content),
            settings: initial.settings || {},
            seo: initial.seo || {},
        },
        past: [],
        future: [],
        selectedId: null,
        coalesceKey: null,
        coalesceAt: 0,
        version: 0,
        }
    );
    const [page, setPage] = useState(initial.page);
    const [tracking, setTracking] = useState(initial.tracking);
    const [status, setStatus] = useState("saved"); // saved | unsaved | saving | error
    const [statusMessage, setStatusMessage] = useState("");
    const [clipboard, setClipboardState] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(CLIPBOARD_KEY) || "null");
        } catch {
            return null;
        }
    });

    const stateRef = useRef(state);
    stateRef.current = state;
    const pageRef = useRef(page);
    pageRef.current = page;
    const savedVersion = useRef(0);
    const inflight = useRef(false);
    const sections = state.doc.content.sections;

    const apply = useCallback((fn, coalesce) => dispatch({ type: "apply", fn, coalesce }), []);
    /** Edit the section tree: fn(sections, state) -> {sections, selectedId?} | null */
    const editTree = useCallback((fn, coalesce) => apply((st) => {
        const r = fn(st.doc.content.sections, st);
        if (!r || r.sections === st.doc.content.sections) return null;
        return { doc: { ...st.doc, content: { ...st.doc.content, sections: r.sections } }, selectedId: r.selectedId };
    }, coalesce), [apply]);

    // ---- selection ---------------------------------------------------------------
    const select = useCallback((id) => dispatch({ type: "select", id }), []);
    const selected = useMemo(() => (state.selectedId ? T.find(sections, state.selectedId) : null), [sections, state.selectedId]);

    // ---- structure -----------------------------------------------------------------
    const add = useCallback((type, parentId = undefined, index = undefined) => {
        const node = T.instantiate(type, schema);
        editTree((secs, st) => {
            let target;
            if (parentId !== undefined) target = { parentId, index: index ?? (parentId === null ? secs.length : T.find(secs, parentId)?.node.children.length ?? 0) };
            else target = T.pasteTarget(secs, schema, st.selectedId, type);
            return { sections: T.insertNode(secs, schema, target.parentId, target.index, node), selectedId: node.id };
        });
        return node.id;
    }, [schema, editTree]);

    const drop = useCallback(({ kind, payload, parentId, index }) => {
        if (kind === "new") {
            const node = T.instantiate(payload, schema);
            editTree((secs) => ({ sections: T.insertNode(secs, schema, parentId, index, node), selectedId: node.id }));
        } else {
            editTree((secs) => ({ sections: T.moveNode(secs, schema, payload, parentId, index), selectedId: payload }));
        }
    }, [schema, editTree]);

    const remove = useCallback((id) => editTree((secs) => ({ sections: T.removeNode(secs, id).sections, selectedId: null })), [editTree]);

    const duplicate = useCallback((id) => editTree((secs) => {
        const { sections: next, node } = T.duplicateNode(secs, id);
        return node ? { sections: next, selectedId: node.id } : null;
    }), [editTree]);

    const moveBy = useCallback((id, delta) => editTree((secs) => {
        const f = T.find(secs, id);
        if (!f) return null;
        const parentId = f.parent ? f.parent.id : null;
        const len = (f.parent ? f.parent.children : secs).length;
        const to = f.index + delta;
        if (to < 0 || to >= len) return null;
        return { sections: T.moveNode(secs, schema, id, parentId, delta > 0 ? to + 1 : to), selectedId: id };
    }), [schema, editTree]);

    // ---- clipboard -------------------------------------------------------------------
    const copy = useCallback((id) => {
        const f = T.find(stateRef.current.doc.content.sections, id);
        if (!f) return;
        const data = T.clone(f.node);
        setClipboardState(data);
        try {
            localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(data));
        } catch { /* storage may be unavailable */ }
        toast.success("Copied");
    }, []);

    const paste = useCallback(() => {
        const data = clipboard;
        if (!data) return toast.error("Nothing to paste");
        const node = T.cloneWithNewIds(data); // pasted copies always get new unique ids
        editTree((secs, st) => {
            const target = T.pasteTarget(secs, schema, st.selectedId, node.type);
            return { sections: T.insertNode(secs, schema, target.parentId, target.index, node), selectedId: node.id };
        });
    }, [clipboard, schema, editTree]);

    // ---- property edits --------------------------------------------------------------
    const setContent = useCallback((id, key, value) => {
        editTree((secs) => {
            let next = T.updateNode(secs, id, (n) => {
                n.content = { ...n.content };
                if (value === undefined) delete n.content[key];
                else n.content[key] = value;
            });
            if (key === "layout" || key === "custom_layout") next = T.updateNode(next, id, (n) => Object.assign(n, T.syncColumns(n)));

            return { sections: next };
        }, `c:${id}:${key}`);
    }, [editTree]);

    /** device is only used for responsive controls. */
    const setSetting = useCallback((id, key, value, device = "desktop", responsive = false) => {
        editTree((secs) => ({
            sections: T.updateNode(secs, id, (n) => {
                n.settings = { ...n.settings };
                const next = responsive ? T.withDeviceValue(n.settings[key], device, value) : value === "" ? undefined : value;
                if (next === undefined) delete n.settings[key];
                else n.settings[key] = next;
            }),
        }), `s:${id}:${key}:${device}`);
    }, [editTree]);

    const setPageSetting = useCallback((key, value) => apply((st) => ({ doc: { ...st.doc, settings: { ...st.doc.settings, [key]: value } } }), `ps:${key}`), [apply]);

    const setSeo = useCallback((key, value) => apply((st) => ({ doc: { ...st.doc, seo: { ...st.doc.seo, [key]: value } } }), `seo:${key}`), [apply]);

    const undo = useCallback(() => dispatch({ type: "undo" }), []);
    const redo = useCallback(() => dispatch({ type: "redo" }), []);

    // ---- saving ----------------------------------------------------------------------
    const payload = () => {
        const d = stateRef.current.doc;
        return { title: pageRef.current.title, slug: pageRef.current.slug, content: d.content, settings: d.settings, seo: d.seo };
    };

    const persist = useCallback(async (kind) => {
        const ver = stateRef.current.version;
        inflight.current = true;
        setStatus("saving");
        try {
            const res = await withRetry(() => api.post(urls[kind], payload()));
            setPage((p) => ({ ...p, ...res.page, title: p.title, slug: res.page.slug }));
            savedVersion.current = ver;
            setStatus(stateRef.current.version === ver ? "saved" : "unsaved");
            setStatusMessage("");
            return { ok: true, res };
        } catch (e) {
            const info = errorInfo(e);
            setStatus("error");
            setStatusMessage(info.message);
            return { ok: false, info };
        } finally {
            inflight.current = false;
        }
    }, [urls]);

    const save = useCallback(async () => {
        const r = await persist("save");
        r.ok ? toast.success("Draft saved") : toast.error(r.info.message);
        return r;
    }, [persist]);

    // Dirty tracking + debounced autosave (updates the draft only - no version row per keystroke).
    useEffect(() => {
        if (state.version === savedVersion.current) return;
        if (status !== "saving") setStatus("unsaved");
        const t = setTimeout(() => {
            if (!inflight.current && stateRef.current.version !== savedVersion.current) persist("autosave");
        }, config.autosaveMs || 4000);
        return () => clearTimeout(t);
    }, [state.version]);

    // Warn before leaving with unsaved work.
    useEffect(() => {
        const h = (e) => {
            if (stateRef.current.version !== savedVersion.current || inflight.current) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, []);

    const publish = useCallback(async () => {
        const saved = await persist("save");
        if (!saved.ok) return toast.error(saved.info.message);
        try {
            const res = await api.post(urls.publish);
            setPage((p) => ({ ...p, ...res.page, title: p.title }));
            toast.success(res.message, { duration: 6000 });
            return true;
        } catch (e) {
            const info = errorInfo(e);
            toast.error(info.errors?.publish?.[0] || info.message, { duration: 7000 });
            return false;
        }
    }, [persist, urls]);

    const unpublish = useCallback(async () => {
        try {
            const res = await api.post(urls.unpublish);
            setPage((p) => ({ ...p, ...res.page, title: p.title }));
            toast.success(res.message);
        } catch (e) {
            toast.error(errorInfo(e).message);
        }
    }, [urls]);

    const replaceFromServer = useCallback((res) => {
        dispatch({ type: "replace", doc: { content: T.normalizeContent(res.content), settings: res.settings || {}, seo: res.seo || {} } });
        if (res.tracking) setTracking(res.tracking);
        if (res.page) setPage((p) => ({ ...p, ...res.page }));
        savedVersion.current = stateRef.current.version + 1;
        setStatus("saved");
    }, []);

    return {
        state, doc: state.doc, sections, selectedId: state.selectedId, selected,
        canUndo: state.past.length > 0, canRedo: state.future.length > 0,
        page, setPage, tracking, setTracking, status, statusMessage, clipboard,
        select, add, drop, remove, duplicate, moveBy, copy, paste,
        setContent, setSetting, setPageSetting, setSeo, undo, redo,
        save, publish, unpublish, persist, replaceFromServer,
    };
}
