import React from "react";
import { useForm } from "@inertiajs/react";
import { Check } from "lucide-react";
import LandingLayout, { Card, btn, field } from "@/components/AdminComponents/Landing/LandingLayout";

export default function Settings({ settings, widths = [], fonts = [], limits = {} }) {
    const { data, setData, put, processing, errors } = useForm({ container_width: settings.container_width, font_family: settings.font_family || "" });

    return (
        <LandingLayout title="Builder settings">
            <form onSubmit={(e) => { e.preventDefault(); put("/admin/landing-pages/settings", { preserveScroll: true }); }} className="max-w-3xl space-y-5">
                <Card className="p-5 space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Default container width (px)</label>
                        <div className="flex flex-wrap items-center gap-2">
                            {widths.map((w) => (
                                <button type="button" key={w} onClick={() => setData("container_width", w)} className={`h-9 px-3 rounded-lg text-sm border ${data.container_width === w ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}>{w}</button>
                            ))}
                            <input type="number" min={320} max={2400} className={`${field} w-28`} value={data.container_width} onChange={(e) => setData("container_width", Number(e.target.value))} />
                        </div>
                        {errors.container_width && <p className="text-xs text-red-600 mt-1">{errors.container_width}</p>}
                        <p className="text-xs text-slate-400 mt-1">Max width of boxed section content. Each page can override it.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Default font</label>
                        <select className={`${field} w-64`} value={data.font_family} onChange={(e) => setData("font_family", e.target.value)}>
                            <option value="">System UI (fastest)</option>
                            {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Web fonts are loaded from Google Fonts only on pages that use them.</p>
                    </div>
                    <button className={btn.primary} disabled={processing}><Check size={15} /> Save settings</button>
                </Card>

                <Card className="p-5 text-sm text-slate-600 dark:text-slate-300">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Limits (config/landing.php)</div>
                    <ul className="space-y-1">
                        <li>Media uploads: JPEG, PNG, WEBP up to <strong>{Math.round(limits.max_media_kb / 1024)} MB</strong></li>
                        <li>Published page cache: <strong>{limits.cache_ttl}s</strong></li>
                        <li>Versions kept per page: <strong>{limits.max_versions}</strong></li>
                        <li>Builder autosave: <strong>{limits.autosave_ms / 1000}s</strong> after the last change</li>
                    </ul>
                </Card>
            </form>
        </LandingLayout>
    );
}
