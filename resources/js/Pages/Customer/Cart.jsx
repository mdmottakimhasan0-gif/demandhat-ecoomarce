import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import CustomerLayout from "@/Layouts/CustomerLayouts/CustomerLayout";
import { FiTrash2, FiPlus, FiMinus, FiArrowRight } from "react-icons/fi";

const Cart = ({ cartItems = [], totals = {} }) => {
    const [processingId, setProcessingId] = useState(null);

    // Handlers
    const updateQuantity = (id, newQty) => {
        if (newQty < 1) return;
        setProcessingId(id);

        router.patch(
            `/cart/update/${id}`,
            { quantity: newQty },
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const removeItem = (id) => {
        if (!confirm("Are you sure you want to remove this item?")) return;
        router.delete(`/cart/remove/${id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Shopping Cart" />

            <div className="pb-4 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 mt-6">
                <h1 className="text-xl sm:text-2xl font-bold font-poppins text-gray-900 mb-6">
                    Shopping cart{" "}
                    <span className="text-gray-500 text-lg font-normal">
                        ({cartItems.length} Items)
                    </span>
                </h1>

                {cartItems.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-gray-500 font-poppins text-xl mb-4">
                            Your cart is empty.
                        </p>
                        <Link
                            href="/"
                            className="text-white bg-[#059669] hover:bg-[#047857] px-6 py-2 rounded-lg font-semibold transition-colors"
                        >
                            Go Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* LEFT COLUMN: Cart Items */}
                        <div className="w-full lg:w-2/3">
                            <div className="bg-white rounded-lg shadow-sm border border-green-600/30 overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {cartItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`p-4 flex flex-col border sm:grid sm:grid-cols-12 gap-4 items-center transition-opacity duration-200 ${processingId === item.id ? "opacity-50" : ""}`}
                                        >
                                            {/* Product Image & Details (Col Span 6) */}
                                            <div className="col-span-6 w-full flex items-center gap-4">
                                                <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden border border-gray-200">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="font-medium sm:font-bold text-gray-900 text-base line-clamp-2">
                                                        {item.name}
                                                    </h3>

                                                    {/* Unit Price Display Logic */}
                                                    <div className="flex items-center flex-wrap gap-2 mt-1">
                                                        <span className="text-gray-500 text-xs uppercase tracking-wider">
                                                            Unit Price:
                                                        </span>
                                                        {/* Discounted Price */}
                                                        <span className="font-bold text-gray-900">
                                                            TK{" "}
                                                            {item.price.toLocaleString()}
                                                        </span>

                                                        {/* Original Price (Strikethrough) - If different */}
                                                        {item.original_price >
                                                            item.price && (
                                                            <span className="text-xs text-gray-400 line-through">
                                                                TK{" "}
                                                                {item.original_price.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Line Total (Col Span 2) */}
                                            <div className="col-span-2 w-full sm:w-auto flex justify-between sm:justify-center items-center">
                                                <div className="sm:hidden text-gray-500 text-sm">
                                                    Total:
                                                </div>
                                                <span className="font-bold text-lg text-gray-900">
                                                    TK{" "}
                                                    {(
                                                        item.price *
                                                        item.quantity
                                                    ).toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Quantity (Col Span 3) */}
                                            <div className="col-span-3 w-full sm:w-auto flex justify-between sm:justify-center items-center">
                                                <div className="flex items-center border border-gray-300 rounded-md bg-white">
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.id,
                                                                item.quantity -
                                                                    1,
                                                            )
                                                        }
                                                        className="p-2 hover:bg-gray-100 text-gray-600 transition-colors rounded-l-md"
                                                    >
                                                        <FiMinus size={14} />
                                                    </button>
                                                    <span className="w-10 text-center text-sm font-semibold text-gray-900">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.id,
                                                                item.quantity +
                                                                    1,
                                                            )
                                                        }
                                                        className="p-2 hover:bg-gray-100 text-gray-600 transition-colors rounded-r-md"
                                                    >
                                                        <FiPlus size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Remove Action (Col Span 1) */}
                                            <div className="col-span-1 w-full sm:w-auto flex justify-end sm:justify-center">
                                                <button
                                                    onClick={() =>
                                                        removeItem(item.id)
                                                    }
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                    title="Remove item"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                            {/* <div className="w-full h-1 bg-black my-2 sm:hidden"></div> */}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Sidebar */}
                        <div className="w-full lg:w-1/3 flex flex-col gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-green-600/50 p-6 lg:sticky lg:top-20">
                                {/* Red Notice as per screenshot */}
                                <h3 className="font-medium text-lg text-red-500 mb-6 text-center">
                                    (ডেলিভারি ফি বাদে )
                                </h3>

                                <div className="space-y-4 pb-6 border-b border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium text-lg">
                                            Subtotal
                                        </span>
                                        <span className="font-bold text-2xl text-gray-900">
                                            TK{" "}
                                            {totals.itemTotal?.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Optional: Show delivery info text if needed */}
                                    <p className="text-xs text-gray-400 text-right italic">
                                        *পরের পেজে ডেলিভারি ফি হিসেব করা হবে
                                    </p>
                                </div>

                                <div className="mt-6">
                                    <Link
                                        href="/checkout"
                                        className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold py-4 rounded-lg flex justify-center items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                                    >
                                        Checkout
                                        <FiArrowRight size={20} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

Cart.layout = (page) => <CustomerLayout children={page} />;
export default Cart;
