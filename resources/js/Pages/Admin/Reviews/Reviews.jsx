import React, { useState, useEffect } from "react";
import { Link, useForm, router } from "@inertiajs/react";
import { FiSearch, FiTrash2, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { Star } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayouts/AdminLayout";

const Reviews = ({ reviews = [], filters = {} }) => {
    const { patch, delete: destroy } = useForm();

    // Local states for filters
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");

    // Native Debounce for searching
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (
                search !== (filters.search || "") ||
                status !== (filters.status || "")
            ) {
                router.get(
                    "/admin/reviews",
                    { search, status },
                    {
                        preserveState: true,
                        replace: true,
                        preserveScroll: true,
                    },
                );
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [search, status]);

    const handleToggleStatus = (id) => {
        patch(`/admin/reviews/${id}/toggle`, {
            preserveScroll: true,
        });
    };

    const handleDelete = (e, id) => {
        e.preventDefault();
        if (
            confirm("Are you sure you want to permanently delete this review?")
        ) {
            destroy(`/admin/reviews/${id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <div className="pb-10 font-poppins">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Customer Reviews
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Approve, reject, and manage product reviews.
                    </p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-950 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by product or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200"
                        />
                    </div>

                    <div className="flex gap-3">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-300"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4 border-b dark:border-gray-800">
                                    Customer
                                </th>
                                <th className="p-4 border-b dark:border-gray-800">
                                    Product
                                </th>
                                <th className="p-4 border-b dark:border-gray-800">
                                    Rating
                                </th>
                                <th className="p-4 border-b dark:border-gray-800">
                                    Review
                                </th>
                                <th className="p-4 border-b dark:border-gray-800">
                                    Status
                                </th>
                                <th className="p-4 border-b dark:border-gray-800 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {reviews.data && reviews.data.length > 0 ? (
                                reviews.data.map((review) => (
                                    <tr
                                        key={review.id}
                                        className="hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors"
                                    >
                                        <td className="p-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {review.user?.name || "Unknown"}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="max-w-[150px] truncate">
                                                {review.product?.name ||
                                                    "Unknown Product"}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${
                                                            i < review.rating
                                                                ? "fill-yellow-400 text-yellow-400"
                                                                : "text-gray-300 dark:text-gray-700"
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div
                                                className="max-w-[250px] truncate"
                                                title={review.review} // Hover to see full text
                                            >
                                                {review.review ||
                                                    "No comment provided."}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${
                                                    review.is_approved
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                }`}
                                            >
                                                {review.is_approved
                                                    ? "Approved"
                                                    : "Pending"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Approve / Reject Toggle Button */}
                                                <button
                                                    onClick={() =>
                                                        handleToggleStatus(
                                                            review.id,
                                                        )
                                                    }
                                                    title={
                                                        review.is_approved
                                                            ? "Unapprove Review"
                                                            : "Approve Review"
                                                    }
                                                    className={`p-2 rounded transition-colors ${
                                                        review.is_approved
                                                            ? "hover:bg-gray-100 dark:hover:bg-slate-800 text-orange-500"
                                                            : "hover:bg-gray-100 dark:hover:bg-slate-800 text-green-600"
                                                    }`}
                                                >
                                                    {review.is_approved ? (
                                                        <FiXCircle size={18} />
                                                    ) : (
                                                        <FiCheckCircle
                                                            size={18}
                                                        />
                                                    )}
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) =>
                                                        handleDelete(
                                                            e,
                                                            review.id,
                                                        )
                                                    }
                                                    title="Delete Review"
                                                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-red-500 transition-colors"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="p-10 text-center text-gray-500"
                                    >
                                        No reviews found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total {reviews.total} reviews
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                        {reviews.links &&
                            reviews.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url ?? "#"}
                                    className={`px-3 py-1.5 text-sm rounded-md border dark:border-gray-700 ${
                                        link.active
                                            ? "bg-blue-600 text-white"
                                            : "bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300"
                                    } ${!link.url ? "opacity-50 cursor-default" : ""}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

Reviews.layout = (page) => <AdminLayout children={page} />;
export default Reviews;
