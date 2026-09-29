// Pure, immutable operations on the builder JSON tree. No React in here so it can be unit tested.
// Tree shape: { version, sections: [ {id,type,content,settings,children:[...]} ] }

export const clone = (v) => JSON.parse(JSON.stringify(v));

/** Collision-resistant stable element id: "<type>_<10 hex chars>". Matches the server pattern. */
export function uid(type = "el") {
    const bytes = new Uint8Array(5);
    globalThis.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${String(type).replace(/[^a-z0-9_]/g, "")}_${hex}`;
}

/** PHP encodes empty objects as [] - coerce back so property writes survive JSON.stringify. */
export function normalizeNode(node) {
    const n = { ...node };
    n.content = Array.isArray(n.content) || !n.content ? {} : n.content;
    n.settings = Array.isArray(n.settings) || !n.settings ? {} : n.settings;
    n.children = Array.isArray(n.children) ? n.children.map(normalizeNode) : [];
    return n;
}

export function normalizeContent(content) {
    const c = content && typeof content === "object" ? content : {};
    return { version: c.version || 1, sections: (Array.isArray(c.sections) ? c.sections : []).map(normalizeNode) };
}

/** Build a node (with fresh ids, recursively) from a registry default spec. */
export function instantiate(type, schema) {
    const el = schema.elements[type];
    const d = el ? el.defaults : { content: {}, settings: {}, children: [] };
    const build = (t, spec) => ({
        id: uid(t),
        type: t,
        content: clone(spec.content && !Array.isArray(spec.content) ? spec.content : {}),
        settings: clone(spec.settings && !Array.isArray(spec.settings) ? spec.settings : {}),
        children: (spec.children || []).map((c) => build(c.type, c)),
    });
    return build(type, d);
}

/** Copy a node giving every descendant a new id (paste / duplicate / save-as-template). */
export function cloneWithNewIds(node) {
    const n = clone(node);
    const walk = (x) => {
        x.id = uid(x.type);
        (x.children || []).forEach(walk);
    };
    walk(n);
    return n;
}

export function walk(sections, fn, parent = null) {
    sections.forEach((n, i) => {
        fn(n, parent, i);
        if (n.children?.length) walk(n.children, fn, n);
    });
}

export function find(sections, id) {
    let out = null;
    walk(sections, (n, parent, index) => {
        if (!out && n.id === id) out = { node: n, parent, index };
    });
    return out;
}

/** Ancestors from the root down to (excluding) the node. */
export function pathTo(sections, id) {
    const path = [];
    const dive = (nodes, trail) => {
        for (const n of nodes) {
            if (n.id === id) return trail;
            if (n.children?.length) {
                const r = dive(n.children, [...trail, n]);
                if (r) return r;
            }
        }
        return null;
    };
    return dive(sections, path) || [];
}

export function isDescendant(sections, ancestorId, id) {
    const a = find(sections, ancestorId);
    return !!a && !!find(a.node.children || [], id);
}

/** May a child of `childType` live directly inside `parentType` (null = page root)? */
export function canAccept(schema, parentType, childType) {
    if (parentType === null) return childType === "section";
    const parent = schema.elements[parentType];
    if (!parent) return false;
    const a = parent.accepts || [];
    if (a.includes("*")) return childType !== "section" && childType !== "column" && !!schema.elements[childType];
    return a.includes(childType);
}

const mutate = (sections, fn) => {
    const next = clone(sections);
    fn(next);
    return next;
};

function listOf(sections, parentId) {
    if (parentId === null) return sections;
    const p = find(sections, parentId);
    return p ? p.node.children : null;
}

export function removeNode(sections, id) {
    let removed = null;
    const next = mutate(sections, (s) => {
        const f = find(s, id);
        if (!f) return;
        const list = f.parent ? f.parent.children : s;
        removed = list.splice(f.index, 1)[0];
    });
    return { sections: next, removed };
}

/**
 * Insert into `parentId` (null = page root). A non-section dropped at the root is wrapped in
 * section > container so the document always stays valid.
 */
export function insertNode(sections, schema, parentId, index, node) {
    let toInsert = node;
    if (parentId === null && node.type !== "section") {
        toInsert = {
            id: uid("section"), type: "section", content: { content_width: "boxed", html_tag: "section" },
            settings: clone(schema.elements.section?.defaults?.settings || {}),
            children: [{ id: uid("container"), type: "container", content: {}, settings: clone(schema.elements.container?.defaults?.settings || {}), children: [node] }],
        };
    }
    return mutate(sections, (s) => {
        const list = listOf(s, parentId);
        if (!list) return;
        list.splice(Math.max(0, Math.min(index, list.length)), 0, toInsert);
    });
}

/** Move an existing node; index refers to the target list BEFORE removal. */
export function moveNode(sections, schema, id, parentId, index) {
    const f = find(sections, id);
    if (!f) return sections;
    if (parentId === id || (parentId && isDescendant(sections, id, parentId))) return sections; // cannot drop into itself
    if (!canAccept(schema, parentId ? find(sections, parentId)?.node.type ?? null : null, f.node.type) && !(parentId === null)) return sections;

    const sameList = (f.parent ? f.parent.id : null) === parentId;
    const adjusted = sameList && f.index < index ? index - 1 : index;
    const { sections: without, removed } = removeNode(sections, id);
    return insertNode(without, schema, parentId, adjusted, removed);
}

export function updateNode(sections, id, patcher) {
    return mutate(sections, (s) => {
        const f = find(s, id);
        if (f) patcher(f.node);
    });
}

export function duplicateNode(sections, id) {
    const f = find(sections, id);
    if (!f) return { sections, node: null };
    const copy = cloneWithNewIds(f.node);
    const next = mutate(sections, (s) => {
        const list = f.parent ? find(s, f.parent.id).node.children : s;
        list.splice(f.index + 1, 0, copy);
    });
    return { sections: next, node: copy };
}

/** Where can a pasted node go, relative to the current selection? Returns {parentId,index}. */
export function pasteTarget(sections, schema, selectedId, nodeType) {
    if (!selectedId) return { parentId: null, index: sections.length };
    const f = find(sections, selectedId);
    if (!f) return { parentId: null, index: sections.length };
    // Inside the selection when it can hold the node.
    if (canAccept(schema, f.node.type, nodeType)) return { parentId: f.node.id, index: f.node.children.length };
    // Otherwise as a sibling after it, bubbling up until accepted.
    let cur = f;
    while (cur) {
        const parentType = cur.parent ? cur.parent.type : null;
        if (canAccept(schema, parentType, nodeType)) return { parentId: cur.parent ? cur.parent.id : null, index: cur.index + 1 };
        if (!cur.parent) break;
        cur = find(sections, cur.parent.id);
    }
    return { parentId: null, index: sections.length };
}

// ---- columns ------------------------------------------------------------------

export function columnFractions(content) {
    let layout = content.layout || "50-50";
    if (layout === "custom") layout = content.custom_layout || "50-50";
    const parts = String(layout).split("-").map((n) => parseInt(n, 10)).filter((n) => n > 0 && n <= 100);
    return (parts.length ? parts : [100]).slice(0, 6);
}

/** Keep the number of column children equal to the layout. Surplus columns merge into the last kept one. */
export function syncColumns(node) {
    if (node.type !== "columns") return node;
    const want = columnFractions(node.content).length;
    const cols = node.children.slice();
    while (cols.length < want) cols.push({ id: uid("column"), type: "column", content: {}, settings: { gap: "16px" }, children: [] });
    if (cols.length > want) {
        const keep = cols.slice(0, want);
        const extra = cols.slice(want);
        extra.forEach((c) => keep[want - 1].children.push(...c.children));
        return { ...node, children: keep };
    }
    return { ...node, children: cols };
}

// ---- responsive values ----------------------------------------------------------

export const DEVICES = ["desktop", "tablet", "mobile"];

export function isResponsiveObject(v) {
    return v && typeof v === "object" && !Array.isArray(v) && DEVICES.some((d) => d in v);
}

/** The value the user sees for `device` (own value only). */
export function ownValue(stored, device) {
    if (isResponsiveObject(stored)) return stored[device];
    return device === "desktop" ? stored : undefined; // a plain scalar is the desktop value
}

/** Inherited value (desktop -> tablet -> mobile) used as the placeholder. */
export function effectiveValue(stored, device) {
    if (!isResponsiveObject(stored)) return stored;
    const order = device === "desktop" ? ["desktop"] : device === "tablet" ? ["tablet", "desktop"] : ["mobile", "tablet", "desktop"];
    for (const d of order) {
        const v = stored[d];
        if (v !== undefined && v !== "" && v !== null && !(typeof v === "object" && Object.keys(v).length === 0)) return v;
    }
    return undefined;
}

export function withDeviceValue(stored, device, value) {
    const isEmpty = value === undefined || value === "" || value === null || (typeof value === "object" && !Array.isArray(value) && Object.values(value).every((x) => x === "" || x == null));
    let obj = isResponsiveObject(stored) ? { ...stored } : stored === undefined || stored === "" ? {} : { desktop: stored };
    if (isEmpty) delete obj[device];
    else obj[device] = value;
    return Object.keys(obj).length ? obj : undefined;
}
