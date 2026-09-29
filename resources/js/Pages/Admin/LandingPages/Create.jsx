import React, { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import { Check, FileText, Loader2 } from "lucide-react";
import LandingLayout, { Card, btn, field } from "@/components/AdminComponents/Landing/LandingLayout";

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function Create({ templates = [], categories = [], selectedTemplate = null }) {
    const { data, setData, post, processing, errors } = useForm({ title: "", slug: "", template_id: selectedTemplate });
    const [touched, setTouched] = useState(false);
    const [cat, setCat] = useState("");

    useEffect(() => {
        if (!touched) setData("slug", slugify(data.title));
    }, [data.title]);

    const shown = templates.filter((t) => !cat || t.category === cat);

    return (
        <LandingLayout title="Create landing page">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    post("/admin/landing-pages");
                }}
                className="grid lg:grid-cols-3 gap-5"
            >
                <Card className="p-5 space-y-4 lg:col-span-1 h-fit">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Page title</label>
                        <input autoFocus className={field} value={data.title} onChange={(e) => setData("title", e.target.value)} placeholder="USA Lead Campaign" />
                        {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">URL slug</label>
                        <div className="flex items-center">
                            <span className="h-9 px-2.5 inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
                                {window.location.host}/
                            </span>
                            <input
                                className={`${field} rounded-l-none`}
                                value={data.slug}
                                onChange={(e) => {
                                    setTouched(true);
                                    setData("slug", slugify(e.target.value));
                                }}
                                placeholder="usa-offer"
                            />
                        </div>
                        {errors.slug && <p className="text-xs text-red-600 mt-1">{errors.slug}</p>}
                        <p className="text-[11px] text-slate-400 mt-1">Lowercase letters, numbers and dashes. Names used by the website (about, cart, admin...) are reserved.</p>
                    </div>
                    <button disabled={processing || !data.title} className={`${btn.primary} w-full justify-center`}>
                        {processing ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Create &amp; open builder
                    </button>
                </Card>

                <div className="lg:col-span-2">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mr-2">Start from</h3>
                        <select className={`${field} w-48`} value={cat} onChange={(e) => setCat(e.target.value)}>
                            <option value="">All categories</option>
                            {categories.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => setData("template_id", null)}
                            className={`text-left rounded-xl border-2 p-4 h-32 flex flex-col justify-between ${!data.template_id ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/20" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"}`}
                        >
                            <FileText size={22} className="text-slate-400" />
                            <div>
                                <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">Blank page</div>
                                <div className="text-xs text-slate-500">Start from scratch</div>
                            </div>
                        </button>
                        {shown.map((t) => (
                            <button
                                type="button"
                                key={t.id}
                                onClick={() => setData("template_id", t.id)}
                                className={`text-left rounded-xl border-2 p-4 h-32 flex flex-col justify-between relative ${data.template_id === t.id ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/20" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"}`}
                            >
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t.category}</span>
                                <div>
                                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{t.name}</div>
                                    <div className="text-xs text-slate-500 line-clamp-2">{t.description}</div>
                                </div>
                                {data.template_id === t.id && <Check size={16} className="absolute top-3 right-3 text-blue-600" />}
                            </button>
                        ))}
                    </div>
                    {!templates.length && (
                        <p className="text-xs text-slate-400 mt-3">
                            No templates yet. Run <code>php artisan db:seed --class=LandingPageTemplatesSeeder</code> to add the starter set.
                        </p>
                    )}
                </div>
            </form>
        </LandingLayout>
    );
}
