import { router, Head } from "@inertiajs/react";
import CustomerLayout from "../../Layouts/CustomerLayouts/CustomerLayout";
import React, { useMemo } from "react";

function CustomerOrders({ orders = [] }) {
    // Logic: Sort orders by date descending (Newest First)
    // We use useMemo to prevent resorting on every re-render, though not strictly necessary for small lists
    const sortedOrders = useMemo(() => {
        return [...orders].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
    }, [orders]);

    const showOrderedItem = (id) => {
        if (id) {
            router.visit(`orderedItem/${id}`);
        }
    };

    return (
        <div className="px-4 md:px-6 py-8 mb-24">
            <Head title="Your Orders" />
            <div className="max-w-[1200px] mx-auto">
                {/* Page Title */}
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        Your Orders
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Track your recent purchases and order details
                    </p>
                </div>

                {/* Orders Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-[#6d9b5e] uppercase tracking-wider text-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {sortedOrders.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-10 text-center text-gray-500"
                                        >
                                            You haven’t placed any orders yet.
                                        </td>
                                    </tr>
                                )}

                                {sortedOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        onClick={() =>
                                            showOrderedItem(order.id)
                                        }
                                        className="cursor-pointer transition hover:bg-blue-100"
                                    >
                                        {/* Order ID */}
                                        <td className="px-6 hover:underline py-4 font-semibold text-blue-600">
                                            #{order.id}
                                        </td>

                                        {/* Payment Status */}
                                        <td className="px-6 py-4">
                                            <span
                                                className={`text-xs font-semibold px-3 py-1 rounded-full uppercase ${order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                                            >
                                                {order.payment_status}
                                            </span>
                                        </td>

                                        {/* Payment Method */}
                                        <td className="px-6 py-4 capitalize text-gray-800">
                                            {order.payment_method}
                                        </td>

                                        {/* Order Status */}
                                        <td className="px-6 py-4">
                                            <span
                                                className="text-xs font-semibold px-3 py-1 rounded-full uppercase bg-blue-100 text-blue-700"
                                            >
                                                {order.order_status}
                                            </span>
                                        </td>

                                        {/* Total */}
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            ৳
                                            {parseFloat(
                                                order.grand_total,
                                            ).toFixed(2)}
                                        </td>

                                        {/* Date */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(
                                                order.created_at,
                                            ).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-500">
                        Click on any order to view details
                    </div>
                </div>
            </div>
        </div>
    );
}

CustomerOrders.layout = (page) => <CustomerLayout children={page} />;
export default CustomerOrders;
