import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react"; // 1. Import usePage
import {
    FiSearch,
    FiFilter,
    FiX,
    FiDownload,
    FiUserPlus,
} from "react-icons/fi";

export default function OrdersFilter({ filters, employees, onAssignClick }) {
    // 2. Get User Role
    const { auth } = usePage().props;
    const isEmployee = auth.user.role === "employee";

    // State Initialization
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [orderStatus, setOrderStatus] = useState(filters?.order_status || "");
    const [paymentStatus, setPaymentStatus] = useState(
        filters?.payment_status || "",
    );
    const [unassignedOnly, setUnassignedOnly] = useState(
        filters?.unassigned_only === "true",
    );
    const [dateFilter, setDateFilter] = useState(filters?.date_filter || "");
    const [startDate, setStartDate] = useState(filters?.start_date || "");
    const [endDate, setEndDate] = useState(filters?.end_date || "");
    const [showFilters, setShowFilters] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== (filters?.search || "")) {
                triggerFilterRequest({ search: searchTerm });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const triggerFilterRequest = (newValues = {}) => {
        const params = {
            search: searchTerm,
            order_status: orderStatus,
            payment_status: paymentStatus,
            date_filter: dateFilter,
            unassigned_only: unassignedOnly,
            sort_by: filters?.sort_by,
            sort_order: filters?.sort_order,
            ...newValues,
        };

        if ((newValues.date_filter || dateFilter) === "custom") {
            if (startDate || newValues.start_date)
                params.start_date = newValues.start_date || startDate;
            if (endDate || newValues.end_date)
                params.end_date = newValues.end_date || endDate;

            if (
                (!params.start_date || !params.end_date) &&
                !newValues.force_submit
            ) {
                return;
            }
        }

        delete params.force_submit;

        router.get("/admin/orders", params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setUnassignedOnly(false);
        setSearchTerm("");
        setOrderStatus("");
        setPaymentStatus("");
        setDateFilter("");
        setStartDate("");
        setEndDate("");
        router.get("/admin/orders");
    };

    const handleExportPdf = () => {
        const params = new URLSearchParams(window.location.search);
        window.open(`/admin/orders/export/pdf?${params.toString()}`, "_blank");
    };

    return (
        <div className="mb-2">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Orders
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage your orders and track status
                    </p>
                </div>

                {/* Buttons Group */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* 3. Assign Button - HIDDEN for Employees */}
                    {!isEmployee && employees && (
                        <button
                            onClick={onAssignClick}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                        >
                            <FiUserPlus size={18} />
                            <span className="whitespace-nowrap">
                                Assign Orders
                            </span>
                        </button>
                    )}

                    {/* 4. Export PDF Button - HIDDEN for Employees */}
                    {!isEmployee && (
                        <button
                            onClick={handleExportPdf}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                        >
                            <FiDownload size={18} />
                            <span className="whitespace-nowrap">
                                Export PDF
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-950 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col gap-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name, email, phone, or order ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 placeholder-gray-400"
                            />
                        </div>

                        {!isEmployee && (
                            <label className="flex items-center gap-2 cursor-pointer bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
                                <input
                                    type="checkbox"
                                    checked={unassignedOnly}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setUnassignedOnly(checked);
                                        triggerFilterRequest({
                                            unassigned_only: checked,
                                        });
                                    }}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-orange-700 dark:text-orange-300 whitespace-nowrap">
                                    Unassigned Only
                                </span>
                            </label>
                        )}

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                            <FiFilter size={18} />
                            Filters
                        </button>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            {/* Order Status */}
                            <select
                                value={orderStatus}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setOrderStatus(val);
                                    triggerFilterRequest({ order_status: val });
                                }}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Order Status</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>

                            {/* Payment Status */}
                            <select
                                value={paymentStatus}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPaymentStatus(val);
                                    triggerFilterRequest({
                                        payment_status: val,
                                    });
                                }}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Payment Status</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                            </select>

                            {/* Date Filter Type */}
                            <select
                                value={dateFilter}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setDateFilter(val);
                                    if (val !== "custom") {
                                        triggerFilterRequest({
                                            date_filter: val,
                                        });
                                    }
                                }}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="custom">Custom Range</option>
                            </select>

                            <button
                                onClick={clearFilters}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <FiX size={16} />
                                Clear
                            </button>
                        </div>
                    )}

                    {/* Custom Date Range Inputs */}
                    {showFilters && dateFilter === "custom" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-300"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-300"
                            />
                            <button
                                onClick={() =>
                                    triggerFilterRequest({ force_submit: true })
                                }
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                Apply Date Range
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
