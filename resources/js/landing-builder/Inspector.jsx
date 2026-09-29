import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ArrowUpToLine, CheckCheck, Copy, Image, Monitor, MousePointer2, Plus, ShoppingBag, Smartphone, Sparkles, Tablet, Trash2 } from "lucide-react";
import { ElementIcon } from "./icons";
import { ControlField, ControlInput } from "./controls";
import { pathTo, walk } from "./tree";
import { api } from "./api";

const TABS = [["content", "Content"], ["style", "Style"], ["advanced", "Advanced"]];
const DEVICES = [["desktop", Monitor, "Desktop"], ["tablet", Tablet, "Tablet"], ["mobile", Smartphone, "Mobile"]];

/**
 * Per-device "show on this breakpoint" toggles, always visible for the selected element (not
 * buried in the Advanced tab). This is how a page can look different on mobile vs desktop -
 * hide a block on one device, show a different one in its place on the other. The device
 * you're currently previewing (the Desktop/Tablet/Mobile switch in the top bar) is ringed, so
 * it's clear which one you're looking at; toggling any of the three saves immediately, same
 * as every other style-panel edit.
 */
function DeviceVisibility({ node, ctx }) {
    const s = node.settings || {};
    return (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <span className="text-[11px] font-medium text-slate-400 mr-0.5">Show on</span>
            {DEVICES.map(([key, Icon, label]) => {
                const hidden = !!s["hide_" + key];
                const active = ctx.device === key;
                return (
                    <button
                        key={key}
                        type="button"
                        title={(hidden ? "Hidden on " : "Shown on ") + label + (active ? " (currently previewing)" : "") + " - click to toggle"}
                        onClick={() => ctx.setSetting(node.id, "hide_" + key, !hidden)}
                        className={`flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-medium border transition-colors ${
                            hidden
                                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-500"
                                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400"
                        } ${active ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-950" : ""}`}
                    >
                        <Icon size={13} className={hidden ? "opacity-50" : ""} />
                        {hidden && <span className="leading-none">off</span>}
                    </button>
                );
            })}
        </div>
    );
}

