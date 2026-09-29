import React, { useEffect } from "react"; // 1. Added useEffect
import { useForm } from "@inertiajs/react";
import { FiX, FiTruck } from "react-icons/fi";

export default function CourierModal({ isOpen, onClose, order }) {
    if (!isOpen || !order) return null;

    const { data, setData, post, processing, reset, errors } = useForm({
        note: "",
        invoice: "",
    });

    // 2. Pre-fill the invoice field when the modal opens
    useEffect(() => {
        if (order) {
            setData("invoice", order.id.toString());
        }
    }, [order]);

    const handleSteadfast = (e) => {
        e.preventDefault();
        post(`/admin/courier/steadfast/${order.id}`, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed font-hindSiliguri inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-800">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <FiTruck className="text-blue-600" /> Courier Service
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-4 p-3 text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                        <p>
                            <strong>Customer:</strong> {order.name}
                        </p>
                        <p>
                            <strong>Payable:</strong> ৳
                            {parseFloat(order.grand_total).toFixed(2)}
                        </p>
                    </div>

                    {/* Invoice ID Field */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold mb-1 dark:text-gray-300">
                            Invoice ID (Must be unique)
                        </label>
                        <input
                            type="text"
                            name="invoice"
                            className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-800 dark:text-white ${errors.invoice ? "border-red-500" : "dark:border-gray-700"}`}
                            value={data.invoice}
                            onChange={(e) => setData("invoice", e.target.value)}
                        />
                        {errors.invoice && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.invoice}
                            </p>
                        )}
                    </div>

                    {/* Note Field */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold mb-1 dark:text-gray-300">
                            Note
                        </label>
                        <textarea
                            name="note"
                            className="w-full px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                            rows="2"
                            placeholder="Optional instructions..."
                            value={data.note}
                            onChange={(e) => setData("note", e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleSteadfast}
                            disabled={processing}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all disabled:opacity-50"
                        >
                            {processing
                                ? "Processing..."
                                : "Create Steadfast Consignment"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2 text-sm text-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
