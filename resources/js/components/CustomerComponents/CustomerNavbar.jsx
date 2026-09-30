import React, { useState } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { FiMenu, FiSearch } from "react-icons/fi";
import { IoPersonCircleOutline } from "react-icons/io5";
import {
    MdOutlineAddShoppingCart,
    MdPerson,
    MdPersonAddAlt,
    MdOutlineShoppingCart,
} from "react-icons/md";
import { HiOutlineLogout, HiOutlineLogin } from "react-icons/hi";
import { BsTable } from "react-icons/bs";
import Brand from "@/components/Brand";

function Navbar({ onToggleSidebar }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearchHovered, setIsSearchHovered] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const isSearchExpanded = isSearchHovered || isSearchFocused || searchTerm !== "";

    // Destructure auth and your cart count prop here.
    const { auth, cartCount = 0 } = usePage().props;
    const user = auth?.user;

    const isEmployee = user?.role === "employee";
    const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

    const getDashboardLink = () => {
        if (isEmployee) return "/admin/orders";
        if (isAdminOrManager) return "/admin";
        return "/dashboard"; // Customer
    };

    const getDashboardLabel = () => {
        if (isEmployee) return "Order Table";
        return "Dashboard";
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        router.get(
            "/productspage",
            { search: searchTerm },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    return (
        <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#0a0a18] via-[#121633] to-[#1e1b4b] shadow-lg shadow-indigo-950/40 border-b border-indigo-900/40 transition-colors duration-300">
            {/* Top Bar: Logo, Desktop Nav, and Icons */}
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Left: Hamburger (Mobile) + Logo */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg text-white hover:bg-white/10 transition"
                        aria-label="Menu"
                    >
                        <FiMenu size={24} />
                    </button>

                    <Link href="/" className="flex items-center group" aria-label="Unity Haven home">
                        <Brand tone="light" size="text-xl sm:text-2xl" />
                    </Link>
                </div>

                {/* Middle: Desktop Navigation (Hidden on Mobile) */}
                <div className="hidden lg:flex items-center gap-1">
                    <NavLink href="/productspage">Products</NavLink>
                    <NavLink href="/categories">Categories</NavLink>
                    <NavLink href="/about">About</NavLink>
                </div>

                {/* Right: Icons & Profile */}
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                    {/* EXPANDABLE INLINE SEARCH BAR */}
                    <div
                        onMouseEnter={() => setIsSearchHovered(true)}
                        onMouseLeave={() => setIsSearchHovered(false)}
                        className="relative flex items-center"
                    >
                        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                                placeholder="Search..."
                                className={`py-1.5 text-xs rounded-full bg-white/20 text-white placeholder-white/70 border border-white/10 focus:bg-white focus:text-slate-800 focus:placeholder-slate-400 focus:outline-none transition-all duration-300 ${isSearchExpanded ? "w-32 sm:w-44 pl-9 pr-3 opacity-100" : "w-0 p-0 border-transparent opacity-0"}`}
                            />
                            <button
                                type={isSearchExpanded ? "submit" : "button"}
                                onClick={() => !isSearchExpanded && setIsSearchFocused(true)}
                                className={`p-2 rounded-full transition-colors flex items-center justify-center ${isSearchExpanded ? "absolute left-1 text-slate-500" : "text-white hover:bg-white/10"}`}
                                aria-label="Search"
                            >
                                <FiSearch size={20} />
                            </button>
                        </form>
                    </div>

                    {/* CART ICON SECTION */}
                    <Link
                        href="/cart"
                        className="p-2.5 rounded-full text-white hover:bg-black/10 transition relative inline-flex items-center justify-center"
                    >
                        <MdOutlineShoppingCart size={22} />

                        {/* CONDITIONAL CART BADGE */}
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md">
                                {cartCount > 99 ? "99+" : cartCount}
                            </span>
                        )}
                    </Link>

                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-transparent hover:border-white/50 transition overflow-hidden"
                        >
                            {user ? (
                                <img
                                    className="w-full h-full object-cover"
                                    src={
                                        user.avatar ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FCD34D&color=064E3B`
                                    }
                                    alt={user.name}
                                />
                            ) : (
                                <IoPersonCircleOutline
                                    size={30}
                                    className="text-white"
                                />
                            )}
                        </button>

                        {/* Profile Dropdown */}
                        {isProfileOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsProfileOpen(false)}
                                />
                                <div className="absolute right-0 mt-3 w-60 max-w-[calc(100vw-1rem)] bg-white shadow-2xl rounded-xl py-2 z-50 border border-gray-100">
                                    {user ? (
                                        <>
                                            <div className="px-4 py-3 border-b">
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {user.email}
                                                </p>
                                            </div>

                                            <DropdownLink
                                                href={getDashboardLink()}
                                                icon={
                                                    isEmployee ? (
                                                        <BsTable size={18} />
                                                    ) : (
                                                        <MdPerson size={18} />
                                                    )
                                                }
                                            >
                                                {getDashboardLabel()}
                                            </DropdownLink>

                                            <div className="border-t my-1"></div>
                                            <Link
                                                href="/logout"
                                                method="post"
                                                as="button"
                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition font-medium"
                                            >
                                                <HiOutlineLogout size={18} />{" "}
                                                Log Out
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <DropdownLink
                                                href="/login"
                                                icon={
                                                    <HiOutlineLogin size={18} />
                                                }
                                            >
                                                Login
                                            </DropdownLink>
                                            <DropdownLink
                                                href="/register"
                                                icon={
                                                    <MdPersonAddAlt size={18} />
                                                }
                                            >
                                                Register
                                            </DropdownLink>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

// Sub-components
const NavLink = ({ href, children }) => (
    <Link
        href={href}
        className="px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/15 rounded-full transition-all"
    >
        {children}
    </Link>
);

const DropdownLink = ({ href, icon, children }) => (
    <Link
        href={href}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition"
    >
        {icon} {children}
    </Link>
);

export default Navbar;
