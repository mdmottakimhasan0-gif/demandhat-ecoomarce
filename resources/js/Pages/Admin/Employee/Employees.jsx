import React, { useState } from "react";
import { HiOutlineUserGroup, HiOutlineShieldCheck } from "react-icons/hi";
import { Link, router } from "@inertiajs/react";
import AdminLayout from "../../../Layouts/AdminLayouts/AdminLayout";
import { MdOutlinePersonAddAlt1 } from "react-icons/md";
import { IoEyeOutline } from "react-icons/io5";
import { AiOutlineDelete } from "react-icons/ai";
import toast from "react-hot-toast";
import axios from "axios";

function Employees({ employees = [] }) {
    // --- Modal এর জন্য State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [qrData, setQrData] = useState({ id: null, url: "", name: "", secret: "" });
    const [loadingQr, setLoadingQr] = useState(false);

    // --- QR Code আনার ফাংশন ---
    const handleShowQr = async (id) => {
        setLoadingQr(true);
        try {
            const response = await axios.get(`/admin/employee/${id}/qr-code`);
            setQrData({
                id: id,
                url: response.data.qr_code_url,
                name: response.data.name,
                secret: response.data.secret,
            });
            setIsModalOpen(true);
        } catch (error) {
            toast.error("QR Code তৈরি করা সম্ভব হচ্ছে না।");
        } finally {
            setLoadingQr(false);
        }
    };

    const handleReset2Fa = async () => {
        if (!qrData.id) return;
        if (!confirm("Are you sure you want to reset 2FA for this employee? They will need to scan a new QR code next time they log in.")) return;
        
        router.post(`/admin/employee/${qrData.id}/reset-2fa`, {}, {
            onSuccess: () => {
                toast.success("2FA security has been successfully reset!");
                setIsModalOpen(false);
            },
            onError: () => {
                toast.error("Failed to reset 2FA.");
            }
        });
    };

    const handleDelete = (e, id) => {
        e.preventDefault();
        if (confirm("Are you sure?")) {
            router.delete(`/admin/employees/${id}`, {
                onSuccess: () => toast.success("Deleted successfully!"),
            });
        }
    };

    return (
        <div>
            <div className="flex font-poppins justify-between items-center">
                <div className="flex gap-3">
                    {/* Existing Add Staff Button */}
                    <Link
                        href={"/admin/employee/create"}
                        className="px-3 inline-flex gap-2 items-center py-2 rounded font-bold bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <MdOutlinePersonAddAlt1 size={20} /> Add Staff
                    </Link>

                    {/* NEW Excel Export Button using standard <a> tag for download */}
                    <a
                        href="/admin/employees/export-excel"
                        className="px-3 inline-flex gap-2 items-center py-2 rounded font-bold bg-green-600 hover:bg-green-700 text-white transition-colors shadow-sm"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            ></path>
                        </svg>
                        Export Excel
                    </a>
                </div>

                <div className="px-3 inline-flex gap-2 items-center py-2 rounded font-bold bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white">
                    <HiOutlineUserGroup size={20} /> Total = {employees.total}
                </div>
            </div>

            {/* Table Section */}
            <div className="w-full mt-4 overflow-x-auto">
                <table className="min-w-full bg-gray-300 dark:bg-gray-400 shadow-md rounded mb-4">
                    <thead className="bg-slate-700 text-gray-200">
                        <tr>
                            <th className="p-3 text-left">ID</th>
                            <th className="p-3 text-left">Name</th>
                            <th className="p-3 text-center">Pending Orders</th>

                            <th className="p-3 text-center">
                                Confirmed Orders
                            </th>

                            <th className="p-3 text-center">Security (2FA)</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.data.map((employee) => (
                            <tr
                                key={employee.id}
                                className="border-b dark:bg-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <td className="p-3">{employee.id}</td>
                                <td className="p-3">
                                    <div className="font-bold">
                                        {employee.name}
                                    </div>
                                    <div className="text-xs text-green-800 dark:text-green-500 opacity-75 capitalize">
                                        {employee.role}
                                    </div>
                                </td>

                                {/* অরিজিনাল পেন্ডিং অর্ডার কাউন্ট লজিক */}
                                <td className="p-3 text-center">
                                    {employee.assigned_orders_count > 0 ? (
                                        <span className="bg-red-100 text-red-800 text-sm font-bold px-3 py-1 rounded-full dark:bg-gray-500 dark:text-white">
                                            {employee.assigned_orders_count}
                                        </span>
                                    ) : (
                                        <span className="text-red-500">
                                            "No Order"
                                        </span>
                                    )}
                                </td>

                                <td className="p-3 text-center">
                                    {employee.confirmed_orders_count > 0 ? (
                                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">
                                            {employee.confirmed_orders_count}
                                        </span>
                                    ) : (
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">
                                            0
                                        </span>
                                    )}
                                </td>

                                {/* --- Security / 2FA QR Button --- */}
                                <td className="p-3 text-center">
                                    <button
                                        onClick={() =>
                                            handleShowQr(employee.id)
                                        }
                                        className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-xs font-bold transition-all"
                                    >
                                        <HiOutlineShieldCheck size={14} />
                                        {loadingQr ? "..." : "Setup 2FA"}
                                    </button>
                                </td>

                                <td className="p-3 text-right">
                                    <div className="flex justify-end gap-3 items-center">
                                        <Link
                                            href={`/admin/employee/${employee.id}/edit`}
                                        >
                                            <IoEyeOutline
                                                size={25}
                                                className="text-red-500 hover:scale-110"
                                            />
                                        </Link>
                                        <button
                                            onClick={(e) =>
                                                handleDelete(e, employee.id)
                                            }
                                            className="bg-red-500 hover:bg-red-700 text-white py-1 px-1 sm:px-2 rounded"
                                        >
                                            <AiOutlineDelete size={20} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Section (আপনি আগে যেভাবে ইউজ করছিলেন) */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="dark:text-green-500 font-poppins font-bold">
                    Total {employees.total}
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                    {employees.links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.url ?? "#"}
                            className={`md:px-3 px-2 py-1 md:py-1.5 text-sm rounded-md border dark:border-gray-700 ${link.active ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"} ${!link.url ? "opacity-50 cursor-default" : ""}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>

            {/* ================= MODAL SECTION ================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                            Google Authenticator
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            ম্যানেজার তার ফোনের অ্যাপ দিয়ে নিচের কোডটি স্ক্যান
                            করুন। স্টাফ:{" "}
                            <span className="font-bold text-blue-500">
                                {qrData.name}
                            </span>
                        </p>
                        <div className="bg-white p-4 rounded-xl inline-block border-4 border-gray-100 mb-4">
                            <img
                                src={qrData.url}
                                alt="QR Code"
                                className="w-48 h-48 mx-auto"
                            />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-6">
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">
                                Setup Key (Manual)
                            </p>
                            <code className="text-lg font-mono font-bold text-gray-800 dark:text-green-500">
                                {qrData.secret}
                            </code>
                        </div>
                        <div className="flex flex-col gap-2 mt-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Done / Close
                            </button>
                            <button
                                onClick={handleReset2Fa}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all text-sm mt-1"
                            >
                                Reset / Disable 2FA
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

Employees.layout = (page) => <AdminLayout children={page} />;
export default Employees;
