import React from "react";
import { Link } from "@inertiajs/react";

export default function RecentActivity({ recentOrders, topProducts }) {
    const getStatusConfig = (status) => {
        switch (status) {
            case "pending":
                return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-400", dot: "bg-yellow-500" };
            case "delivered":
                return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" };
            case "cancelled":
                return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" };
            case "processing":
                return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" };
            default:
                return { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-400" };
        }
    };

    const maxRevenue = topProducts.length > 0
        ? Math.max(...topProducts.map((p) => parseFloat(p.revenue)))
        : 1;

    const rankColors = [
        "bg-yellow-400",
        "bg-gray-300",
        "bg-amber-600",
        "bg-[#059669]",
        "bg-[#059669]",
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Recent Orders ── */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-sm">🧾 Recent Orders</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Latest {recentOrders.length} orders placed</p>
                    </div>
                    <Link
                        href="/admin/orders"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        View All →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400">
                            <tr className="text-xs uppercase tracking-wider">
                                <th className="px-5 py-3 font-semibold">Order</th>
                                <th className="px-5 py-3 font-semibold">Customer</th>
                                <th className="px-5 py-3 font-semibold">Status</th>
                                <th className="px-5 py-3 font-semibold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {recentOrders.map((order) => {
                                const sc = getStatusConfig(order.order_status);
                                return (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">
                                            #{order.id}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-[#059669]/10 dark:bg-[#059669]/20 text-[#059669] dark:text-[#8ab87a] flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                                    {order.name?.charAt(0) || "?"}
                                                </div>
                                                <span className="text-gray-700 dark:text-gray-300 text-xs truncate max-w-[100px]">
                                                    {order.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                                {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-bold text-gray-900 dark:text-white">
                                            ৳{parseFloat(order.grand_total).toLocaleString("en-BD", { minimumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Top Selling Products ── */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white text-sm">🏆 Top Selling Products</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ranked by units sold in selected period</p>
                </div>

                <div className="p-5">
                    {topProducts.length > 0 ? (
                        <div className="space-y-4">
                            {topProducts.map((product, index) => {
                                const barWidth = Math.round((parseFloat(product.revenue) / maxRevenue) * 100);
                                return (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-6 h-6 rounded-full ${rankColors[index] || "bg-gray-200"} flex items-center justify-center text-white text-[10px] font-extrabold shrink-0`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-800 dark:text-white truncate max-w-[160px] sm:max-w-[220px]">
                                                        {product.product_name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                        {product.total_sold} units sold
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-[#059669] dark:text-[#8ab87a] shrink-0">
                                                ৳{parseFloat(product.revenue).toLocaleString("en-BD", { minimumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                        {/* Revenue bar */}
                                        <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#059669] rounded-full transition-all duration-500"
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500 gap-2">
                            <span className="text-3xl">📦</span>
                            <p className="text-sm font-medium">No sales data yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
