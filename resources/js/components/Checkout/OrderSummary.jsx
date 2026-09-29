import { FiPlus, FiMinus, FiTrash2 } from "react-icons/fi";

export default function OrderSummary({
    cartItems,
    totals,
    summary,
    data,
    updateQuantity,
    removeItem,
    processingId,
}) {
    return (
        <div className="bg-white font-hindSiliguri rounded-xl shadow-sm border p-3 sm:p-6 sticky top-8">
            <h3 className="font-bold text-lg mb-4">অর্ডার লিস্ট</h3>

            <div className="space-y-4 mb-6">
                {cartItems.map((item) => {
                    // Logic to check if we hit the stock limit
                    const isLimitReached = item.quantity >= item.stock;

                    return (
                        <div
                            key={item.id}
                            className={`flex gap-3 border-b pb-4 ${processingId === item.id ? "opacity-50" : ""}`}
                        >
                            <img
                                src={item.image}
                                className="w-16 h-16 object-contain bg-gray-50 rounded"
                            />

                            <div className="flex-1">
                                <h4 className="text-sm font-bold line-clamp-1">
                                    {item.name}
                                </h4>

                                {/* Quantity Controls */}
                                <div className="flex flex-col gap-1 mt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center border rounded bg-gray-50">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.id,
                                                        item.quantity - 1,
                                                    )
                                                }
                                                className="p-1 hover:bg-gray-200"
                                            >
                                                <FiMinus size={12} />
                                            </button>
                                            <span className="px-2 text-xs font-bold">
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={isLimitReached} // Disable when stock is full
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.id,
                                                        item.quantity + 1,
                                                    )
                                                }
                                                className={`p-1 transition-colors ${
                                                    isLimitReached
                                                        ? "text-gray-300 cursor-not-allowed"
                                                        : "hover:bg-gray-200 text-gray-900"
                                                }`}
                                            >
                                                <FiPlus size={12} />
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>

                                    {/* STOCK WARNING MESSAGE */}
                                    {isLimitReached && (
                                        <p className="text-[10px] text-orange-600 font-bold">
                                            দুঃখিত, মাত্র {item.stock} পিস স্টকে
                                            আছে
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-sm font-bold">
                                    TK{" "}
                                    {(
                                        item.price * item.quantity
                                    ).toLocaleString()}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                    TK {item.price} প্রতি পিস
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Totals Section */}
            <div className="space-y-2 font-poppins text-sm border-t pt-4">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>TK {totals.itemTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="text-green-600 font-hindSiliguri font-bold">
                        {data.delivery_area
                            ? `TK ${summary.deliveryFee}`
                            : "Area সিলেক্ট করুন"}
                    </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">
                        TK {summary.grandTotal.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
