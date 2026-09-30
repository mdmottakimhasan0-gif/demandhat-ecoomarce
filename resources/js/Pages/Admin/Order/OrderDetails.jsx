import React from "react";
import { Link } from "@inertiajs/react";
import {
    FiArrowLeft,
    FiEdit2,
    FiPrinter,
    FiUser,
    FiMail,
    FiPhone,
    FiMapPin,
    FiCreditCard,
    FiPackage,
    FiCalendar,
    FiClock,
    FiTrendingUp
} from "react-icons/fi";
import AdminLayout from "../../../Layouts/AdminLayouts/AdminLayout";

export default function OrderDetails({ order }) {
    const getStatusBadge = (status, type) => {
        const statusColors = {
            payment: {
                paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
                pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
                failed: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50",
                refunded: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50",
            },
            order: {
                pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
                processing: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50",
                shipped: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/50",
                delivered: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
                cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50",
            },
        };

        const colorClass = type === "payment" 
            ? statusColors.payment[status] || "bg-gray-50 text-gray-700 border-gray-200"
            : statusColors.order[status] || "bg-gray-50 text-gray-700 border-gray-200";

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colorClass} transition-all shadow-sm`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    status === 'paid' || status === 'delivered' ? 'bg-emerald-500' :
                    status === 'pending' || status === 'processing' ? 'bg-amber-500' : 'bg-rose-500'
                }`}></span>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="pb-12 font-poppins text-gray-900 dark:text-gray-100">
            {/* Header Card Area */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm mb-6 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <Link
                            href="/admin/orders"
                            className="p-3 mt-1 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-all active:scale-95 shadow-sm border border-gray-100 dark:border-slate-700"
                        >
                            <FiArrowLeft size={18} />
                        </Link>
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                                    Order ID: <span className="text-blue-600 dark:text-blue-400 font-mono">#{order.id}</span>
                                </h1>
                                {getStatusBadge(order.order_status, "order")}
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                                <FiCalendar size={14} className="text-gray-400" />
                                {new Date(order.created_at).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                    </div>
                    
                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/admin/orders/${order.id}/edit`}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm font-semibold shadow-md shadow-blue-500/10 active:scale-95"
                        >
                            <FiEdit2 size={15} />
                            Update Status
                        </Link>
                        <a
                            href={`/admin/orders/${order.id}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 rounded-xl transition-all text-sm font-semibold active:scale-95 shadow-sm"
                        >
                            <FiPrinter size={15} className="text-purple-600" />
                            Print Invoice
                        </a>
                    </div>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Columns - Primary Content */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Order Items Table Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
                                    <FiPackage size={16} />
                                </span>
                                Ordered Products
                            </h2>
                            <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full font-bold">
                                {order.items ? order.items.length : 0} items
                            </span>
                        </div>

                        {/* Items list */}
                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                            {order.items && order.items.length > 0 ? (
                                order.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-bold text-[15px] text-gray-800 dark:text-gray-200 hover:text-blue-600 transition-colors">
                                                {item.product_name}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                                <span>Price: ৳{parseFloat(item.price).toFixed(2)}</span>
                                                <span className="text-gray-300 dark:text-slate-700">•</span>
                                                <span className="font-bold text-gray-700 dark:text-gray-300">Qty: {item.quantity}</span>
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <span className="font-mono font-bold text-base text-gray-900 dark:text-white">
                                                ৳{(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                    No items found in this order.
                                </p>
                            )}
                        </div>

                        {/* Pricing Summary Block */}
                        <div className="bg-gray-50/50 dark:bg-slate-900/30 p-6 border-t border-gray-100 dark:border-slate-800">
                            <div className="max-w-xs ml-auto space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                                    <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                                        ৳{parseFloat(order.subtotal).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Delivery Fee</span>
                                    <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                                        ৳{parseFloat(order.delivery_fee).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-base font-extrabold pt-3 border-t border-gray-200 dark:border-slate-700">
                                    <span className="text-gray-800 dark:text-gray-200">Grand Total</span>
                                    <span className="font-mono text-lg text-blue-600 dark:text-blue-400">
                                        ৳{parseFloat(order.grand_total).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information Cards */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                                <FiUser size={16} />
                            </span>
                            Customer Details
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Full Name Card */}
                            <div className="flex items-start gap-3 p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl border border-gray-100/50 dark:border-slate-800/50">
                                <span className="p-2.5 mt-0.5 bg-white dark:bg-slate-800 text-blue-500 dark:text-blue-400 rounded-lg shadow-sm">
                                    <FiUser size={16} />
                                </span>
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">Name</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-1">{order.name}</p>
                                    {order.user_id && (
                                        <Link
                                            href={`/admin/customers/${order.user_id}/profile`}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold mt-1.5 inline-block"
                                        >
                                            View Profile →
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Contact Number Card */}
                            <div className="flex items-start gap-3 p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl border border-gray-100/50 dark:border-slate-800/50">
                                <span className="p-2.5 mt-0.5 bg-white dark:bg-slate-800 text-teal-500 dark:text-teal-400 rounded-lg shadow-sm">
                                    <FiPhone size={16} />
                                </span>
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">Phone</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-1 font-mono">{order.phone}</p>
                                </div>
                            </div>

                            {/* Email Card */}
                            <div className="flex items-start gap-3 p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl border border-gray-100/50 dark:border-slate-800/50">
                                <span className="p-2.5 mt-0.5 bg-white dark:bg-slate-800 text-amber-500 dark:text-amber-400 rounded-lg shadow-sm">
                                    <FiMail size={16} />
                                </span>
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">Email</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-1 truncate max-w-[180px] md:max-w-none">{order.email || "No email provided"}</p>
                                </div>
                            </div>

                            {/* Address Card */}
                            <div className="flex items-start gap-3 p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl border border-gray-100/50 dark:border-slate-800/50 md:col-span-2">
                                <span className="p-2.5 mt-0.5 bg-white dark:bg-slate-800 text-rose-500 dark:text-rose-400 rounded-lg shadow-sm">
                                    <FiMapPin size={16} />
                                </span>
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">Delivery Address</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-1 leading-relaxed">{order.address}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Right Columns - Sidebars */}
                <div className="space-y-6">
                    
                    {/* Status Overview Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                                <FiTrendingUp size={16} />
                            </span>
                            Tracking Overview
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl border border-gray-100/50 dark:border-slate-800/50 flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Order Status</span>
                                {getStatusBadge(order.order_status, "order")}
                            </div>
                            <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl border border-gray-100/50 dark:border-slate-800/50 flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Payment Status</span>
                                {getStatusBadge(order.payment_status, "payment")}
                            </div>

                            {order.courier_name && (
                                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Courier</span>
                                        <span className="font-bold text-blue-700 dark:text-blue-300 uppercase">
                                            {order.courier_name}
                                        </span>
                                    </div>
                                    {order.courier_consignment_id && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Consignment ID</span>
                                            <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                                                {order.courier_consignment_id}
                                            </span>
                                        </div>
                                    )}
                                    {order.courier_tracking_code && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Tracking Code</span>
                                            <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                                                {order.courier_tracking_code}
                                            </span>
                                        </div>
                                    )}
                                    {order.courier_status && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Courier Status</span>
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                                                {order.courier_status}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment details Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                            <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
                                <FiCreditCard size={16} />
                            </span>
                            Payment Details
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-slate-800 pb-3">
                                <span className="text-gray-500 dark:text-gray-400 font-semibold">Payment Method</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">{order.payment_method}</span>
                            </div>
                            {order.transaction_id && (
                                <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
                                    <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">Transaction ID</span>
                                    <p className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg mt-1 border border-gray-100 dark:border-slate-800">
                                        {order.transaction_id}
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">Grand Amount</span>
                                <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                                    ৳{parseFloat(order.grand_total).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Order Timeline Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                            <span className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 rounded-xl">
                                <FiClock size={16} />
                            </span>
                            Activity Timeline
                        </h2>
                        
                        <div className="relative pl-6 border-l-2 border-gray-100 dark:border-slate-800 space-y-6 ml-2">
                            
                            {/* Step 1: Order Placed */}
                            <div className="relative">
                                <span className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full bg-blue-500 border-4 border-white dark:border-slate-900 shadow-sm"></span>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Order Placed Successfully</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">
                                        {new Date(order.created_at).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Step 2: Last Update (Conditional) */}
                            {order.updated_at !== order.created_at && (
                                <div className="relative">
                                    <span className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900 shadow-sm"></span>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Last System Update</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">
                                            {new Date(order.updated_at).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

OrderDetails.layout = (page) => <AdminLayout children={page} />;
