import React, { useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import CustomerLayout from "@/Layouts/CustomerLayouts/CustomerLayout";
import ReactPixel from "react-facebook-pixel";

const OrderSuccess = ({ order, recommended = [] }) => {
    // ── Analytics ─────────────────────────────────────────────────────
    useEffect(() => {
        if (order && order.items) {
            const uniqueEventId = `purchase_${order.id}`;
            ReactPixel.track(
                "Purchase",
                {
                    content_name: "Order #" + order.id,
                    content_ids: order.items.map((i) => i.product_id || i.id),
                    content_type: "product",
                    value: order.total_amount || order.grand_total,
                    currency: "BDT",
                },
                { eventID: uniqueEventId },
            );
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ ecommerce: null });
            window.dataLayer.push({
                event: "purchase",
                event_id: uniqueEventId,
                ecommerce: {
                    transaction_id: order.id,
                    value: order.total_amount || order.grand_total,
                    currency: "BDT",
                    shipping: order.delivery_fee || 0,
                    items: order.items.map((item) => ({
                        item_id: item.product_id || item.id,
                        item_name: item.name || "Product",
                        price: item.price,
                        quantity: item.quantity,
                    })),
                },
            });
        }
    }, [order]);

    const orderDate = new Date(
        order.created_at || Date.now(),
    ).toLocaleDateString("en-BD", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const steps = [
        { label: "অর্ডার গৃহীত", done: true },
        { label: "প্রস্তুত হচ্ছে", done: false },
        { label: "কুরিয়ারে", done: false },
        { label: "ডেলিভারি", done: false },
    ];

    return (
        <div className="bg-[#F7FAF7] min-h-screen font-hindSiliguri">
            <Head title="Order Confirmed — Demand Bazar" />

            {/* ── Hero confirmation band ────────────────────────────── */}
            <div className="bg-gradient-to-br from-[#059669] to-[#4a6b41] text-white">
                <div className="max-w-2xl mx-auto px-4 pt-14 pb-16 text-center">
                    {/* Checkmark ring */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 mb-5">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight leading-tight mb-3">
                        অর্ডার নিশ্চিত হয়েছে
                    </h1>
                    <p className="text-white/80 text-base leading-relaxed max-w-sm mx-auto">
                        আপনার ক্রয়ের জন্য ধন্যবাদ। অর্ডারটি সফলভাবে গ্রহণ করা
                        হয়েছে।
                    </p>

                    {/* Order ID pill */}
                    <div className="inline-flex items-center gap-2 mt-5 bg-white/15 border border-white/25 rounded-full px-4 py-1.5">
                        <span className="text-xs text-white/70">অর্ডার নং</span>
                        <span className="text-sm font-bold text-white">
                            #{order.id}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Body ─────────────────────────────────────────────── */}
            <div className="max-w-2xl mx-auto px-4 -mt-6 pb-24 space-y-5">

                {/* ── 2. Order Summary Card ─────────────────────────── */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                    {/* Card accent bar */}
                    <div className="h-1 bg-gradient-to-r from-[#059669] to-[#8ab87a]" />

                    <div className="px-6 py-5">
                        <h2 className="text-xs font-bold text-[#059669] uppercase tracking-widest mb-4">
                            অর্ডার সারসংক্ষেপ
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mb-5">
                            {[
                                { label: "অর্ডার নম্বর", value: `#${order.id}` },
                                { label: "তারিখ", value: orderDate },
                                {
                                    label: "পেমেন্ট",
                                    value:
                                        order.payment_method === "cod"
                                            ? "Cash on Delivery"
                                            : order.payment_method ||
                                              "Cash on Delivery",
                                },
                                {
                                    label: "মোট মূল্য",
                                    value: `৳ ${Math.round(order.grand_total).toLocaleString("en-BD")}`,
                                    highlight: true,
                                },
                            ].map((row, i) => (
                                <div
                                    key={i}
                                    className="bg-[#F7FAF7] rounded-xl px-4 py-3"
                                >
                                    <p className="text-[11px] text-[#6B7280] mb-1">
                                        {row.label}
                                    </p>
                                    <p
                                        className={`text-sm font-bold ${row.highlight ? "text-[#059669] text-base" : "text-[#111827]"}`}
                                    >
                                        {row.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Ordered Items */}
                        {order.items && order.items.length > 0 && (
                            <div className="border-t border-[#F0F0F0] pt-4 space-y-2">
                                <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-3">
                                    অর্ডারকৃত পণ্য
                                </p>
                                {order.items.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex justify-between items-center text-sm"
                                    >
                                        <span className="text-[#374151]">
                                            {item.product_name || item.name}
                                            <span className="text-[#9CA3AF] ml-1.5">
                                                × {item.quantity}
                                            </span>
                                        </span>
                                        <span className="font-semibold text-[#111827]">
                                            ৳{" "}
                                            {Math.round(
                                                item.price * item.quantity,
                                            ).toLocaleString("en-BD")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── 3. Fulfillment Timeline ───────────────────────── */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm px-6 py-5">
                    <h2 className="text-xs font-bold text-[#059669] uppercase tracking-widest mb-5">
                        ডেলিভারি অগ্রগতি
                    </h2>

                    <div className="relative">
                        {/* Track line */}
                        <div className="absolute top-3 left-3 right-3 h-0.5 bg-[#E5E7EB] rounded-full" />
                        {/* Active segment */}
                        <div className="absolute top-3 left-3 w-[12.5%] h-0.5 bg-[#059669] rounded-full" />

                        <div className="relative grid grid-cols-4 gap-2">
                            {steps.map((step, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col items-center text-center"
                                >
                                    <div
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mb-2 relative z-10 transition-all ${
                                            step.done
                                                ? "border-[#059669] bg-[#059669] shadow-[0_0_0_3px_rgba(101,140,88,0.18)]"
                                                : "border-[#E5E7EB] bg-white"
                                        }`}
                                    >
                                        {step.done && (
                                            <svg
                                                className="w-3 h-3 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <span
                                        className={`text-[10px] leading-tight font-medium ${step.done ? "text-[#059669]" : "text-[#9CA3AF]"}`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── 4. Trust / Reassurance Section ───────────────── */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 bg-[#059669]/8 border-b border-[#059669]/15 px-6 py-4">
                        <div className="w-2 h-2 rounded-full bg-[#059669]" />
                        <p className="text-sm font-semibold text-[#059669]">
                            পরবর্তী ধাপ
                        </p>
                    </div>
                    <ul className="px-6 py-5 space-y-3">
                        {[
                            "আমাদের টিম শীঘ্রই আপনার অর্ডার নিশ্চিত করতে কল করবে।",
                            "আনুমানিক ডেলিভারি সময়: ১–৩ কার্যদিবস।",
                            "ডেলিভারির সময় ফোন সচল রাখুন।",
                        ].map((text, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#059669]/50 shrink-0" />
                                <span className="text-sm text-[#374151] leading-relaxed">
                                    {text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ── 5. Recommended Products ───────────────────────── */}
                {recommended && recommended.length > 0 && (
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                        <div className="flex items-baseline justify-between mb-4">
                            <h2 className="text-xs font-bold text-[#059669] uppercase tracking-widest">
                                আপনার পছন্দ হতে পারে
                            </h2>
                            <Link
                                href="/productspage"
                                className="text-xs text-[#059669] hover:underline font-semibold"
                            >
                                সব দেখুন →
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {recommended.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.id}`}
                                    className="group border border-[#E5E7EB] rounded-xl overflow-hidden hover:border-[#059669]/50 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="aspect-square bg-[#F7FAF7] overflow-hidden">
                                        <img
                                            src={`/storage/${product.image}`}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </div>
                                    <div className="p-2.5">
                                        <p className="text-xs font-medium text-[#111827] truncate leading-tight mb-1">
                                            {product.name}
                                        </p>
                                        <p className="text-xs font-bold text-[#059669]">
                                            ৳{" "}
                                            {Math.round(
                                                product.price,
                                            ).toLocaleString("en-BD")}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 6. Action Buttons ─────────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/productspage"
                        className="flex-1 text-center px-6 py-3.5 rounded-xl font-semibold text-sm bg-[#059669] hover:bg-[#047857] text-white transition-colors shadow-sm hover:shadow-md"
                    >
                        কেনাকাটা চালিয়ে যান
                    </Link>
                    <Link
                        href="/categories"
                        className="flex-1 text-center px-6 py-3.5 rounded-xl font-semibold text-sm border border-[#059669] text-[#059669] hover:bg-[#059669] hover:text-white transition-all bg-white"
                    >
                        সব ক্যাটাগরি দেখুন
                    </Link>
                </div>

                {/* ── 7. Support Section ────────────────────────────── */}
                <div className="text-center py-6">
                    <p className="text-sm text-[#6B7280] mb-1.5">
                        সাহায্যের প্রয়োজন?
                    </p>
                    <a
                        href="tel:01898385395"
                        className="text-base font-bold text-[#059669] hover:underline"
                    >
                        01898385395
                    </a>
                </div>
            </div>
        </div>
    );
};

OrderSuccess.layout = (page) => <CustomerLayout children={page} />;
export default OrderSuccess;
