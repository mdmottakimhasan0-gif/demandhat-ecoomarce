import React, { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { ElementIcon } from "./icons";

const ORDER = ["layout", "basic", "content", "marketing", "advanced"];

/** Draggable palette. Clicking a tile adds the element next to the selection. */
export default function ElementsPanel({ schema, onAdd }) {
    const [q, setQ] = useState("");
    const [collapsed, setCollapsed] = useState({});

    const groups = useMemo(() => {
        const term = q.trim().toLowerCase();
        const by = {};
        Object.values(schema.elements).forEach((el) => {
            if (el.category === "hidden") return;
            if (term && !el.label.toLowerCase().includes(term) && !el.type.includes(term)) return;
            (by[el.category] ||= []).push(el);
        });
        return ORDER.filter((c) => by[c]).map((c) => ({ key: c, label: schema.categories[c] || c, items: by[c] }));
    }, [schema, q]);

    const dragStart = (e, type) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("application/x-lp-new", type);
        e.dataTransfer.setData("text/plain", type);
        window.__lpDrag = { kind: "new", type };
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search elements" className="w-full h-8 pl-8 pr-2 text-[13px] rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {groups.map((g) => (
                    <div key={g.key}>
                        <button type="button" onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))} className="w-full flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            {g.label}
                            <ChevronDown size={13} className={`transition-transform ${collapsed[g.key] ? "-rotate-90" : ""}`} />
                        </button>
                        {!collapsed[g.key] && (
                            <div className="grid grid-cols-2 gap-2">
                                {g.items.map((el) => (
                                    <div
                                        key={el.type}
                                        draggable
                                        onDragStart={(e) => dragStart(e, el.type)}
                                        onDragEnd={() => (window.__lpDrag = null)}
                                        onClick={() => onAdd(el.type)}
                                        title={`Drag onto the page, or click to add "${el.label}"`}
                                        className="flex flex-col items-center justify-center gap-1.5 h-[74px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm cursor-grab active:cursor-grabbing select-none transition-colors"
                                    >
                                        <ElementIcon type={el.type} size={20} />
                                        <span className="text-[11.5px] font-medium leading-none text-center px-1">{el.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {!groups.length && <p className="text-center text-sm text-slate-400 py-8">No elements match "{q}".</p>}
            </div>
        </div>
    );
}
