import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Copy, Trash2 } from "lucide-react";
import { ElementIcon } from "./icons";
import { pathTo } from "./tree";

function labelFor(node, schema) {
    const el = schema.elements[node.type];
    const c = node.content || {};
    const hint = c.text || c.title || c.html?.replace(/<[^>]+>/g, "") || c.quote || c.name || "";
    return { name: el?.label || `Unsupported: ${node.type}`, hint: String(hint).trim().slice(0, 28) };
}

function Row({ node, depth, schema, builder, open, toggle, rowRef }) {
    const { name, hint } = labelFor(node, schema);
    const selected = builder.selectedId === node.id;
    const hasKids = node.children?.length > 0;
    return (
        <>
            <div
                ref={selected ? rowRef : null}
                onClick={() => builder.select(node.id)}
                className={`group flex items-center h-7 pr-1 cursor-pointer text-[12.5px] ${selected ? "bg-blue-600 text-white" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                style={{ paddingLeft: 6 + depth * 14 }}
            >
                <button type="button" className={`w-4 h-4 mr-0.5 flex items-center justify-center ${hasKids ? "" : "invisible"}`} onClick={(e) => { e.stopPropagation(); toggle(node.id); }}>
                    {open[node.id] === false ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                </button>
                <ElementIcon type={node.type} size={13} className="mr-1.5 shrink-0 opacity-80" />
                <span className="font-medium truncate">{name}</span>
                {hint && <span className={`ml-1.5 truncate text-[11px] ${selected ? "text-blue-100" : "text-slate-400"}`}>{hint}</span>}
                <span className="ml-auto flex items-center opacity-0 group-hover:opacity-100">
                    <button title="Move up" className="p-0.5 hover:text-white/90" onClick={(e) => { e.stopPropagation(); builder.moveBy(node.id, -1); }}><ChevronUp size={13} /></button>
                    <button title="Move down" className="p-0.5" onClick={(e) => { e.stopPropagation(); builder.moveBy(node.id, 1); }}><ChevronDown size={13} /></button>
                    <button title="Duplicate" className="p-0.5" onClick={(e) => { e.stopPropagation(); builder.duplicate(node.id); }}><Copy size={12} /></button>
                    <button title="Delete" className="p-0.5" onClick={(e) => { e.stopPropagation(); builder.remove(node.id); }}><Trash2 size={12} /></button>
                </span>
            </div>
            {hasKids && open[node.id] !== false &&
                node.children.map((c) => <Row key={c.id} node={c} depth={depth + 1} schema={schema} builder={builder} open={open} toggle={toggle} rowRef={rowRef} />)}
        </>
    );
}

/** Tree view of the page structure. Clicking a row selects the element on the canvas. */
export default function Navigator({ schema, builder }) {
    const [open, setOpen] = useState({});
    const rowRef = React.useRef(null);
    const toggle = (id) => setOpen((o) => ({ ...o, [id]: o[id] === false }));

    // Expand ancestors of the selection and scroll it into view.
    useEffect(() => {
        if (!builder.selectedId) return;
        const anc = pathTo(builder.sections, builder.selectedId);
        if (anc.some((a) => open[a.id] === false)) setOpen((o) => ({ ...o, ...Object.fromEntries(anc.map((a) => [a.id, true])) }));
        rowRef.current?.scrollIntoView({ block: "nearest" });
    }, [builder.selectedId]);

    return (
        <div className="h-full overflow-y-auto py-2">
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Page structure</div>
            {builder.sections.length ? (
                builder.sections.map((s) => <Row key={s.id} node={s} depth={0} schema={schema} builder={builder} open={open} toggle={toggle} rowRef={rowRef} />)
            ) : (
                <p className="px-4 py-10 text-center text-sm text-slate-400">The page is empty. Drag a Section from the Elements tab.</p>
            )}
        </div>
    );
}
