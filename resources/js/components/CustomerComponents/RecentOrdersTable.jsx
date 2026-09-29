import React from "react";
import { Link, router } from "@inertiajs/react";
import { AlertCircle, ChevronRight, Package } from "lucide-react";

const RecentOrdersTable = ({ orders = [] }) => {
    // Navigation handler for table rows
    const handleRowClick = (id) => {
        router.get(`orderedItem/${id}`);
    };

    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {/* Header */}
            <div className="p-6 flex justify-between items-center border-b border-gray-50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Package size={20} className="text-[#059669]" />
                    সাম্প্রতিক অর্ডারসমূহ (Recent Orders)
                </h3>
                <p className="text-sm font-bold text-[#059669] px-3 py-1 bg-green-50 rounded-full transition-colors">
                    সব অর্ডার
                </p>
            </div>

            {/* Table Logic */}
            {orders.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-widest">
                                <th className="px-6 py-4 font-bold">
                                    Order ID
                                </th>
                                <th className="px-6 py-4 font-bold">Name</th>
                                <th className="px-6 py-4 font-bold">Address</th>
                                <th className="px-6 py-4 font-bold">Total</th>
                                <th className="px-6 py-4 font-bold">Date</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.slice(0, 5).map((order) => (
                                <tr
                                    key={order.id}
                                    onClick={() => handleRowClick(order.id)}
                                    className="hover:bg-green-50/40 cursor-pointer transition-all group"
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-gray-900 px-2 py-1 bg-gray-100 rounded group-hover:bg-[#059669] group-hover:text-white transition-colors">
                                            #{order.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                        {order.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <p
                                            className="truncate max-w-[180px]"
                                            title={order.address}
                                        >
                                            {order.address}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-[#059669]">
                                        Tk{" "}
                                        {Math.round(
                                            order.grand_total,
                                        ).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {new Date(
                                            order.created_at,
                                        ).toLocaleDateString("en-GB")}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-transparent group-hover:bg-white group-hover:shadow-sm transition-all">
                                            <ChevronRight
                                                size={18}
                                                className="text-gray-300 group-hover:text-[#059669]"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                        <AlertCircle className="text-gray-200" size={48} />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">
                        কোনো অর্ডার পাওয়া যায়নি
                    </h4>
                    <p className="text-gray-500 max-w-[250px] mx-auto mt-1">
                        আপনি এখনো কোনো অর্ডার করেননি। আমাদের চমৎকার পণ্যগুলো
                        দেখতে পারেন।
                    </p>
                    <Link
                        href="/productspage"
                        className="mt-6 px-6 py-2 bg-[#059669] text-white font-bold rounded-xl shadow-lg shadow-green-900/10 hover:bg-[#047857] transition-all"
                    >
                        শপিং শুরু করুন
                    </Link>
                </div>
            )}
        </div>
    );
};

export default RecentOrdersTable;
