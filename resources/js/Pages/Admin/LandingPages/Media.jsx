import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Loader2, Search, Trash2, Upload } from "lucide-react";
import LandingLayout, { Card, Empty, btn, field } from "@/components/AdminComponents/Landing/LandingLayout";
import { api, errorInfo } from "@/landing-builder/api";

const BASE = "/admin/landing-pages/media";

export default function Media({ maxKb = 4096 }) {
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selected, setSelected] = useState(null);
    const input = useRef(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setItems((await api.get(`${BASE}/list`, { search: q || undefined })).data);
        } catch (e) {
            toast.error(errorInfo(e).message);
        } finally {
            setLoading(false);
        }
    }, [q]);

    useEffect(() => {
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [load]);

    const upload = async (files) => {
        setUploading(true);
        for (const file of Array.from(files)) {
            try {
                const res = await api.upload(BASE, file);
                setItems((cur) => [res.media, ...cur]);
            } catch (e) {
                toast.error(`${file.name}: ${errorInfo(e).message}`);
            }
        }
        setUploading(false);
    };

    const saveAlt = async (m, alt) => {
        try {
            await api.patch(`${BASE}/${m.id}`, { alt });
            setItems((cur) => cur.map((x) => (x.id === m.id ? { ...x, alt } : x)));
            setSelected((cur) => (cur && cur.id === m.id ? { ...cur, alt } : cur));
            toast.success("Alt text saved");
        } catch (e) {
            toast.error(errorInfo(e).message);
        }
    };

    const remove = async (m) => {
        if (!confirm(`Delete "${m.original_name}"? Pages that use it will show a broken image.`)) return;
        try {
            await api.delete(`${BASE}/${m.id}`);
            setItems((cur) => cur.filter((x) => x.id !== m.id));
            setSelected(null);
        } catch (e) {
            toast.error(errorInfo(e).message);
        }
    };

    return (
        <LandingLayout
            title="Media library"
            actions={
                <>
                    <input ref={input} type="file" multiple hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
                    <button className={btn.primary} onClick={() => input.current.click()} disabled={uploading}>
                        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload
                    </button>
                </>
            }
        >
            <div className="grid lg:grid-cols-[1fr_320px] gap-5">
                <Card className="p-4" >
                    <div className="relative max-w-sm mb-4">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className={`${field} pl-9`} placeholder="Search files" value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }} className="min-h-[300px]">
                        {loading ? (
                            <div className="py-20 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
                        ) : items.length ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-3">
                                {items.map((m) => (
                                    <button key={m.id} onClick={() => setSelected(m)} className={`rounded-lg overflow-hidden border-2 text-left ${selected?.id === m.id ? "border-blue-600" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"}`}>
                                        <div className="aspect-square bg-slate-100 dark:bg-slate-900"><img src={m.url} alt={m.alt || ""} loading="lazy" className="w-full h-full object-cover" /></div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <Empty>No images yet. Drop files here or use Upload. JPEG, PNG or WEBP up to {Math.round(maxKb / 1024)} MB.</Empty>
                        )}
                    </div>
                </Card>

                <Card className="p-4 h-fit">
                    {selected ? (
                        <div className="space-y-3">
                            <img src={selected.url} alt="" className="w-full rounded-lg border border-slate-200 dark:border-slate-800" />
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-100 break-all">{selected.original_name}</div>
                            <div className="text-xs text-slate-500">{selected.width} x {selected.height}px - {(selected.size / 1024).toFixed(0)} KB - {selected.mime}</div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Alt text</label>
                                <input key={selected.id} className={`${field} mt-1`} defaultValue={selected.alt || ""} onBlur={(e) => e.target.value !== (selected.alt || "") && saveAlt(selected, e.target.value)} placeholder="Describe the image" />
                            </div>
                            <div className="flex gap-2">
                                <button className={btn.outline} onClick={() => { navigator.clipboard?.writeText(window.location.origin + selected.url); toast.success("URL copied"); }}><Copy size={14} /> Copy URL</button>
                                <button className={btn.danger} onClick={() => remove(selected)}><Trash2 size={14} /> Delete</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">Select an image to see its details.</p>
                    )}
                </Card>
            </div>
        </LandingLayout>
    );
}
