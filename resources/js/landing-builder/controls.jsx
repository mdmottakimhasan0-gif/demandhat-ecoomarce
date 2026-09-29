import React, { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextAlign } from "@tiptap/extension-text-align";
import { AlignCenter, AlignLeft, AlignRight, Bold, Check, ChevronDown, ChevronUp, Copy, Italic, Link2, Link2Off, List, ListOrdered, Maximize2, Monitor, Plus, Smartphone, Tablet, Trash2, Underline as UnderlineIcon, X, ImageIcon, Link } from "lucide-react";
import { DEVICES, effectiveValue, ownValue } from "./tree";
import { api } from "./api";

export const inputCls =
    "w-full h-8 px-2 text-[13px] rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500";
const btnCls = "h-8 px-2 inline-flex items-center justify-center rounded-md text-xs font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800";

const deviceIcon = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };

const isEmptyVal = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);

/** Current value of any key on a node, used by `if` conditions. */
function valueOf(node, key, schemaEl) {
    const raw = node.content?.[key] ?? node.settings?.[key];
    if (raw !== undefined) return raw;
    if (key === "background_type") {
        const s = node.settings || {};
        return s.gradient_from ? "gradient" : s.background_image ? "image" : s.background_color ? "color" : "none";
    }
    const ctl = schemaEl?.controls.find((c) => c.key === key);
    return ctl?.default;
}

export function isVisible(ctl, node, schemaEl) {
    if (!ctl.if) return true;
    return Object.entries(ctl.if).every(([k, vals]) => {
        const cur = valueOf(node, k, schemaEl);
        return vals.some((v) => (typeof v === "boolean" ? !!cur === v : String(cur ?? "") === String(v)));
    });
}

// ---------------------------------------------------------------------------------------------
// Pure value editors (used for top level controls and repeater sub-fields)
// ---------------------------------------------------------------------------------------------

function ColorInput({ value, onChange }) {
    const hex = /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#000000";
    return (
        <div className="flex items-center gap-1.5">
            <label className="relative w-8 h-8 shrink-0 rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden cursor-pointer" style={{ background: value || "repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 10px 10px" }}>
                <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
            <input className={inputCls} value={value || ""} placeholder="#000000" onChange={(e) => onChange(e.target.value)} />
            {value ? (
                <button type="button" title="Clear" className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => onChange("")}>
                    <X size={14} />
                </button>
            ) : null}
        </div>
    );
}

function DimensionsInput({ value, onChange, placeholderBox }) {
    const [linked, setLinked] = useState(false);
    const box = value && typeof value === "object" ? value : {};
    const sides = [["top", "T"], ["right", "R"], ["bottom", "B"], ["left", "L"]];
    const set = (side, v) => {
        let next = linked ? { top: v, right: v, bottom: v, left: v } : { ...box, [side]: v };
        if (Object.values(next).every((x) => x === "" || x == null)) next = undefined;
        onChange(next);
    };
    return (
        <div className="flex items-center gap-1">
            {sides.map(([side, label]) => (
                <div key={side} className="flex-1 min-w-0">
                    <input
                        className={`${inputCls} text-center px-1`}
                        value={box[side] ?? ""}
                        placeholder={placeholderBox?.[side] ?? "-"}
                        onChange={(e) => set(side, e.target.value)}
                    />
                    <div className="text-[10px] text-center text-slate-400 mt-0.5">{label}</div>
                </div>
            ))}
            <button type="button" title={linked ? "Unlink values" : "Link values"} onClick={() => setLinked(!linked)} className={`h-8 w-8 shrink-0 -mt-3 rounded-md border flex items-center justify-center ${linked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600 text-slate-500"}`}>
                {linked ? <Link2 size={14} /> : <Link2Off size={14} />}
            </button>
        </div>
    );
}

