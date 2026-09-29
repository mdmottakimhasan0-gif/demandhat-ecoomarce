import React from "react";
import { Link } from "@inertiajs/react";
import { FiAlertCircle, FiPackage, FiClock } from "react-icons/fi";

export default function ActionCenter({ actions }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Pending Orders */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full">
                        <FiClock />
                    </div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                        Pending Orders
                    </h4>
                </div>
                <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {actions.pending_orders}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                        Orders need processing
                    </p>
                    <Link
                        href="/admin/orders?status=pending"
                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                        View All &rarr;
                    </Link>
                </div>
            </div>

            {/* Out of Stock */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 text-red-600 rounded-full">
                        <FiAlertCircle />
                    </div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                        Out of Stock
                    </h4>
                </div>
                <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {actions.out_of_stock}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                        Products unavailable
                    </p>
                    <Link
                        href="/admin/products"
                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                        Manage Inventory &rarr;
                    </Link>
                </div>
            </div>

            {/* Low Stock List */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <FiPackage className="text-orange-500" /> Low Stock
                        Alert
                    </h4>
                </div>
                <div className="overflow-y-auto max-h-[120px] pr-2 custom-scrollbar">
                    {actions.low_stock.length > 0 ? (
                        <ul className="space-y-3">
                            {actions.low_stock.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex justify-between items-center text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={
                                                `storage/${item.image}` ||
                                                "/placeholder.png"
                                            }
                                            className="w-8 h-8 rounded object-cover bg-gray-100"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300 truncate w-32">
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">
                                        Left: {item.stock}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                            Inventory looks good!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
