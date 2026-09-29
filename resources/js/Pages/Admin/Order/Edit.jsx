import React from "react";
import { useForm, Link } from "@inertiajs/react";
import {
    FiArrowLeft,
    FiSave,
    FiUser,
    FiMapPin,
    FiCreditCard,
} from "react-icons/fi";
import AdminLayout from "../../../Layouts/AdminLayouts/AdminLayout";

export default function Edit({ order }) {
    // 1. Initialize Form with all existing order data
    const { data, setData, patch, processing, errors } = useForm({
        name: order.name || "",
        email: order.email || "",
        phone: order.phone || "",
        address: order.address || "",
        subtotal: order.subtotal || 0,
        delivery_fee: order.delivery_fee || 0,
        grand_total: order.grand_total || 0,
        order_status: order.order_status || "pending",
        payment_status: order.payment_status || "pending",
    });

    // 2. Handle Price Changes and Auto-calculate Grand Total
    const handlePriceChange = (field, value) => {
        const numericValue = parseFloat(value) || 0;

        // We use a functional update to ensure we have the latest state for calculation
        setData((prev) => {
            const updatedData = { ...prev, [field]: numericValue };
            // Calculate new grand total based on the updated subtotal or delivery fee
            updatedData.grand_total =
                (parseFloat(updatedData.subtotal) || 0) +
                (parseFloat(updatedData.delivery_fee) || 0);
            return updatedData;
        });
    };

    // 3. Form Submission
    const handleSubmit = (e) => {
        e.preventDefault();
        patch(`/admin/orders/${order.id}/update`, {
            onSuccess: () => {
                // You can add a toast notification here if you have one
            },
        });
    };

    return (
        <div className="pb-10 font-poppins">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/orders"
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400 transition-colors"
                    >
                        <FiArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Edit Order #{order.id}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Update customer details, pricing, and status.
                        </p>
                    </div>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* LEFT COLUMN: Customer & Address Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-2 mb-6 text-blue-600 font-semibold">
                            <FiUser /> <span>Customer Information</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Customer Name
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData("phone", e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                />
                                {errors.phone && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-2 mb-6 text-green-600 font-semibold">
                            <FiMapPin /> <span>Shipping Address</span>
                        </div>
                        <textarea
                            rows="4"
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-green-500 outline-none dark:text-white"
                            placeholder="Full delivery address..."
                        ></textarea>
                        {errors.address && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.address}
                            </p>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Status & Pricing */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Status Card */}
                    <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Order Status
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Order Workflow
                                </label>
                                <select
                                    value={data.order_status}
                                    onChange={(e) =>
                                        setData("order_status", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="processing">
                                        Processing
                                    </option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Payment Status
                                </label>
                                <select
                                    value={data.payment_status}
                                    onChange={(e) =>
                                        setData(
                                            "payment_status",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary Card */}
                    <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center gap-2 mb-6 text-purple-600 font-semibold">
                            <FiCreditCard /> <span>Payment Summary</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Subtotal (৳)
                                </label>
                                <input
                                    type="number"
                                    value={data.subtotal}
                                    onChange={(e) =>
                                        handlePriceChange(
                                            "subtotal",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Delivery Fee (৳)
                                </label>
                                <input
                                    type="number"
                                    value={data.delivery_fee}
                                    onChange={(e) =>
                                        handlePriceChange(
                                            "delivery_fee",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">
                                    Grand Total
                                </span>
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    ৳{parseFloat(data.grand_total).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                        >
                            <FiSave size={18} />
                            {processing ? "Saving Changes..." : "Update Order"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

Edit.layout = (page) => <AdminLayout children={page} />;