/** Right-hand panel: Content / Style / Advanced controls of the selected element. */
export default function Inspector({ schema, builder, ctx }) {
    const node = builder.selected?.node;
    const [tab, setTab] = useState("content");
    const el = node ? schema.elements[node.type] : null;

    const [linkedProduct, setLinkedProduct] = useState(null);
    const pid = builder.doc?.settings?.product_id;

    useEffect(() => {
        if (!pid) {
            setLinkedProduct(null);
            return;
        }
        let alive = true;
        api.get(ctx.productSearchUrl, { ids: pid }).then((res) => {
            if (alive && res && res[0]) {
                setLinkedProduct(res[0]);
            }
        }).catch(() => {});
        return () => { alive = false; };
    }, [pid, ctx.productSearchUrl]);

    // Check if an order_form exists anywhere on page
    const hasOrderForm = useMemo(() => {
        let found = false;
        walk(builder.sections, (n) => {
            if (n.type === "order_form") found = true;
        });
        return found;
    }, [builder.sections]);

    const hasCustomCode = useMemo(() => {
        let found = false;
        walk(builder.sections, (n) => {
            if (n.type === "custom_code") found = true;
        });
        return found;
    }, [builder.sections]);

    const replaceImagesInHtml = (code, allImages, product) => {
        if (!code || !allImages || !allImages.length) return code;
        let idx = 0;
        let updated = code.replace(/<img\b([^>]*)>/gi, (match, attrs) => {
            if (/(icon|logo|whatsapp|fb|facebook|badge|star|trust|arrow|svg|payment|cod|bkash|nagad|rocket|call|phone|delivery)/i.test(attrs)) {
                return match;
            }
            const newSrc = allImages[idx % allImages.length];
            idx++;
            if (/\bsrc=["'][^"']*["']/i.test(attrs)) {
                return '<img' + attrs.replace(/\bsrc=["'][^"']*["']/i, `src="${newSrc}"`) + '>';
            }
            return `<img src="${newSrc}" ${attrs}>`;
        });

        if (product) {
            updated = updated.replace(/\{product_name\}/g, product.name);
            updated = updated.replace(/\{product_price\}/g, '৳' + Number(product.price).toLocaleString('en-US'));
            updated = updated.replace(/\{product_original_price\}/g, '৳' + Number(product.original_price).toLocaleString('en-US'));
            if (product.discount) {
                updated = updated.replace(/\{product_discount\}/g, product.discount + '%');
            }
            updated = updated.replace(/\{product_image\}/g, `<img src="${allImages[0]}" class="lp-product-img" style="max-width:100%;height:auto;border-radius:8px;">`);
            updated = updated.replace(/\{product_image_url\}/g, allImages[0]);
        }

        return updated;
    };

    const applyProductImagesToCode = (targetNodeId = null) => {
        if (!linkedProduct || !linkedProduct.all_images?.length) {
            toast.error("Please select a product first.");
            return;
        }
        let count = 0;
        const processNodes = (nodes) => {
            nodes.forEach((n) => {
                if (n.type === "custom_code" && (!targetNodeId || n.id === targetNodeId)) {
                    const currentCode = n.content?.code || "";
                    const newCode = replaceImagesInHtml(currentCode, linkedProduct.all_images, linkedProduct);
                    if (newCode !== currentCode) {
                        builder.setContent(n.id, "code", newCode);
                        count++;
                    }
                }
                if (n.children && n.children.length) {
                    processNodes(n.children);
                }
            });
        };
        processNodes(builder.sections);
        if (count > 0) {
            toast.success("কোডের ছবিতে প্রোডাক্ট ও গ্যালারির ছবি সফলভাবে বসানো হয়েছে!");
        } else {
            toast.success("প্রোডাক্ট ও গ্যালারির ছবি সংযুক্ত করা হয়েছে!");
        }
    };

    const byTab = useMemo(() => {
        const out = { content: [], style: [], advanced: [] };
        (el?.controls || []).forEach((c) => out[c.tab]?.push(c));
        return out;
    }, [el]);

    // Fall back to a tab that has controls (e.g. spacer has no Style tab).
    useEffect(() => {
        if (el && !byTab[tab]?.length) setTab(TABS.find(([k]) => byTab[k].length)?.[0] || "content");
    }, [node?.id, el]);

    if (!node) {
        return (
            <div className="h-full overflow-y-auto p-4 space-y-4">
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <ShoppingBag size={16} className="text-blue-600" />
                        Featured Product (মূল পণ্য)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Select a store product. Its photo, title, and price will automatically connect to order forms, and orders will be submitted for it.
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="text-[12px] font-medium text-slate-600 dark:text-slate-300">Select Product</label>
                    <ControlInput
                        ctl={{ type: "product" }}
                        value={builder.doc?.settings?.product_id}
                        onChange={(v) => builder.setPageSetting("product_id", v)}
                        ctx={ctx}
                    />
                    <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                        Photo, price, and stock will automatically sync to all order forms on this page.
                    </p>
                </div>

                {linkedProduct && (
                    <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                            {linkedProduct.image ? (
                                <img src={linkedProduct.image} alt="" className="w-11 h-11 object-cover rounded-md border border-slate-200" />
                            ) : (
                                <div className="w-11 h-11 bg-slate-200 rounded-md" />
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold truncate text-slate-900 dark:text-slate-100">{linkedProduct.name}</div>
                                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">৳{Number(linkedProduct.price).toLocaleString()} · {linkedProduct.all_images?.length || 1} Images</div>
                            </div>
                        </div>

                        {linkedProduct.all_images?.length > 1 && (
                            <div>
                                <div className="text-[10px] uppercase font-semibold text-blue-800 dark:text-blue-300 tracking-wider mb-1">Gallery Images ({linkedProduct.all_images.length})</div>
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                    {linkedProduct.all_images.map((img, i) => (
                                        <img key={i} src={img} alt="" title="Click to copy image path" onClick={() => { navigator.clipboard?.writeText(img); toast.success("Copied image path!"); }} className="w-9 h-9 object-cover rounded border border-blue-200 hover:scale-105 cursor-pointer transition-transform" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {hasCustomCode && (
                            <button
                                type="button"
                                onClick={() => applyProductImagesToCode()}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                            >
                                <Sparkles size={14} /> কোডের ছবিতে প্রোডাক্ট ও গ্যালারির ছবি বসান
                            </button>
                        )}
                    </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    {hasOrderForm ? (
                        <div className="p-2.5 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-[11px] text-green-700 dark:text-green-300 font-medium flex items-center gap-1.5">
                            <CheckCheck size={15} className="text-green-600" />
                            পেজে অর্ডার ফর্ম যুক্ত আছে (কাস্টম বা বিল্ট-ইন ফর্ম)
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <div className="text-[11px] text-slate-500 leading-snug">
                                ℹ আপনার কাস্টম কোডে যদি ইতিমধ্যে অর্ডার ফর্ম থাকে, তবে আলাদা ফর্ম যোগ করার প্রয়োজন নেই।
                            </div>
                            <button
                                type="button"
                                onClick={() => builder.add("order_form")}
                                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded transition-colors"
                            >
                                <Plus size={13} /> + আলাদা অর্ডার ফর্ম ব্লক যোগ করুন (যদি প্রয়োজন হয়)
                            </button>
                        </div>
                    )}
                    <p className="text-[11px] text-center text-slate-400 pt-1">
                        Click any element on canvas to edit its properties.
                    </p>
                </div>
            </div>
        );
    }

    const parent = pathTo(builder.sections, node.id).slice(-1)[0];

    if (!el) {
        return (
            <div className="p-4 space-y-3">
                <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
                    <strong>Unsupported element</strong>
                    <p className="text-xs mt-1">"{node.type}" is not available in this version of the builder. You can safely remove it.</p>
                </div>
                <button className="h-8 px-3 rounded-md bg-red-600 text-white text-sm" onClick={() => builder.remove(node.id)}>Remove element</button>
            </div>
        );
    }

    // group by section preserving order
    const sections = [];
    (byTab[tab] || []).forEach((c) => {
        const name = c.section || "";
        let g = sections.find((s) => s.name === name);
        if (!g) sections.push((g = { name, items: [] }));
        g.items.push(c);
    });

    return (
        <div className="h-full flex flex-col min-h-0">
            <div className="flex items-center gap-2 px-3 h-11 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <ElementIcon type={node.type} size={16} className="text-blue-600" />
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{el.label}</div>
                </div>
                {parent && <button title="Select parent" onClick={() => builder.select(parent.id)} className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowUpToLine size={15} /></button>}
                <button title="Duplicate" onClick={() => builder.duplicate(node.id)} className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Copy size={15} /></button>
                <button title="Delete" onClick={() => builder.remove(node.id)} className="p-1.5 rounded text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"><Trash2 size={15} /></button>
            </div>

            <DeviceVisibility node={node} ctx={ctx} />

            <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
                {TABS.filter(([k]) => byTab[k].length).map(([k, label]) => (
                    <button key={k} onClick={() => setTab(k)} className={`flex-1 h-9 text-[12.5px] font-medium border-b-2 ${tab === k ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-5" key={node.id + tab}>
                {sections.map((g) => (
                    <div key={g.name} className="space-y-3">
                        {g.name && <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 pt-1 border-t first:border-t-0 first:pt-0 border-slate-200 dark:border-slate-800">{g.name}</div>}
                        {g.items.map((c) => <ControlField key={c.key} ctl={c} node={node} ctx={ctx} />)}
                    </div>
                ))}
            </div>
        </div>
    );
}
