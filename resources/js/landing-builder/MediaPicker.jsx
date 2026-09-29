import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, Upload, X } from "lucide-react";
import { api, errorInfo } from "./api";

/** Modal media library: search, upload (validated server side) and select. */
export default function MediaPicker({ open, onClose, onSelect, listUrl, uploadUrl }) {
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const input = useRef(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(listUrl, { search: q || undefined });
            setItems(res.data || []);
        } catch (e) {
            setError(errorInfo(e).message);
        } finally {
            setLoading(false);
        }
    }, [listUrl, q]);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(load, 200);
        return () => clearTimeout(t);
    }, [open, load]);

    const upload = async (files) => {
        setError("");
        setUploading(true);
        for (const file of Array.from(files)) {
            try {
                setProgress(0);
                const res = await api.upload(uploadUrl, file, setProgress);
                setItems((cur) => [res.media, ...cur]);
            } catch (e) {
                setError(`${file.name}: ${errorInfo(e).message}`);
            }
        }
        setUploading(false);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="w-full max-w-3xl h-[80vh] flex flex-col rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Media library</h3>
                    <div className="relative flex-1 max-w-xs">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-full h-8 pl-8 pr-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-100" />
                    </div>
                    <button type="button" onClick={() => input.current?.click()} className="ml-auto h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60" disabled={uploading}>
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} {uploading ? `${progress}%` : "Upload"}
                    </button>
                    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
                    <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={18} /></button>
                </div>
                {error && <div className="mx-4 mt-3 px-3 py-2 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm">{error}</div>}
                <div className="flex-1 overflow-y-auto p-4" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) upload(e.dataTransfer.files); }}>
                    {loading && !items.length ? (
                        <div className="h-full flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
                    ) : items.length ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {items.map((m) => (
                                <button key={m.id} type="button" onClick={() => { onSelect(m); onClose(); }} className="group text-left rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow">
                                    <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                                        <img src={m.url} alt={m.alt || ""} loading="lazy" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="px-2 py-1.5 text-[11px] truncate text-slate-600 dark:text-slate-300">{m.original_name}</div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                            <Upload size={28} className="opacity-60" />
                            <p>No images yet. Drop files here or click Upload.</p>
                            <p className="text-xs">JPEG, PNG or WEBP</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
