import React from "react";
import { useForm, Link, usePage } from "@inertiajs/react"; // 1. Added usePage
import AdminLayout from "../../../Layouts/AdminLayouts/AdminLayout";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import toast from "react-hot-toast";

function AddEmployeeForm() {
    // 2. Get the current user's role from the auth props
    const { auth } = usePage().props;
    const currentUserRole = auth.user.role;

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        address: "",
        role: "employee",
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        post("/admin/employee/store", {
            onSuccess: () => {
                setData({
                    name: "",
                    address: "",
                    phone: "",
                    email: "",
                    password: "",
                    role: "employee",
                });
                toast.success("Employee created successfully!");
            },
        });
    };

    return (
        <div className="max-w-4xl mx-auto font-poppins">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Add New Staff
                </h2>
                <Link
                    href={"/admin/employees"} // Recommended: use route() helper if available
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
                >
                    <FiArrowLeft /> Back to List
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-800 dark:text-white"
                                placeholder="e.g. Samir Mahmud"
                            />
                            {errors.name && (
                                <div className="text-red-500 text-sm mt-1">
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        {/* Role Selection - CONDITIONALLY FILTERED */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Role
                            </label>
                            <select
                                value={data.role}
                                onChange={(e) =>
                                    setData("role", e.target.value)
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="employee">
                                    Employee (Staff)
                                </option>

                                {/* 3. Only show Manager option if current user is Admin */}
                                {currentUserRole === "admin" && (
                                    <option value="manager">Manager</option>
                                )}
                            </select>
                            {errors.role && (
                                <div className="text-red-500 text-sm mt-1">
                                    {errors.role}
                                </div>
                            )}
                        </div>

                        {/* ... Email, Phone, Password, and Address fields remain the same ... */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-800 dark:text-white"
                                placeholder="staff@example.com"
                            />
                            {errors.email && (
                                <div className="text-red-500 text-sm mt-1">
                                    {errors.email}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Phone Number
                            </label>
                            <input
                                type="text"
                                value={data.phone}
                                onChange={(e) =>
                                    setData("phone", e.target.value)
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-800 dark:text-white"
                                placeholder="017xxxxxxxx"
                            />
                            {errors.phone && (
                                <div className="text-red-500 text-sm mt-1">
                                    {errors.phone}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-800 dark:text-white"
                                placeholder="Min 8 characters"
                            />
                            {errors.password && (
                                <div className="text-red-500 text-sm mt-1">
                                    {errors.password}
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Address
                            </label>
                            <textarea
                                value={data.address}
                                onChange={(e) =>
                                    setData("address", e.target.value)
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-800 dark:text-white"
                                rows="3"
                                placeholder="Employee's address"
                            ></textarea>
                            {errors.address && (
                                <div className="text-red-500 text-sm mt-1">
                                    {errors.address}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            <FiSave size={18} />
                            {processing ? "Creating..." : "Create Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

AddEmployeeForm.layout = (page) => <AdminLayout children={page} />;
export default AddEmployeeForm;
