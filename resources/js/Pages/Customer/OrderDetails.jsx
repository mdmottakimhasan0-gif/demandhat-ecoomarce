import React from "react";
import { Head, useForm } from "@inertiajs/react";
import CustomerLayout from "@/Layouts/CustomerLayouts/CustomerLayout";

function OrderDetails({ order }) {
    // --- Configuration ---
    const brandColor = "#4f46e5";

    // Status Logic
    const steps = ["Pending", "Processing", "Shipped", "Delivered"];

    // Normalize status from DB (order_status) to find current step index
    const getCurrentStepIndex = (status) => {
        if (!status) return 0;
        const normalized = status.toLowerCase();
        if (normalized === "pending") return 0;
        if (normalized === "processing") return 1;
        if (normalized === "shipped") return 2;
        if (normalized === "delivered") return 3;
        return 0;
    };

    const currentStep = getCurrentStepIndex(order.order_status);

    // Cancel Logic
    const { post, processing } = useForm();

    // const handleCancel = () => {
    //     if (confirm("Are you sure you want to cancel this order?")) {
    //         // Adjust route name as per your web.php
    //         post(route("orders.cancel", order.id));
    //     }
    // };

    // Logic: Cancel available only if order is Pending AND payment is Pending
    const isOrderPending = order.order_status?.toLowerCase() === "pending";
    const isPaymentPending = order.payment_status?.toLowerCase() === "pending";
    const canCancel = isOrderPending && isPaymentPending;

    // Helper for Date Formatting
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Calculate Tentative Date (Example: Created + 4 days)
    const tentativeDate = new Date(
        new Date(order.created_at).getTime() + 4 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString("en-GB"); // DD/MM/YYYY format

    return (
        <div className="w-full py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <Head title={`Order #${order.id}`} />

            {/* --- Main White/Dark Container --- */}
            <div className="max-w-[1200px] mx-auto sm:px-5 md:px-10 shadow-2xl border rounded-lg overflow-hidden transition-colors duration-300">
                {/* 1. Header Section */}
                <div className="p-6 border-b border-green-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            Order #{order.id}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {formatDate(order.created_at)}
                        </p>
                    </div>
                    <div>
                        <span
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm uppercase font-mono font-semibold text-white shadow-sm`}
                            style={{ backgroundColor: brandColor }}
                        >
                            {order.order_status}
                        </span>
                    </div>
                </div>

                {/* 2. Timeline / Stepper */}
                <div className="p-6 border-b border-gray-200 overflow-x-auto">
                    <h2 className="text-lg font-semibold mb-8 text-[#059669]">
                        Timeline
                    </h2>

                    <div className="relative flex items-center justify-between w-full min-w-[300px] mb-8">
                        {/* Background Line */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-0 transform -translate-y-1/2"></div>

                        {/* Active Progress Line */}
                        <div
                            className="absolute top-1/2 left-0 h-1 -z-0 transform -translate-y-1/2 transition-all duration-500"
                            style={{
                                width: `${
                                    (currentStep / (steps.length - 1)) * 100
                                }%`,
                                backgroundColor: brandColor,
                            }}
                        ></div>

                        {steps.map((step, index) => {
                            const isActive = index <= currentStep;
                            return (
                                <div
                                    key={step}
                                    className="relative z-10 flex flex-col items-center"
                                >
                                    <div
                                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-4 transition-colors duration-300 ${isActive ? "bg-white" : "bg-gray-200 border-gray-200"}`}
                                        style={
                                            isActive
                                                ? {
                                                      borderColor: brandColor,
                                                      backgroundColor:
                                                          brandColor,
                                                  }
                                                : {}
                                        }
                                    ></div>
                                    <span
                                        className={`absolute top-8 text-xs sm:text-sm font-medium whitespace-nowrap ${isActive ? "text-gray-900" : "text-gray-400"}`}
                                    >
                                        {step}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Timeline Logs (Mimicking PDF logs) */}
                    <div className="space-y-4 pt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center text-sm gap-2">
                            <span className="font-mono text-gray-500 w-48">
                                {formatDate(order.created_at)}
                            </span>
                            <div className="flex items-center">
                                <div
                                    className="h-4 w-0.5 mr-3"
                                    style={{ backgroundColor: brandColor }}
                                ></div>
                                <span className="font-medium text-gray-900">
                                    Order Placed
                                </span>
                            </div>
                        </div>
                        {/* If shipped, show shipped log example */}
                        {currentStep >= 2 && (
                            <div className="flex flex-col sm:flex-row sm:items-center text-sm gap-2">
                                <span className="font-mono text-gray-500 w-48">
                                    {formatDate(order.updated_at)}
                                </span>
                                <div className="flex items-center">
                                    <div
                                        className="h-4 w-0.5 mr-3"
                                        style={{ backgroundColor: brandColor }}
                                    ></div>
                                    <span className="font-medium text-gray-900">
                                        Order Shipped
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Product Summary */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold">
                            Product Summary
                        </h2>
                        {/* {canCancel && (
                            <button
                                onClick={handleCancel}
                                disabled={processing}
                                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
                            >
                                Cancel Order
                            </button>
                        )} */}
                    </div>

                    <div className="space-y-6">
                        {order.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col sm:flex-row gap-5"
                            >
                                {/* Product Image */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    {/* Assuming Product model has 'image' field, fallback to placeholder */}
                                    <img
                                        src={`/storage/${item.product.image}`}
                                        alt={item.product_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Item Details */}
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">
                                            {item.product_name}
                                        </h3>
                                        {/* Assuming vendor_name is on product, or hardcode as per PDF 'AM Gadgets' */}
                                        <p className="mt-1 text-sm text-gray-500">
                                            Sold by:{" "}
                                            <span className="text-gray-700 font-medium">
                                                {item.product?.vendor_name ||
                                                    "Unity Haven"}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="mt-3 flex justify-between items-end">
                                        <p className="text-sm text-gray-500 font-medium">
                                            Qty: {item.quantity}
                                        </p>
                                        <p className="text-lg text-indigo-600 font-bold">
                                            ৳ {item.price}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Subtotal Display */}
                    <div className="mt-6 text-right border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-500">
                            Subtotal:{" "}
                            <span className="font-medium text-gray-900 text-base">
                                ৳ {order.subtotal}
                            </span>
                        </p>
                    </div>
                </div>

                {/* 4. Order Summary (Financials) */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-200">
                    {/* Payment Information */}
                    <div>
                        <h2 className="text-lg font-semibold text-[#059669] mb-4">
                            Payment Information
                        </h2>
                        <div className="space-y-3">
                            <p className="text-sm text-gray-700">
                                <span className="font-bold block uppercase text-gray-900 mb-1">
                                    {order.payment_status}
                                </span>
                                The order was placed using{" "}
                                <span className="font-bold capitalize">
                                    {order.payment_method || "BDT"}.
                                </span>
                            </p>
                        </div>

                        <div className="mt-6">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Shipping & Handling Information
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Regular Delivery - Your order will be delivered
                                <br />
                                <span className="font-medium">
                                    Tentatively ({tentativeDate})
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Order Totals */}
                    <div>
                        <h2 className="text-lg text-[#059669] font-semibold mb-4">
                            Order Totals
                        </h2>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-medium">
                                    ৳ {order.subtotal}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Shipping & Handling</span>
                                <span className="font-medium">
                                    ৳ {order.delivery_fee}
                                </span>
                            </div>
                            <div className="border-t border-gray-200 my-2 pt-3 flex justify-between items-center">
                                <span className="font-bold text-gray-900">
                                    Grand Total
                                </span>
                                <span className="font-bold text-[#059669] text-xl">
                                    ৳ {order.grand_total}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Address Section */}
                {/* Since your model has fields directly on 'Order', we map them to both sections */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50">
                    {/* Billing Address */}
                    <div>
                        <h2 className="text-lg font-semibold text-[#059669] mb-4">
                            Billing Address
                        </h2>
                        <div className="text-sm text-gray-600 space-y-1.5 pl-1">
                            <p className="font-bold text-gray-900 text-base">
                                {order.name}
                            </p>
                            <p className="font-mono">{order.phone}</p>
                            <p>{order.email}</p>
                            <div className="mt-2 text-gray-500">
                                {order.address}
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                        <h2 className="text-lg font-semibold text-[#059669] mb-4">
                            Shipping Address
                        </h2>
                        <div className="text-sm text-gray-600 space-y-1.5 pl-1">
                            <p className="font-bold text-gray-900 text-base">
                                {order.name}
                            </p>
                            <p className="font-mono">{order.phone}</p>
                            <p>{order.email}</p>
                            <div className="mt-2 text-gray-500">
                                {order.address}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

OrderDetails.layout = (page) => <CustomerLayout children={page} />;
export default OrderDetails;
