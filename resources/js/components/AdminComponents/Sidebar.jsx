import React, { useState } from "react";
import { BsArrowLeftCircleFill } from "react-icons/bs";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoHome } from "react-icons/io5";
import { GrUserManager } from "react-icons/gr";
import { BsNewspaper } from "react-icons/bs";
import { MdSettings, MdLightMode } from "react-icons/md";
// 1. Import usePage to access user data
import { Link, usePage } from "@inertiajs/react";
import { ShoppingBasket, ShoppingCart, Star } from "lucide-react";
import { TbCategory } from "react-icons/tb";
import { HiOutlineUserGroup } from "react-icons/hi";
import LandingSidebarMenu from "./Landing/LandingSidebarMenu";

function Sidebar({
    collapsed,
    setCollapsed,
    darkMode,
    setDarkMode,
    toggleDarkMode,
}) {
    // 2. Get the auth user from Inertia shared props
    const { auth } = usePage().props;
    const userRole = auth?.user?.role;

    // 3. Define the restriction logic
    const isEmployee = userRole === "employee";

    const getLinkClass = (path) => {
        const isActive = window.location.pathname === path || (path !== '/admin' && window.location.pathname.startsWith(path));
        return `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
            isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white"
        }`;
    };

    return (
        <aside
            className={`dark:bg-slate-950 dark:text-white font-poppins sticky top-0 left-0 h-screen overflow-y-auto bg-white border-r border-slate-200/60 dark:border-slate-800/80 shadow-sm transform transition-all duration-300 z-50 flex-shrink-0
          ${collapsed ? "w-10 sm:w-12 hover:w-40" : " sm:w-40"} 
          lg:static`}
        >
            {/* Sidebar Header */}
            <div className="flex dark:text-white items-center justify-between px-3 h-16 border-b border-slate-200/60 dark:border-slate-800/80">
                {!collapsed && (
                    <h2 className="text-sm sm:text-base whitespace-nowrap font-bold tracking-tight text-slate-800 dark:text-white">
                        DEMAND<span className="text-blue-600 dark:text-blue-400"> BAZAR</span>
                    </h2>
                )}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                >
                    {collapsed ? (
                        <GiHamburgerMenu size={18} />
                    ) : (
                        <BsArrowLeftCircleFill size={18} />
                    )}
                </button>
            </div>

            {/* Menu Items */}
            <nav className="py-3 px-1.5 flex flex-col gap-1.5 group">
                {/* HIDE DASHBOARD IF EMPLOYEE */}
                {!isEmployee && (
                    <Link
                        href="/admin"
                        className={getLinkClass("/admin")}
                    >
                        <span>
                            <IoHome size={18} />
                        </span>
                        <span
                            className={`transition-all duration-300 text-sm whitespace-nowrap ${
                                collapsed
                                    ? "opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0"
                                    : ""
                            }`}
                        >
                            Dashboard
                        </span>
                    </Link>
                )}

                {/* HIDE CATEGORIES IF EMPLOYEE */}
                {!isEmployee && (
                    <Link
                        href="/admin/categories"
                        className={getLinkClass("/admin/categories")}
                    >
                        <span>
                            <TbCategory size={18} />
                        </span>
                        <span
                            className={`transition-all text-sm duration-300 whitespace-nowrap ${
                                collapsed
                                    ? "opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0"
                                    : ""
                            }`}
                        >
                            Category
                        </span>
                    </Link>
                )}

                {/* HIDE PRODUCTS IF EMPLOYEE */}
                {!isEmployee && (
                    <Link
                        href="/admin/products"
                        className={getLinkClass("/admin/products")}
                    >
                        <span>
                            <ShoppingBasket size={18} />
                        </span>
                        <span
                            className={`transition-all text-sm duration-300 whitespace-nowrap ${
                                collapsed
                                    ? "opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0"
                                    : ""
                            }`}
                        >
                            Products
                        </span>
                    </Link>
                )}

                {/* HIDE REVIEWS IF EMPLOYEE */}
                {!isEmployee && (
                    <Link
                        href="/admin/reviews"
                        className={getLinkClass("/admin/reviews")}
                    >
                        <span>
                            <Star size={18} />
                        </span>
                        <span
                            className={`transition-all text-sm duration-300 whitespace-nowrap ${
                                collapsed
                                    ? "opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0"
                                    : ""
                            }`}
                        >
                            Reviews
                        </span>
                    </Link>
                )}

                {/* HIDE USERS IF EMPLOYEE */}
                {!isEmployee && (
                    <Link
                        href="/admin/users"
                        className={getLinkClass("/admin/users")}
                    >
                        <span>
                            <GrUserManager size={18} />
                        </span>
                        <span
                            className={`transition-all text-sm duration-300 whitespace-nowrap ${
                                collapsed
                                    ? "opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0"
                                    : ""
                            }`}
                        >
                            Users
                        </span>
                    </Link>
                )}

                {/* HIDE EMPLOYEES IF EMPLOYEE */}
                {!isEmployee && (
                    <Link
                        href="/admin/employees"
                        className={getLinkClass("/admin/employees")}
                    >
                        <span>
                            <HiOutlineUserGroup size={18} />
                        </span>
                        <span
                            className={`transition-all text-sm duration-300 whitespace-nowrap ${
                                collapsed
                                    ? "opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0"
                                    : ""
                            }`}
                        >
                            Employees
                        </span>
                    </Link>
                )}

                {/* LANDING PAGE BUILDER (permission filtered inside the component) */}
                {!isEmployee && <LandingSidebarMenu collapsed={collapsed} />}

                {/* --- ALWAYS SHOW ORDERS --- */}
                <Link
                    href="/admin/orders"
                    className={getLinkClass("/admin/orders")}
                >
                    <span>
                        <ShoppingCart size={18} />
                    </span>
                    <span
                        className={`transition-all text-sm duration-300 whitespace-nowrap ${
                            collapsed
                                ? "opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0"
                                : ""
                        }`}
                    >
                        Orders
                    </span>
                </Link>

                {/* HIDE SETTINGS IF EMPLOYEE */}
                {!isEmployee && (
                    <Link
                        href="/admin/settings"
                        className={getLinkClass("/admin/settings")}
                    >
                        <span>
                            <MdSettings size={18} />
                        </span>
                        <span
                            className={`transition-all text-sm duration-300 whitespace-nowrap ${
                                collapsed
                                    ? "opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0"
                                    : ""
                            }`}
                        >
                            Settings
                        </span>
                    </Link>
                )}

                {/* Theme Toggle */}
                <button
                    onClick={() => toggleDarkMode(darkMode)}
                    className="px-3 py-2.5 items-center text-slate-600 rounded-lg flex gap-3 dark:text-slate-400 duration-300 whitespace-nowrap hover:cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white transition-colors overflow-hidden"
                >
                    <span>
                        <MdLightMode size={18} />
                    </span>
                    <span
                        className={`transition-all text-sm duration-300 whitespace-nowrap ${
                            collapsed
                                ? "opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0"
                                : ""
                        }`}
                    >
                        Theme
                    </span>
                </button>
            </nav>
        </aside>
    );
}

export default Sidebar;
