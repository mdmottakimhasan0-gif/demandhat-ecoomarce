import React, { useEffect, useRef } from "react";

/** Right-click / three-dot menu for an element. Items: Edit, Duplicate, Copy, Paste, Save as template, Navigator, Delete. */
export default function ContextMenu({ menu, onClose, items }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!menu) return;
        const away = (e) => !ref.current?.contains(e.target) && onClose();
        const esc = (e) => e.key === "Escape" && onClose();
        window.addEventListener("mousedown", away);
        window.addEventListener("keydown", esc);
        window.addEventListener("blur", onClose);
        return () => {
            window.removeEventListener("mousedown", away);
            window.removeEventListener("keydown", esc);
            window.removeEventListener("blur", onClose);
        };
    }, [menu]);

    if (!menu) return null;
    const left = Math.min(menu.x, window.innerWidth - 200);
    const top = Math.min(menu.y, window.innerHeight - items.length * 32 - 16);

    return (
        <div ref={ref} className="fixed z-[90] w-48 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl" style={{ left, top }}>
            {items.map((it, i) =>
                it === "-" ? (
                    <div key={i} className="my-1 border-t border-slate-200 dark:border-slate-700" />
                ) : (
                    <button key={it.label} disabled={it.disabled} onClick={() => { it.run(); onClose(); }} className={`w-full flex items-center gap-2 px-3 h-8 text-[13px] text-left disabled:opacity-40 ${it.danger ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                        {it.icon}
                        <span className="flex-1">{it.label}</span>
                        {it.shortcut && <span className="text-[11px] text-slate-400">{it.shortcut}</span>}
                    </button>
                )
            )}
        </div>
    );
}
