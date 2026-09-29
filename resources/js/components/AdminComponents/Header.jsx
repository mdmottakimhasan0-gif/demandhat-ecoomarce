import React from "react";
import { useState } from "react";
import { Link, usePage } from "@inertiajs/react";

function Header() {
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const { auth } = usePage().props;
    const user = auth?.user;

    const getPageTitle = () => {
        const path = window.location.pathname;
        if (path.startsWith("/admin/categories")) return "Categories";
        if (path.startsWith("/admin/products")) return "Products";
        if (path.startsWith("/admin/reviews")) return "Reviews";
        if (path.startsWith("/admin/users")) return "Users";
        if (path.startsWith("/admin/employees")) return "Employees";
        if (path.startsWith("/admin/orders")) return "Orders";
        if (path.startsWith("/admin/landing-pages")) return "Landing Pages";
        if (path.startsWith("/admin/settings")) return "Settings";
        if (path.startsWith("/admin/profile")) return "My Profile";
        return "Dashboard";
    };

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-200 font-poppins">
                <div className="flex items-center justify-between px-4 h-16">
                    <div className="flex items-center">
                        <h1 className="text-xl pl-3 font-bold text-slate-800 dark:text-white tracking-tight">
                            {getPageTitle()}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:block text-xs font-medium text-slate-500 dark:text-slate-400">
                            Logged in as <span className="text-slate-800 dark:text-slate-200 capitalize font-semibold">{user.role}</span>
                        </span>

                        {/* Profile Icon */}
                        <div
                            title="Profile Options"
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                            className="w-10 h-10 hover:cursor-pointer rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold select-none shadow-sm ring-2 ring-slate-100 dark:ring-slate-800 active:scale-95 transition-all duration-200"
                        >
                            {user.name
                                ? user.name.substring(0, 2).toUpperCase()
                                : "U"}
                        </div>
                    </div>
                </div>

                {/* Dropdown Menu */}
                <div className="">
                    {profileMenuOpen && (
                        <>
                            {/* Optional: Invisible backdrop to close menu when clicking outside */}
                            <div
                                className="fixed inset-0 z-[9998]"
                                onClick={() => setProfileMenuOpen(false)}
                            ></div>

                            <div className="absolute border border-slate-200/80 dark:border-slate-700/85 right-4 top-16 bg-white dark:bg-slate-900 shadow-xl rounded-xl w-56 py-2 z-[9999] overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                </div>
                                <Link
                                    href="/admin/profile"
                                    onClick={() => setProfileMenuOpen(false)}
                                    className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors"
                                >
                                    My Profile
                                </Link>
                                <Link
                                    href="/"
                                    className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors"
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button" // best practice for logout links
                                    className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors"
                                >
                                    Log Out
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </header>
        </>
    );
}

export default Header;
