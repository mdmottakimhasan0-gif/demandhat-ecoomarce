import React from "react";
import AdminLayout from "@/Layouts/AdminLayouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Search,
    Filter,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    Mail,
    Phone,
    MapPin,
    Shield,
} from "lucide-react";

export default function Users({ users }) {
    // Helper to get initials for Avatar
    const getInitials = (name) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    // Helper for verification badges
    const VerificationBadge = ({ isVerified }) => (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isVerified
                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
            }`}
        >
            {isVerified ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {isVerified ? "Verified" : "Pending"}
        </span>
    );

    return (
        <>
            <Head title="User Management" />

            <div className="p-2 lg:p-4  max-w-7xl mx-auto font-poppins antialiased">
                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Customers
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Manage registered users and verification status.
                        </p>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 md:flex-none">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64 transition-shadow"
                            />
                        </div>
                        <button className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                {/* --- Table Card --- */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto ">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-white  dark:bg-gray-700">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 dark:text-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        User Profile
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3  dark:text-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Contact Info
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 dark:text-gray-50 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Location
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 dark:text-gray-50 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Status
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 dark:text-gray-50 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {users.data.length > 0 ? (
                                    users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-white dark:hover:bg-gray-700  transition-colors"
                                        >
                                            {/* User Profile Column */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 mr-2">
                                                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-sm font-medium">
                                                            {getInitials(
                                                                user.name
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                                                            {user.name}
                                                            {user.role ===
                                                                "admin" && (
                                                                <Shield
                                                                    size={14}
                                                                    className="text-blue-500"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            ID: #{user.id} •
                                                            Joined{" "}
                                                            {new Date(
                                                                user.created_at
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact Info Column */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                        <Mail
                                                            size={14}
                                                            className="text-gray-400"
                                                        />
                                                        {user.email}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                        <Phone
                                                            size={14}
                                                            className="text-gray-400"
                                                        />
                                                        {user.phone || (
                                                            <span className="text-gray-400 italic">
                                                                Not provided
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Location Column */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                                    <MapPin
                                                        size={14}
                                                        className="text-gray-400 flex-shrink-0"
                                                    />
                                                    {user.address || (
                                                        <span className="text-gray-400 italic">
                                                            Not provided
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status Column */}
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex flex-col gap-1 items-center">
                                                    <VerificationBadge
                                                        isVerified={
                                                            !!user.email_verified_at
                                                        }
                                                    />
                                                    {user.phone && (
                                                        <VerificationBadge
                                                            isVerified={
                                                                !!user.phone_verified_at
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            </td>

                                            {/* Action Column */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                    <MoreHorizontal size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-6 py-12 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <Search
                                                    size={48}
                                                    className="mb-3 opacity-50"
                                                />
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    No users found
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Try adjusting your search
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- Pagination Footer --- */}
                    {users.links && (
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <p>
                                Showing{" "}
                                <span className="font-medium">
                                    {users.from}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium">{users.to}</span>{" "}
                                of{" "}
                                <span className="font-medium">
                                    {users.total}
                                </span>{" "}
                                results
                            </p>
                            <div className="flex gap-1">
                                {users.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`px-3 py-1 rounded-md transition-colors ${
                                                link.active
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="px-3 py-1 rounded-md text-gray-400 cursor-not-allowed"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Users.layout = (page) => <AdminLayout children={page} />;