function IconPicker({ value, onChange, ctx }) {
    const [open, setOpen] = useState(false);
    const icons = ctx.schema.icons || {};
    return (
        <div>
            <div className="flex gap-1.5">
                <button type="button" onClick={() => setOpen(!open)} className={`${btnCls} flex-1 justify-start gap-2`}>
                    {value && icons[value] ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: icons[value] }} /> : <Plus size={14} />}
                    <span>{value || "Choose icon"}</span>
                </button>
                {value ? (
                    <button type="button" className={btnCls} onClick={() => onChange("")} title="Clear">
                        <X size={14} />
                    </button>
                ) : null}
            </div>
            {open && (
                <div className="mt-1.5 grid grid-cols-6 gap-1 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-800">
                    {Object.entries(icons).map(([name, svg]) => (
                        <button key={name} type="button" title={name} onClick={() => { onChange(name); setOpen(false); }} className={`aspect-square rounded flex items-center justify-center hover:bg-blue-100 dark:hover:bg-slate-700 ${value === name ? "bg-blue-600 text-white hover:bg-blue-600" : "text-slate-700 dark:text-slate-200"}`}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: svg }} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function ImageInput({ value, onChange, ctx, onPicked }) {
    return (
        <div className="space-y-1.5">
            {value ? (
                <div className="relative rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <img src={value} alt="" className="w-full max-h-28 object-contain" />
                </div>
            ) : null}
            <div className="flex gap-1.5">
                <button type="button" className={`${btnCls} flex-1 gap-1.5`} onClick={() => ctx.openMedia((m) => { onChange(m.url); onPicked?.(m); })}>
                    <ImageIcon size={14} /> {value ? "Replace" : "Choose image"}
                </button>
                {value ? (
                    <button type="button" className={btnCls} onClick={() => onChange("")} title="Remove">
                        <Trash2 size={14} />
                    </button>
                ) : null}
            </div>
            <input className={inputCls} value={value || ""} placeholder="or paste an image URL" onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}

function RichText({ value, onChange }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false, strike: false, link: { openOnClick: false, autolink: true } }),
            TextAlign.configure({ types: ["paragraph"] }),
        ],
        content: value || "",
        editorProps: { attributes: { class: "outline-none min-h-[110px] px-2.5 py-2 text-[13px] prose prose-sm max-w-none dark:prose-invert" } },
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
    });
    if (!editor) return null;
    const Btn = ({ on, active, title, children }) => (
        <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={on} className={`p-1.5 rounded ${active ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
            {children}
        </button>
    );
    const setLink = () => {
        const prev = editor.getAttributes("link").href || "";
        const url = window.prompt("Link URL (https://, mailto:, tel: or /path)", prev);
        if (url === null) return;
        url === "" ? editor.chain().focus().unsetLink().run() : editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };
    return (
        <div className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="flex flex-wrap gap-0.5 p-1 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <Btn title="Bold" active={editor.isActive("bold")} on={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></Btn>
                <Btn title="Italic" active={editor.isActive("italic")} on={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></Btn>
                <Btn title="Underline" active={editor.isActive("underline")} on={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></Btn>
                <Btn title="Link" active={editor.isActive("link")} on={setLink}><Link size={14} /></Btn>
                <Btn title="Bulleted list" active={editor.isActive("bulletList")} on={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></Btn>
                <Btn title="Numbered list" active={editor.isActive("orderedList")} on={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></Btn>
                <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} on={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={14} /></Btn>
                <Btn title="Align center" active={editor.isActive({ textAlign: "center" })} on={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={14} /></Btn>
                <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} on={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={14} /></Btn>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}

/** Search the shop's products and store the chosen product id. */
function ProductInput({ value, onChange, ctx }) {
    const [q, setQ] = useState("");
    const [results, setResults] = useState([]);
    const [current, setCurrent] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!value) return setCurrent(null);
        let alive = true;
        api.get(ctx.productSearchUrl, { ids: value }).then((r) => alive && setCurrent(r[0] || { id: value, name: `Product #${value} (not found)` })).catch(() => {});
        return () => { alive = false; };
    }, [value]);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => api.get(ctx.productSearchUrl, { q }).then(setResults).catch(() => setResults([])), 250);
        return () => clearTimeout(t);
    }, [q, open]);

    return (
        <div>
            {current && (
                <div className="flex items-center gap-2 mb-1.5 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    {current.image ? <img src={current.image} alt="" className="w-9 h-9 rounded object-cover" /> : <div className="w-9 h-9 rounded bg-slate-200 dark:bg-slate-700" />}
                    <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-medium truncate text-slate-800 dark:text-slate-100">{current.name}</div>
                        {current.price != null && <div className="text-[11px] text-slate-500">{current.price} · stock {current.stock}</div>}
                    </div>
                    <button type="button" className="p-1 text-slate-400 hover:text-red-500" onClick={() => onChange(undefined)}><X size={13} /></button>
                </div>
            )}
            <input className={inputCls} value={q} placeholder={current ? "Change product..." : "Search your products"} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }} />
            {open && (
                <div className="mt-1 max-h-48 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    {results.map((p) => (
                        <button type="button" key={p.id} onClick={() => { onChange(p.id, p); setOpen(false); setQ(""); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800">
                            {p.image ? <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700" />}
                            <span className="min-w-0 flex-1"><span className="block text-[12px] truncate text-slate-800 dark:text-slate-100">{p.name}</span><span className="block text-[11px] text-slate-500">{p.price} · stock {p.stock}</span></span>
                        </button>
                    ))}
                    {!results.length && <div className="px-3 py-3 text-xs text-slate-400">No products found.</div>}
                </div>
            )}
        </div>
    );
}

