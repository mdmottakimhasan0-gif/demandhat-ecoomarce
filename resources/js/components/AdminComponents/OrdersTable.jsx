import React from "react";
import { Link, router } from "@inertiajs/react";
import {
    FiEdit2,
    FiPrinter,
    FiEye,
    FiChevronUp,
    FiChevronDown,
    FiShield,
    FiTruck,
} from "react-icons/fi";

export default function OrdersTable({
    orders,
    filters,
    onEditStatus,
    onCheckFraud,
    onSendCourier,
}) {
    const sortBy = filters?.sort_by || "created_at";
    const sortOrder = filters?.sort_order || "desc";

    const handleSort = (field) => {
        const newOrder =
            sortBy === field && sortOrder === "asc" ? "desc" : "asc";

        // Merge current filters with new sort
        const params = { ...filters, sort_by: field, sort_order: newOrder };

        router.get("/admin/orders", params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field)
            return <span className="text-gray-400 ml-1">⇅</span>;
        return sortOrder === "asc" ? (
            <FiChevronUp className="inline ml-1" />
        ) : (
            <FiChevronDown className="inline ml-1" />
        );
    };

    const truncateAddress = (address) => {
        if (!address) return "";
        if (address.length <= 30) return address;
        return <span title={address}>{address.substring(0, 30)}...</span>;
    };

    const getStatusBadge = (status, type) => {
        const statusColors = {
            payment: {
                paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                pending:
                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                refunded:
                    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            },
            order: {
                pending:
                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                processing:
                    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                shipped:
                    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
                delivered:
                    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                cancelled:
                    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            },
        };
        const colorClass =
            type === "payment"
                ? statusColors.payment[status]
                : statusColors.order[status];
        return (
            <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
            >
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-300 text-xs uppercase font-semibold">
                        <tr>
                            <th
                                className="p-2 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                                onClick={() => handleSort("id")}
                            >
                                Order
                                <SortIcon field="id" />
                            </th>
                            <th className="p-2 border-b dark:border-gray-800">
                                Customer
                            </th>
                            <th className="p-2 border-b dark:border-gray-800 text-center">
                                Count
                            </th>
                            <th className="p-2 border-b dark:border-gray-800">
                                Phone
                            </th>
                            <th className="p-2 border-b dark:border-gray-800">
                                Address
                            </th>
                            <th
                                className="p-2 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                                onClick={() => handleSort("payment_status")}
                            >
                                Payment <SortIcon field="payment_status" />
                            </th>
                            <th className="p-2 border-b dark:border-gray-800">
                                Method
                            </th>
                            <th
                                className="p-2 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                                onClick={() => handleSort("order_status")}
                            >
                                Order Status <SortIcon field="order_status" />
                            </th>
                            <th
                                className="p-2 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                                onClick={() => handleSort("grand_total")}
                            >
                                Total <SortIcon field="grand_total" />
                            </th>
                            <th
                                className="p-2 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                                onClick={() => handleSort("created_at")}
                            >
                                Date <SortIcon field="created_at" />
                            </th>
                            <th className="p-2 border-b dark:border-gray-800 text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {orders.data.map((order) => (
                            <tr
                                key={order.id}
                                className="hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors"
                            >
                                <td className="p-2 py-2  text-sm font-medium text-gray-800 dark:text-gray-200">
                                    #{order.id}
                                </td>
                                <td className="p-2 py-2 text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-800 dark:text-gray-200">
                                            {order.name}
                                        </span>
                                        {order.user_id && (
                                            <Link
                                                href={`/admin/customers/${order.user_id}/profile`}
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                View Profile
                                            </Link>
                                        )}
                                    </div>
                                </td>

                                <td className="p-2 py-2 text-center">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            order.order_count > 1
                                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" // Highlights returning customers
                                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                        }`}
                                        title={`This customer has made ${order.order_count} order(s)`}
                                    >
                                        {order.order_count}
                                    </span>
                                </td>

                                <td className="p-2 py-2 text-sm text-gray-600 dark:text-gray-400">
                                    {order.phone}
                                </td>
                                <td className="p-2 py-2 text-sm text-gray-600 dark:text-gray-400">
                                    {truncateAddress(order.address)}
                                </td>
                                <td className="p-2 py-2">
                                    {getStatusBadge(
                                        order.payment_status,
                                        "payment",
                                    )}
                                </td>
                                <td className="p-2 py-2 text-sm text-gray-600 dark:text-gray-400 capitalize">
                                    {order.payment_method}
                                </td>

                                {/* UPDATED: Order Status Column with Auth info */}
                                <td className="p-2 py-2">
                                    {getStatusBadge(
                                        order.order_status,
                                        "order",
                                    )}

                                    {/* NEW: Authorized By Tag */}
                                    {order.authorized_by &&
                                        order.authorizer && (
                                            <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                <span>✓ Auth by:</span>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                    {order.authorizer.name}
                                                </span>
                                            </div>
                                        )}

                                    {/* Courier Consignment Tag */}
                                    {(order.courier_name || order.courier_consignment_id || order.courier_invoice_id) && (
                                        <div className="mt-1">
                                            <span
                                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                    order.courier_name === "pathao"
                                                        ? "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
                                                        : "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                                                }`}
                                                title={`Courier: ${order.courier_name || "Steadfast"} | CID: ${order.courier_consignment_id || order.courier_invoice_id}`}
                                            >
                                                <FiTruck size={10} />
                                                {order.courier_name || "Steadfast"}: #{order.courier_consignment_id || order.courier_invoice_id}
                                            </span>
                                        </div>
                                    )}
                                </td>

                                <td className="p-2 py-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                                    ৳{parseFloat(order.grand_total).toFixed(2)}
                                </td>
                                <td className="p-2 py-2 text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(
                                        order.created_at,
                                    ).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </td>
                                <td className="p-2 py-2 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onCheckFraud(order)}
                                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-red-600 dark:text-red-400 transition-colors"
                                            title="Check Fraud Risks"
                                        >
                                            <FiShield size={16} />
                                        </button>

                                        <button
                                            onClick={() => onSendCourier(order)}
                                            className={`p-2 rounded transition-colors ${
                                                order.courier_consignment_id || order.courier_name
                                                    ? "bg-green-50 hover:bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400"
                                                    : "hover:bg-gray-100 dark:hover:bg-slate-800 text-blue-500 dark:text-blue-300"
                                            }`}
                                            title={
                                                order.courier_name
                                                    ? `Booked with ${order.courier_name} (${order.courier_consignment_id || order.courier_invoice_id})`
                                                    : "Send to Courier"
                                            }
                                        >
                                            <FiTruck size={16} />
                                        </button>

                                        <Link
                                            href={`/admin/orders/${order.id}/details`}
                                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-green-600 dark:text-green-400 transition-colors"
                                            title="View Details"
                                        >
                                            <FiEye size={16} />
                                        </Link>
                                        <button
                                            onClick={() => onEditStatus(order)}
                                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors"
                                            title="Edit Status"
                                        >
                                            <FiEdit2 size={16} />
                                        </button>
                                        <a
                                            href={`/admin/orders/${order.id}/invoice`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-purple-600 dark:text-purple-400 transition-colors"
                                            title="Print Invoice"
                                        >
                                            <FiPrinter size={16} />
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.data.length === 0 && (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        No orders found.
                    </div>
                )}
            </div>
        </div>
    );
}
