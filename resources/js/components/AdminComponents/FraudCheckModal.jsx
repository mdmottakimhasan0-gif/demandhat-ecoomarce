import React from "react";
import {
    FiX,
    FiShield,
    FiAlertTriangle,
    FiCheckCircle,
    FiPackage,
    FiXCircle,
    FiActivity,
} from "react-icons/fi";

export default function FraudCheckModal({
    isOpen,
    onClose,
    data,
    isLoading,
    phone,
}) {
    if (!isOpen) return null;

    // --- FIX STARTS HERE: Handle the API Wrapper ---
    // The API sends { status: "success", data: { summary: ... } }
    // We need to access data.data, not just data.
    const apiPayload = data?.data;
    const summary = apiPayload?.summary;
    // --- FIX ENDS HERE ---

    // Helper to determine risk level based on summary
    const getRiskAnalysis = (summary) => {
        if (!summary || summary.total_parcel === 0) {
            return {
                level: "NEW",
                color: "text-blue-600 bg-blue-50 border-blue-200",
                icon: <FiActivity className="text-blue-500" size={24} />,
                message: "New Customer. No delivery history found.",
                action: "Verify manually via phone call.",
            };
        }

        const ratio = summary.success_ratio;

        if (ratio >= 80) {
            return {
                level: "SAFE",
                color: "text-green-600 bg-green-50 border-green-200",
                icon: <FiCheckCircle className="text-green-500" size={24} />,
                message: "Highly Trusted. Excellent delivery history.",
                action: "Safe to ship via COD.",
            };
        } else if (ratio >= 50) {
            return {
                level: "AVERAGE",
                color: "text-yellow-600 bg-yellow-50 border-yellow-200",
                icon: <FiAlertTriangle className="text-yellow-500" size={24} />,
                message: "Moderate Risk. Some cancellations found.",
                action: "Confirm order before shipping.",
            };
        } else {
            return {
                level: "HIGH RISK",
                color: "text-red-600 bg-red-50 border-red-200",
                icon: <FiXCircle className="text-red-500" size={24} />,
                message: "Fraud Warning! High cancellation rate.",
                action: "DO NOT SHIP COD. Request full advance payment.",
            };
        }
    };

    const analysis = summary ? getRiskAnalysis(summary) : null;

    // Extract courier list (Iterate over apiPayload, not data)
    const couriers = apiPayload
        ? Object.entries(apiPayload)
              .filter(
                  ([key]) =>
                      key !== "summary" && typeof apiPayload[key] === "object",
              )
              .map(([key, value]) => ({ key, ...value }))
        : [];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b dark:border-gray-800 bg-gray-50 dark:bg-slate-800 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <FiShield className="text-purple-600" />
                            Fraud Detection Intelligence
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Checking:{" "}
                            <span className="font-mono font-semibold">
                                {phone}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
                    >
                        <FiX size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium animate-pulse">
                                Scanning National Database...
                            </p>
                        </div>
                    ) : summary ? (
                        <div className="space-y-6">
                            {/* 1. The Verdict Card */}
                            <div
                                className={`p-5 rounded-xl border ${analysis.color} flex flex-col md:flex-row items-center md:justify-between gap-4 text-center md:text-left`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/80 rounded-full shadow-sm">
                                        {analysis.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg tracking-wide">
                                            {analysis.level}
                                        </h4>
                                        <p className="text-sm opacity-90">
                                            {analysis.message}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase font-bold opacity-70">
                                        Recommendation
                                    </p>
                                    <p className="font-bold text-sm md:text-base">
                                        {analysis.action}
                                    </p>
                                </div>
                            </div>

                            {/* 2. Key Statistics */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg text-center border border-gray-100 dark:border-gray-700">
                                    <p className="text-gray-500 text-xs uppercase mb-1">
                                        Total Parcels
                                    </p>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {summary.total_parcel}
                                    </p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg text-center border border-green-100 dark:border-green-900/30">
                                    <p className="text-green-600 text-xs uppercase mb-1">
                                        Success
                                    </p>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                        {summary.success_parcel}
                                    </p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg text-center border border-red-100 dark:border-red-900/30">
                                    <p className="text-red-600 text-xs uppercase mb-1">
                                        Cancelled
                                    </p>
                                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                                        {summary.cancelled_parcel}
                                    </p>
                                </div>
                            </div>

                            {/* 3. Success Ratio Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-gray-600 dark:text-gray-300">
                                        Overall Success Ratio
                                    </span>
                                    <span
                                        className={
                                            analysis.level === "HIGH RISK"
                                                ? "text-red-600"
                                                : "text-green-600"
                                        }
                                    >
                                        {summary.success_ratio}%
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${
                                            summary.success_ratio >= 80
                                                ? "bg-green-500"
                                                : summary.success_ratio >= 50
                                                  ? "bg-yellow-400"
                                                  : "bg-red-500"
                                        }`}
                                        style={{
                                            width: `${summary.success_ratio}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* 4. Courier Breakdown Table */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 border-b dark:border-gray-700 pb-2">
                                    Courier History Breakdown
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {couriers.map((courier) => (
                                        <div
                                            key={courier.key}
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                                courier.total_parcel > 0
                                                    ? "bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-600 shadow-sm"
                                                    : "bg-gray-50 dark:bg-slate-900/50 border-transparent opacity-60"
                                            }`}
                                        >
                                            {/* Logo */}
                                            <div className="w-10 h-10 shrink-0 bg-white rounded-full p-1 border border-gray-100 flex items-center justify-center">
                                                <img
                                                    src={courier.logo}
                                                    alt={courier.name}
                                                    className="w-full h-full object-contain rounded-full"
                                                    onError={(e) => {
                                                        e.target.src =
                                                            "https://via.placeholder.com/40?text=C";
                                                    }}
                                                />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                                                        {courier.name}
                                                    </span>
                                                    {courier.total_parcel >
                                                        0 && (
                                                        <span
                                                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                                courier.success_ratio >=
                                                                80
                                                                    ? "bg-green-100 text-green-700"
                                                                    : courier.success_ratio >=
                                                                        50
                                                                      ? "bg-yellow-100 text-yellow-700"
                                                                      : "bg-red-100 text-red-700"
                                                            }`}
                                                        >
                                                            {
                                                                courier.success_ratio
                                                            }
                                                            %
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 flex gap-3">
                                                    <span className="flex items-center gap-1">
                                                        <FiPackage size={10} />{" "}
                                                        {courier.total_parcel}{" "}
                                                        Total
                                                    </span>
                                                    <span className="flex items-center gap-1 text-red-500">
                                                        <FiXCircle size={10} />{" "}
                                                        {
                                                            courier.cancelled_parcel
                                                        }{" "}
                                                        Cancel
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FiAlertTriangle
                                className="mx-auto text-red-500 mb-2"
                                size={30}
                            />
                            <p className="text-gray-800 dark:text-white font-medium">
                                No Data Found
                            </p>
                            <p className="text-gray-500 text-sm mb-4">
                                {data?.error ||
                                    "The API response was empty or the number is incorrect."}
                            </p>

                            {/* Debugger for Admin: Only if needed */}
                            <details className="text-xs text-left bg-gray-100 p-2 rounded">
                                <summary className="cursor-pointer text-blue-500">
                                    Show Raw Debug Data
                                </summary>
                                <pre className="mt-2 whitespace-pre-wrap">
                                    {JSON.stringify(data, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-slate-800 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        Close
                    </button>
                    {summary &&
                        summary.success_ratio < 50 &&
                        summary.total_parcel > 0 && (
                            <button
                                onClick={() => window.open(`tel:${phone}`)}
                                className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow-sm"
                            >
                                Call Customer Now
                            </button>
                        )}
                </div>
            </div>
        </div>
    );
}
