import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { FiX, FiTruck, FiSend, FiCheckCircle, FiPackage, FiInfo, FiRefreshCw, FiExternalLink } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function CourierModal({ isOpen, onClose, order }) {
    if (!isOpen || !order) return null;

    const [selectedCourier, setSelectedCourier] = useState(
        order.courier_name === "pathao" ? "pathao" : "steadfast"
    );
    const [pathaoStores, setPathaoStores] = useState([]);
    const [isLoadingStores, setIsLoadingStores] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        courier: selectedCourier,
        invoice: order.courier_invoice_id || order.id.toString(),
        recipient_name: order.name || "",
        recipient_phone: order.phone || "",
        recipient_address: order.address || "",
        cod_amount: parseFloat(order.grand_total || 0).toFixed(2),
        note: "",

        // Pathao specific
        store_id: "",
        delivery_type: 48, // 48: Normal, 12: On Demand
        item_type: 2,      // 1: Document, 2: Parcel
        item_weight: 0.5,
        item_quantity: 1,
        item_description: `Order #${order.id}`,
        special_instruction: "",
    });

    useEffect(() => {
        if (order) {
            setData((prev) => ({
                ...prev,
                courier: selectedCourier,
                invoice: order.courier_invoice_id || order.id.toString(),
                recipient_name: order.name || "",
                recipient_phone: order.phone || "",
                recipient_address: order.address || "",
                cod_amount: parseFloat(order.grand_total || 0).toFixed(2),
                item_description: `Order #${order.id}`,
            }));
        }
    }, [order, selectedCourier]);

    // Fetch stores when Pathao is selected
    useEffect(() => {
        if (selectedCourier === "pathao" && pathaoStores.length === 0) {
            fetchStores();
        }
    }, [selectedCourier]);

    const fetchStores = async () => {
        setIsLoadingStores(true);
        try {
            const res = await axios.get("/admin/settings/courier-integration/pathao-stores");
            if (res.data.status === "success" && res.data.data?.length > 0) {
                setPathaoStores(res.data.data);
                const defaultStore = res.data.data.find((s) => s.is_default_store) || res.data.data[0];
                if (defaultStore) {
                    setData("store_id", defaultStore.store_id.toString());
                }
            }
        } catch (e) {
            // Silently allow manual entry if api not yet configured
        } finally {
            setIsLoadingStores(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/admin/courier/send/${order.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const isAlreadyShipped = !!order.courier_consignment_id || !!order.courier_invoice_id;

    return (
        <div className="fixed font-poppins inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-gray-200 dark:border-gray-800 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 sm:p-5 border-b dark:border-gray-800 bg-gray-50/80 dark:bg-slate-800/80 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <FiTruck size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold dark:text-white flex items-center gap-2">
                                Send Order #{order.id} to Courier
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Customer: <span className="font-semibold text-gray-700 dark:text-gray-300">{order.name}</span> ({order.phone})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-5 overflow-y-auto space-y-4">
                    {/* If Already Consigned Banner */}
                    {isAlreadyShipped && (
                        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold">
                                <FiInfo className="text-blue-600" />
                                <span>Previously Booked with Courier</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Courier:</span>{" "}
                                    <span className="font-bold uppercase text-blue-700 dark:text-blue-300">
                                        {order.courier_name || "Steadfast"}
                                    </span>
                                </div>
                                {order.courier_consignment_id && (
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">CID:</span>{" "}
                                        <span className="font-bold">{order.courier_consignment_id}</span>
                                    </div>
                                )}
                                {order.courier_tracking_code && (
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">Tracking:</span>{" "}
                                        <span className="font-bold">{order.courier_tracking_code}</span>
                                    </div>
                                )}
                                {order.courier_invoice_id && (
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">Invoice:</span>{" "}
                                        <span className="font-bold">{order.courier_invoice_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Courier Selector Tabs */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Select Courier Service
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCourier("steadfast");
                                    setData("courier", "steadfast");
                                }}
                                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                                    selectedCourier === "steadfast"
                                        ? "border-green-600 bg-green-50/50 dark:bg-green-950/20 text-green-900 dark:text-green-300 ring-2 ring-green-600/30 font-bold"
                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
                                }`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                                    <FiTruck size={18} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold">Steadfast Courier</div>
                                    <div className="text-[10px] text-gray-500 font-normal">Packzy Portal</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCourier("pathao");
                                    setData("courier", "pathao");
                                }}
                                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                                    selectedCourier === "pathao"
                                        ? "border-orange-600 bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-300 ring-2 ring-orange-600/30 font-bold"
                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
                                }`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                                    <FiSend size={18} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold">Pathao Courier</div>
                                    <div className="text-[10px] text-gray-500 font-normal">Merchant API</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <form id="courier-submit-form" onSubmit={handleSubmit} className="space-y-3.5">
                        {/* Common Fields */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Invoice / Tracking ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:text-white ${
                                        errors.invoice ? "border-red-500" : "dark:border-gray-700"
                                    }`}
                                    value={data.invoice}
                                    onChange={(e) => setData("invoice", e.target.value)}
                                    required
                                />
                                {errors.invoice && (
                                    <p className="text-red-500 text-[10px] mt-0.5">{errors.invoice}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    COD Amount (৳) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:text-white dark:border-gray-700"
                                    value={data.cod_amount}
                                    onChange={(e) => setData("cod_amount", e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Delivery Address <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows="2"
                                className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                value={data.recipient_address}
                                onChange={(e) => setData("recipient_address", e.target.value)}
                                required
                            />
                        </div>

                        {/* PATHAO SPECIFIC FIELDS */}
                        {selectedCourier === "pathao" && (
                            <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            Pickup Store
                                        </label>
                                        <button
                                            type="button"
                                            onClick={fetchStores}
                                            disabled={isLoadingStores}
                                            className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                                        >
                                            <FiRefreshCw className={isLoadingStores ? "animate-spin" : ""} size={10} />
                                            Refresh Stores
                                        </button>
                                    </div>

                                    {pathaoStores.length > 0 ? (
                                        <select
                                            className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                            value={data.store_id}
                                            onChange={(e) => setData("store_id", e.target.value)}
                                        >
                                            <option value="">— Select Store —</option>
                                            {pathaoStores.map((s) => (
                                                <option key={s.store_id} value={s.store_id}>
                                                    {s.store_name} ({s.store_address})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="Enter Store ID (or configure in Settings)"
                                            className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                            value={data.store_id}
                                            onChange={(e) => setData("store_id", e.target.value)}
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Delivery Type
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                            value={data.delivery_type}
                                            onChange={(e) => setData("delivery_type", Number(e.target.value))}
                                        >
                                            <option value={48}>Normal Delivery (48 hrs)</option>
                                            <option value={12}>On Demand Delivery (12 hrs)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Item Type
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                            value={data.item_type}
                                            onChange={(e) => setData("item_type", Number(e.target.value))}
                                        >
                                            <option value={2}>Parcel (Box / Package)</option>
                                            <option value={1}>Document</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Weight (KG)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.5"
                                            max="10"
                                            className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                            value={data.item_weight}
                                            onChange={(e) => setData("item_weight", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Quantity
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                            value={data.item_quantity}
                                            onChange={(e) => setData("item_quantity", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Special Instructions / Note */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Special Instructions / Note
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Call before delivery, handle with care"
                                className="w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                value={selectedCourier === "pathao" ? data.special_instruction : data.note}
                                onChange={(e) => {
                                    setData("note", e.target.value);
                                    setData("special_instruction", e.target.value);
                                }}
                            />
                        </div>
                    </form>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 flex gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 rounded-xl transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="courier-submit-form"
                        disabled={processing}
                        className={`flex-1 py-2.5 px-4 text-xs font-bold text-white rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 ${
                            selectedCourier === "pathao"
                                ? "bg-orange-600 hover:bg-orange-700"
                                : "bg-green-600 hover:bg-green-700"
                        }`}
                    >
                        {processing ? (
                            <>
                                <FiRefreshCw className="animate-spin" /> Submitting...
                            </>
                        ) : selectedCourier === "pathao" ? (
                            <>
                                <FiSend /> Submit to Pathao
                            </>
                        ) : (
                            <>
                                <FiTruck /> Submit to Steadfast
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
