import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import {
    FiCalendar,
    FiRefreshCw,
    FiPrinter,
    FiX,
    FiCheck,
} from "react-icons/fi";

export default function DashboardFilter({ currentRange, startDate, endDate }) {
    const [showCustomModal, setShowCustomModal] = useState(false);

    const [customDates, setCustomDates] = useState({
        start: startDate || "",
        end: endDate || "",
    });

    useEffect(() => {
        setCustomDates({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const handleRangeChange = (e) => {
        const range = e.target.value;

        if (range === "custom") {
            setShowCustomModal(true);
        } else {
            // "lifetime" falls here, so it triggers the get request immediately
            router.get(
                "/admin",
                { range },
                { preserveState: true, preserveScroll: true },
            );
        }
    };

    const applyCustomRange = () => {
        if (!customDates.start || !customDates.end) {
            alert("Please select both a start and end date.");
            return;
        }
        setShowCustomModal(false);
        router.get(
            "/admin",
            {
                range: "custom",
                start_date: customDates.start,
                end_date: customDates.end,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleRefresh = () => {
        router.reload({
            only: ["stats", "actions", "charts", "recent_orders"],
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative">
                        <FiCalendar className="absolute left-3 top-3 text-gray-400" />
                        <select
                            value={currentRange}
                            onChange={handleRangeChange}
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="7_days">Last 7 Days</option>
                            <option value="30_days">Last 30 Days</option>
                            {/* Added Lifetime Option */}
                            <option value="lifetime">All Time</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                        {startDate} — {endDate}
                    </span>

                    {currentRange === "custom" && (
                        <button
                            onClick={() => setShowCustomModal(true)}
                            className="text-xs text-blue-600 underline ml-2"
                        >
                            Edit Dates
                        </button>
                    )}
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button
                        onClick={handleRefresh}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                        <FiRefreshCw />
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                    >
                        <FiPrinter /> Print Summary
                    </button>
                </div>
            </div>

            {/* Custom Modal (Same as before) */}
            {showCustomModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white">
                                Select Custom Range
                            </h3>
                            <button
                                onClick={() => setShowCustomModal(false)}
                                className="text-gray-500 hover:text-red-500"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={customDates.start}
                                    onChange={(e) =>
                                        setCustomDates({
                                            ...customDates,
                                            start: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:text-white dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={customDates.end}
                                    onChange={(e) =>
                                        setCustomDates({
                                            ...customDates,
                                            end: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:text-white dark:border-gray-600"
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCustomModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applyCustomRange}
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                            >
                                <FiCheck /> Apply Filter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