function RepeaterInput({ ctl, value, onChange, ctx }) {
    const items = Array.isArray(value) ? value : [];
    const [open, setOpen] = useState(0);
    const update = (i, key, v) => onChange(items.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)));
    const move = (i, d) => {
        const j = i + d;
        if (j < 0 || j >= items.length) return;
        const next = items.slice();
        [next[i], next[j]] = [next[j], next[i]];
        onChange(next);
        setOpen(j);
    };
    const titleOf = (it, i) => String(it[ctl.title_field] || it.title || it.name || it.text || it.label || (it.product_id ? `Product #${it.product_id}` : `Item ${i + 1}`)).slice(0, 34);

    return (
        <div className="space-y-1.5">
            {items.map((it, i) => (
                <div key={i} className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
                    <div className="flex items-center gap-1 px-2 h-8 cursor-pointer" onClick={() => setOpen(open === i ? -1 : i)}>
                        <span className="flex-1 truncate text-[12px] font-medium text-slate-700 dark:text-slate-200">{titleOf(it, i)}</span>
                        <button type="button" title="Move up" className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={(e) => { e.stopPropagation(); move(i, -1); }}><ChevronUp size={13} /></button>
                        <button type="button" title="Move down" className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={(e) => { e.stopPropagation(); move(i, 1); }}><ChevronDown size={13} /></button>
                        <button type="button" title="Duplicate" className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={(e) => { e.stopPropagation(); onChange([...items.slice(0, i + 1), { ...it }, ...items.slice(i + 1)]); }}><Copy size={13} /></button>
                        <button type="button" title="Remove" className="p-1 text-slate-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); onChange(items.filter((_, idx) => idx !== i)); }}><Trash2 size={13} /></button>
                    </div>
                    {open === i && (
                        <div className="px-2 pb-2 pt-1 space-y-2.5 border-t border-slate-200 dark:border-slate-700">
                            {ctl.fields.map((f) => {
                                if (f.if && !Object.entries(f.if).every(([k, vals]) => vals.some((v) => (typeof v === "boolean" ? !!it[k] === v : String(it[k] ?? "") === String(v))))) return null;
                                return (
                                    <div key={f.key}>
                                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">{f.label}</div>
                                        <ControlInput ctl={f} value={it[f.key] ?? f.default} onChange={(v) => update(i, f.key, v)} ctx={ctx} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
            <button type="button" className={`${btnCls} w-full gap-1.5`} onClick={() => { onChange([...items, { ...(ctl.item_default || {}) }]); setOpen(items.length); }}>
                <Plus size={14} /> Add item
            </button>
        </div>
    );
}

function CodeEditor({ ctl, value, onChange, node, placeholder }) {
    const [fullscreen, setFullscreen] = useState(false);
    const textareaRef = useRef(null);
    const fsTextareaRef = useRef(null);
    const [copied, setCopied] = useState(false);

    // Current language from node or control
    const lang = node?.content?.language || (ctl.language === "css" ? "css" : ctl.language === "html" ? "html" : "code");

    const insertSnippet = (snippet, cursorOffset = 0, isFs = false) => {
        const ta = isFs ? fsTextareaRef.current : textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart ?? (value || "").length;
        const end = ta.selectionEnd ?? (value || "").length;
        const text = value || "";
        const next = text.slice(0, start) + snippet + text.slice(end);
        onChange(next);
        setTimeout(() => {
            ta.focus();
            const pos = start + snippet.length + cursorOffset;
            ta.setSelectionRange(pos, pos);
        }, 10);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const text = value || "";
            if (e.shiftKey) {
                const lineStart = text.lastIndexOf("\n", start - 1) + 1;
                if (text.slice(lineStart, lineStart + 2) === "  ") {
                    const next = text.slice(0, lineStart) + text.slice(lineStart + 2);
                    onChange(next);
                    setTimeout(() => {
                        ta.setSelectionRange(Math.max(lineStart, start - 2), Math.max(lineStart, end - 2));
                    }, 0);
                }
            } else {
                const next = text.slice(0, start) + "  " + text.slice(end);
                onChange(next);
                setTimeout(() => {
                    ta.setSelectionRange(start + 2, start + 2);
                }, 0);
            }
        } else if (e.key === "Enter") {
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const text = value || "";
            const lineStart = text.lastIndexOf("\n", start - 1) + 1;
            const currentLine = text.slice(lineStart, start);
            const match = currentLine.match(/^\s+/);
            if (match && match[0]) {
                e.preventDefault();
                const indent = "\n" + match[0];
                const next = text.slice(0, start) + indent + text.slice(start);
                onChange(next);
                setTimeout(() => {
                    ta.setSelectionRange(start + indent.length, start + indent.length);
                }, 0);
            }
        }
    };

    const copyCode = () => {
        if (!value) return;
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const linesCount = (value || "").split("\n").length;
    const charsCount = (value || "").length;

    const renderSnippets = (isFs = false) => (
        <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-0.5">Snippets:</span>
            <button
                type="button"
                onClick={() => insertSnippet("<?php \n\n?>", -3, isFs)}
                className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                title="Insert PHP block"
            >
                &lt;?php ?&gt;
            </button>
            <button
                type="button"
                onClick={() => insertSnippet("{{  }}", -3, isFs)}
                className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                title="Insert Blade echo"
            >
                &#123;&#123; &#125;&#125;
            </button>
            <button
                type="button"
                onClick={() => insertSnippet('<div class="">\n  \n</div>', -8, isFs)}
                className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                title="Insert HTML container"
            >
                &lt;div&gt;
            </button>
            <button
                type="button"
                onClick={() => insertSnippet("<style>\n  \n</style>", -10, isFs)}
                className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                title="Insert CSS style block"
            >
                &lt;style&gt;
            </button>
            <button
                type="button"
                onClick={() => insertSnippet("<script>\n  \n</script>", -11, isFs)}
                className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                title="Insert JavaScript script block"
            >
                &lt;script&gt;
            </button>
        </div>
    );

    return (
        <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-900 text-slate-100 overflow-hidden shadow-sm">
            {/* Header bar */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-800/90 border-b border-slate-700 text-xs">
                <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 font-mono text-[10px] font-semibold uppercase tracking-wider">
                        {lang}
                    </span>
                    <span className="text-[11px] text-slate-400">
                        {linesCount} {linesCount === 1 ? "line" : "lines"} · {charsCount} chars
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={copyCode}
                        title="Copy code"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFullscreen(true)}
                        title="Expand to Fullscreen Editor"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <Maximize2 size={13} />
                    </button>
                </div>
            </div>

            {/* Snippets quick bar */}
            <div className="px-2 py-1 bg-slate-800/40 border-b border-slate-700/60 overflow-x-auto">
                {renderSnippets(false)}
            </div>

            {/* Textarea */}
            <textarea
                ref={textareaRef}
                spellCheck={false}
                className="w-full min-h-[160px] p-2.5 bg-slate-950 font-mono text-[12px] leading-relaxed text-slate-100 placeholder:text-slate-600 focus:outline-none resize-y"
                rows={9}
                value={value ?? ""}
                placeholder={placeholder || (lang === "php" ? "<?php\n  // PHP / Blade dynamic code\n  echo 'Hello';\n?>" : lang === "css" ? "selector {\n  color: red;\n}" : "<!-- HTML, PHP, CSS or JS -->")}
                onKeyDown={handleKeyDown}
                onChange={(e) => onChange(e.target.value)}
            />

            {/* Fullscreen modal */}
            {fullscreen && (
                <div className="fixed inset-0 z-[1000] flex flex-col bg-slate-950/90 backdrop-blur-sm p-4 sm:p-6" onClick={() => setFullscreen(false)}>
                    <div className="flex flex-col flex-1 max-w-5xl w-full mx-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700 text-sm">
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                                    Custom Code Editor
                                </span>
                                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[11px] font-semibold uppercase">
                                    {lang}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {linesCount} lines · {charsCount} characters
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={copyCode}
                                    className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5"
                                >
                                    {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFullscreen(false)}
                                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5"
                                >
                                    <Check size={14} /> Done
                                </button>
                            </div>
                        </div>

                        <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 overflow-x-auto">
                            {renderSnippets(true)}
                        </div>

                        <textarea
                            ref={fsTextareaRef}
                            autoFocus
                            spellCheck={false}
                            className="flex-1 w-full p-4 bg-slate-950 font-mono text-[13px] leading-relaxed text-slate-100 placeholder:text-slate-600 focus:outline-none resize-none"
                            value={value ?? ""}
                            placeholder={placeholder || (lang === "php" ? "<?php\n  // PHP / Blade dynamic code\n  echo 'Hello';\n?>" : lang === "css" ? "selector {\n  color: red;\n}" : "<!-- HTML, PHP, CSS or JS -->")}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => onChange(e.target.value)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

/** The actual editor for one value. `onChange(undefined)` clears the value. */
export function ControlInput({ ctl, value, onChange, ctx, placeholder, node, onPicked }) {
    switch (ctl.type) {
        case "textarea":
            return <textarea className={`${inputCls} h-auto py-1.5 resize-y`} rows={ctl.rows || 3} value={value ?? ""} placeholder={placeholder || ctl.placeholder} onChange={(e) => onChange(e.target.value)} />;
        case "code":
            return <CodeEditor ctl={ctl} value={value} onChange={onChange} node={node} placeholder={placeholder} />;
        case "richtext":
            return <RichText key={node?.id} value={value} onChange={onChange} />;
        case "number":
            return <input type="number" className={inputCls} min={ctl.min} max={ctl.max} step={ctl.step || 1} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} />;
        case "slider":
            return (
                <div className="flex items-center gap-2">
                    <input type="range" className="flex-1 accent-blue-600" min={ctl.min ?? 0} max={ctl.max ?? 100} step={ctl.step || 1} value={value ?? ctl.min ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
                    <span className="w-10 text-right text-xs tabular-nums text-slate-500">{value ?? "-"}</span>
                </div>
            );
        case "select":
            return (
                <select className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
                    {!ctl.options.some((o) => o.value === "") && <option value="">{placeholder || "Default"}</option>}
                    {ctl.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            );
        case "choose":
            return (
                <div className="flex rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden">
                    {ctl.options.map((o) => {
                        const active = String(value ?? placeholder ?? ctl.default ?? "") === o.value;
                        const Icon = o.value === "left" ? AlignLeft : o.value === "center" ? AlignCenter : o.value === "right" ? AlignRight : null;
                        return (
                            <button key={o.value} type="button" title={o.label} onClick={() => onChange(value === o.value ? undefined : o.value)} className={`flex-1 h-8 text-xs font-medium ${active ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"} border-r last:border-r-0 border-slate-300 dark:border-slate-600 flex items-center justify-center`}>
                                {Icon ? <Icon size={14} /> : o.label}
                            </button>
                        );
                    })}
                </div>
            );
        case "switch":
            return (
                <button type="button" role="switch" aria-checked={!!(value ?? ctl.default)} onClick={() => onChange(!(value ?? ctl.default))} className={`relative w-10 h-5 rounded-full transition-colors ${(value ?? ctl.default) ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(value ?? ctl.default) ? "translate-x-5" : ""}`} />
                </button>
            );
        case "color":
            return <ColorInput value={value} onChange={onChange} />;
        case "image":
            return <ImageInput value={value} onChange={onChange} ctx={ctx} onPicked={onPicked} />;
        case "product":
            return <ProductInput value={value} onChange={onChange} ctx={ctx} />;
        case "icon":
            return <IconPicker value={value} onChange={onChange} ctx={ctx} />;
        case "dimensions":
            return <DimensionsInput value={value} onChange={onChange} placeholderBox={typeof placeholder === "object" ? placeholder : undefined} />;
        case "repeater":
            return <RepeaterInput ctl={ctl} value={value} onChange={onChange} ctx={ctx} />;
        case "datetime":
            return <input type="datetime-local" className={inputCls} value={(value || "").slice(0, 16)} onChange={(e) => onChange(e.target.value)} />;
        case "url":
            return <input className={inputCls} type="text" inputMode="url" value={value ?? ""} placeholder={ctl.placeholder || "https://"} onChange={(e) => onChange(e.target.value)} />;
        default:
            return <input className={inputCls} value={value ?? ""} placeholder={typeof placeholder === "string" ? placeholder : ctl.placeholder} onChange={(e) => onChange(e.target.value)} />;
    }
}

// ---------------------------------------------------------------------------------------------
// Labelled field bound to a node (handles content/settings storage + responsive values)
// ---------------------------------------------------------------------------------------------

export function ControlField({ ctl, node, ctx }) {
    const schemaEl = ctx.schema.elements[node.type];
    if (!isVisible(ctl, node, schemaEl)) return null;

    const stored = ctl.store === "content" ? node.content?.[ctl.key] : node.settings?.[ctl.key];
    const device = ctx.device;
    let shown = stored;
    let placeholder;

    if (ctl.responsive) {
        shown = ownValue(stored, device);
        const inherited = effectiveValue(stored, device);
        if (device !== "desktop" && isEmptyVal(shown)) placeholder = inherited;
        // a legacy plain scalar/box behaves as the desktop value
    } else if (isEmptyVal(stored) && ctl.default !== undefined) {
        shown = ctl.default;
    }

    const write = (v) => {
        if (ctl.store === "content") ctx.setContent(node.id, ctl.key, v);
        else ctx.setSetting(node.id, ctl.key, v, device, ctl.responsive);
    };

    const onPicked = (m) => {
        if (node.type === "image" && ctl.key === "image") {
            if (m.width) ctx.setContent(node.id, "image_width", String(m.width));
            if (m.height) ctx.setContent(node.id, "image_height", String(m.height));
            if (m.alt && !node.content?.alt) ctx.setContent(node.id, "alt", m.alt);
        }
    };

    const DevIcon = ctl.responsive ? deviceIcon[device] : null;
    const inline = ctl.type === "switch";

    return (
        <div className={inline ? "flex items-center justify-between gap-3" : ""}>
            <div className={`flex items-center gap-1.5 ${inline ? "" : "mb-1"}`}>
                <label className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{ctl.label}</label>
                {DevIcon && <DevIcon size={12} className="text-slate-400" title={`Applies to ${device}`} />}
            </div>
            <ControlInput ctl={ctl} value={shown} onChange={write} ctx={ctx} placeholder={placeholder} node={node} onPicked={onPicked} />
            {ctl.help && !inline ? <p className="mt-1 text-[11px] text-slate-400 leading-snug">{ctl.help}</p> : null}
        </div>
    );
}

export { DEVICES };
