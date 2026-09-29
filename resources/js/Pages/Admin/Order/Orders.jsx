import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayouts/AdminLayout";
import OrdersFilter from "../../../components/AdminComponents/OrdersFilter";
import OrdersTable from "../../../components/AdminComponents/OrdersTable";
import Pagination from "../../../components/AdminComponents/Pagination";
import { FiX, FiUserPlus } from "react-icons/fi";
import axios from "axios";
import FraudCheckModal from "../../../components/AdminComponents/FraudCheckModal";
import toast from "react-hot-toast";
import CourierModal from "../../../components/AdminComponents/CourierModal";

export default function Orders({
    orders,
    filters,
    employees,
    unassignedCount,
}) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    // Fraud Check Modal State
    const [isFraudModalOpen, setIsFraudModalOpen] = useState(false);
    const [fraudData, setFraudData] = useState(null);
    const [isFraudLoading, setIsFraudLoading] = useState(false);
    const [checkingPhone, setCheckingPhone] = useState("");

    //courier er state
    const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
    const [selectedCourierOrder, setSelectedCourierOrder] = useState(null);

    const openCourierModal = (order) => {
        setSelectedCourierOrder(order);
        setIsCourierModalOpen(true);
    };

    // const handleCheckFraud = async (order) => {
    //     setCheckingPhone(order.phone);
    //     setIsFraudModalOpen(true);
    //     setIsFraudLoading(true);
    //     setFraudData(null);

    //     try {
    //         const response = await axios.get(
    //             `/admin/orders/${order.id}/check-fraud`,
    //         );
    //         setFraudData(response.data);
    //     } catch (error) {
    //         console.error("Fraud check failed", error);
    //         setFraudData({ status: "error", error: "Connection Failed" });
    //     } finally {
    //         setIsFraudLoading(false);
    //     }
    // };

    const handleCheckFraud = async (order) => {
        setCheckingPhone(order.phone);
        setIsFraudModalOpen(true);
        setIsFraudLoading(true);
        setFraudData(null);

        try {
            const response = await axios.get(
                `/admin/orders/${order.id}/check-fraud`,
            );
            setFraudData(response.data);
        } catch (error) {
            console.error("Fraud check failed", error);
            // Show the actual error message from the backend if it exists
            if (error.response && error.response.data) {
                setFraudData(error.response.data);
            } else {
                setFraudData({ status: "error", error: "Connection Failed" });
            }
        } finally {
            setIsFraudLoading(false);
        }
    };

    const {
        data: editData,
        setData: setEditData,
        put,
        processing: editProcessing,
        reset: resetEdit,
        errors: editErrors,
    } = useForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        subtotal: "",
        delivery_fee: "",
        grand_total: "",
        order_status: "",
        payment_status: "",
    });

    // 2. Form for Batch Assignment (Manager Feature)
    const {
        data: assignData,
        setData: setAssignData,
        post: postAssign,
        processing: assignProcessing,
        reset: resetAssign,
        errors: assignErrors,
    } = useForm({
        quantity: "",
        employee_id: "",
    });

    // --- HANDLERS ---

    // Edit Modal Handlers
    const openEditModal = (order) => {
        setSelectedOrder(order);
        setEditData({
            name: order.name,
            email: order.email,
            phone: order.phone,
            address: order.address,
            subtotal: order.subtotal,
            delivery_fee: order.delivery_fee,
            grand_total: order.grand_total,
            order_status: order.order_status,
            payment_status: order.payment_status,
        });
        setIsEditModalOpen(true);
    };

    const handlePriceChange = (field, value) => {
        const val = parseFloat(value) || 0;
        setEditData((prev) => {
            const newData = { ...prev, [field]: val };
            newData.grand_total =
                (parseFloat(newData.subtotal) || 0) +
                (parseFloat(newData.delivery_fee) || 0);
            return newData;
        });
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedOrder(null);
        resetEdit();
    };

    const updateStatus = (e) => {
        e.preventDefault();
        put(`/admin/orders/${selectedOrder.id}/update`, {
            onSuccess: () => {
                closeEditModal();
                toast.success("Order Edited Successfully.");
            },
        });
    };

    // Assign Modal Handlers
    const handleAssignSubmit = (e) => {
        e.preventDefault();
        postAssign("/admin/orders/assign-batch", {
            onSuccess: () => {
                setIsAssignModalOpen(false);
                resetAssign();
            },
        });
    };

    return (
        <div className="pb-10 font-poppins relative">
            {/* ========================================================= */}
            {/* 1. Header & Actions Section (Redesigned)                  */}
            {/* ========================================================= */}
            <div className="flex flex-col  justify-between items-start lg:items-center gap-4 mb-6">
                {/* Left Side: Filters */}
                <div className="w-full lg:flex-1">
                    <OrdersFilter
                        filters={filters}
                        employees={employees}
                        onAssignClick={() => setIsAssignModalOpen(true)}
                    />
                </div>
            </div>

            {/* 2. Table Section */}
            <OrdersTable
                orders={orders}
                filters={filters}
                onEditStatus={openEditModal}
                onCheckFraud={handleCheckFraud}
                onSendCourier={openCourierModal}
            />

            {/* 3. Pagination Section */}
            <Pagination links={orders.links} total={orders.total} />

            <CourierModal
                isOpen={isCourierModalOpen}
                onClose={() => setIsCourierModalOpen(false)}
                order={selectedCourierOrder}
            />

            {/* ========================================================= */}
            {/*                 MODAL 1: UPDATE STATUS                    */}
            {/* ========================================================= */}
            {isEditModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl overflow-hidden animate-fade-in-up">
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-800">
                            <h3 className="text-lg font-semibold dark:text-white">
                                Edit Order #{selectedOrder.id}
                            </h3>
                            <button
                                onClick={closeEditModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={updateStatus} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Column 1: Customer Details */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-blue-600 uppercase">
                                        Customer Information
                                    </h4>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) =>
                                                setEditData(
                                                    "name",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={editData.email}
                                                onChange={(e) =>
                                                    setEditData(
                                                        "email",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300">
                                                Phone
                                            </label>
                                            <input
                                                type="text"
                                                value={editData.phone}
                                                onChange={(e) =>
                                                    setEditData(
                                                        "phone",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-300">
                                            Address
                                        </label>
                                        <textarea
                                            rows="3"
                                            value={editData.address}
                                            onChange={(e) =>
                                                setEditData(
                                                    "address",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* Column 2: Status & Financials */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-purple-600 uppercase">
                                        Status & Financials
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300">
                                                Order Status
                                            </label>
                                            <select
                                                value={editData.order_status}
                                                onChange={(e) =>
                                                    setEditData(
                                                        "order_status",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                            >
                                                <option value="pending">
                                                    Pending
                                                </option>
                                                <option value="processing">
                                                    Processing
                                                </option>
                                                <option value="shipped">
                                                    Shipped
                                                </option>
                                                <option value="delivered">
                                                    Delivered
                                                </option>
                                                <option value="cancelled">
                                                    Cancelled
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300">
                                                Payment Status
                                            </label>
                                            <select
                                                value={editData.payment_status}
                                                onChange={(e) =>
                                                    setEditData(
                                                        "payment_status",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                            >
                                                <option value="paid">
                                                    Paid
                                                </option>
                                                <option value="pending">
                                                    Pending
                                                </option>
                                                <option value="failed">
                                                    Failed
                                                </option>
                                                <option value="refunded">
                                                    Refunded
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300">
                                                Subtotal
                                            </label>
                                            <input
                                                type="number"
                                                value={editData.subtotal}
                                                onChange={(e) =>
                                                    handlePriceChange(
                                                        "subtotal",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-300">
                                                Delivery Fee
                                            </label>
                                            <input
                                                type="number"
                                                value={editData.delivery_fee}
                                                onChange={(e) =>
                                                    handlePriceChange(
                                                        "delivery_fee",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-gray-700 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">
                                            Grand Total
                                        </label>
                                        <span className="text-2xl font-bold text-blue-600">
                                            ৳
                                            {parseFloat(
                                                editData.grand_total,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg dark:bg-gray-800 dark:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editProcessing}
                                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                                >
                                    {editProcessing
                                        ? "Saving..."
                                        : "Update Order"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/*              MODAL 2: BATCH ASSIGN ORDERS                  */}
            {/* ========================================================= */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#059669]/10 dark:bg-[#059669]/20 rounded-xl">
                                    <FiUserPlus className="text-[#059669] dark:text-[#8ab87a]" size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        Assign Orders to Staff
                                    </h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                        Oldest pending orders are assigned first
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setIsAssignModalOpen(false); resetAssign(); }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAssignSubmit} className="px-6 py-5 space-y-5">

                            {/* Unassigned Orders Banner */}
                            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                                unassignedCount === 0
                                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                    : "bg-[#059669]/8 dark:bg-[#059669]/15 border-[#059669]/20 dark:border-[#059669]/30"
                            }`}>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Unassigned Queue
                                    </p>
                                    <p className={`text-2xl font-extrabold mt-0.5 ${
                                        unassignedCount === 0 ? "text-red-500" : "text-[#059669] dark:text-[#8ab87a]"
                                    }`}>
                                        {unassignedCount ?? "—"}
                                        <span className="text-sm font-medium text-gray-400 ml-1">orders waiting</span>
                                    </p>
                                </div>
                                {unassignedCount === 0 && (
                                    <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg font-semibold">
                                        All Clear ✓
                                    </span>
                                )}
                            </div>

                            {/* Staff Selector */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Select Staff Member <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={assignData.employee_id}
                                    onChange={(e) => setAssignData("employee_id", e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] transition-all"
                                    required
                                >
                                    <option value="">— Choose a staff member —</option>
                                    {employees && employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                                {assignErrors.employee_id && (
                                    <p className="text-xs text-red-500">{assignErrors.employee_id}</p>
                                )}
                            </div>

                            {/* Quantity Input */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Number of Orders to Assign <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max={Math.min(unassignedCount || 0, 500)}
                                        placeholder={`Max ${Math.min(unassignedCount || 0, 500)}`}
                                        value={assignData.quantity}
                                        onChange={(e) => setAssignData("quantity", e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] transition-all"
                                        required
                                        disabled={unassignedCount === 0}
                                    />
                                    {unassignedCount > 0 && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 font-medium pointer-events-none">
                                            / {unassignedCount}
                                        </span>
                                    )}
                                </div>
                                {assignErrors.quantity && (
                                    <p className="text-xs text-red-500">{assignErrors.quantity}</p>
                                )}
                            </div>

                            {/* Live Preview Summary */}
                            {assignData.quantity > 0 && assignData.employee_id && (
                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                                    <div className="w-9 h-9 rounded-full bg-[#059669]/10 dark:bg-[#059669]/20 text-[#059669] dark:text-[#8ab87a] flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                                        {employees?.find(e => e.id == assignData.employee_id)?.name?.charAt(0) || "?"}
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-semibold text-gray-800 dark:text-white">
                                            {assignData.quantity}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400"> orders → </span>
                                        <span className="font-semibold text-[#059669] dark:text-[#8ab87a]">
                                            {employees?.find(e => e.id == assignData.employee_id)?.name}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setIsAssignModalOpen(false); resetAssign(); }}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={assignProcessing || unassignedCount === 0 || !assignData.employee_id || !assignData.quantity}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#059669] hover:bg-[#047857] disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:text-gray-400 rounded-xl transition-all shadow-sm disabled:shadow-none disabled:cursor-not-allowed"
                                >
                                    {assignProcessing ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            Assigning...
                                        </>
                                    ) : (
                                        <>
                                            <FiUserPlus size={14} />
                                            Assign {assignData.quantity || ""} Orders
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <FraudCheckModal
                isOpen={isFraudModalOpen}
                onClose={() => setIsFraudModalOpen(false)}
                data={fraudData}
                isLoading={isFraudLoading}
                phone={checkingPhone}
            />
        </div>
    );
}

Orders.layout = (page) => <AdminLayout children={page} />;
