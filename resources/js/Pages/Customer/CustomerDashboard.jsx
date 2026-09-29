import React from "react";
import { Link, usePage, Head } from "@inertiajs/react";
import CustomerLayout from "@/Layouts/CustomerLayouts/CustomerLayout";
import {
    User,
    Mail,
    Phone,
    Package,
    ShoppingCart,
    CheckCircle,
    LogOut,
    UserCircle,
} from "lucide-react";
// Import the separate component we created
import RecentOrdersTable from "@/components/CustomerComponents/RecentOrdersTable";

function CustomerDashboard() {
    // Extracting data from Inertia props
    const { auth, orders = [] } = usePage().props;
    const user = auth?.user;

    // Logic for top stat cards
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
        (o) => o.order_status === "pending",
    ).length;
    const completedOrders = orders.filter((o) =>
        ["delivered", "completed", "success"].includes(
            o.order_status?.toLowerCase(),
        ),
    ).length;

    return (
        <div className="min-h-screen font-hindSiliguri bg-gray-50/50 pb-20">
            <Head title="Dashboard" />
            <div className="max-w-6xl mx-auto px-4 pt-8">
                {/* 1. Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        স্বাগতম,{" "}
                        <span className="text-[#059669]">{user?.name}</span>!
                    </h1>
                    <p className="text-gray-500 mt-1">
                        আপনার অ্যাকাউন্টের বিস্তারিত এবং সাম্প্রতিক কার্যক্রম
                        এখানে দেখুন।
                    </p>
                </div>

                {/* 2. Dynamic Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <StatCard
                        icon={<Package className="text-blue-600" />}
                        label="মোট অর্ডার (Total)"
                        value={totalOrders.toString().padStart(2, "0")}
                        bg="bg-blue-50"
                    />
                    <StatCard
                        icon={<ShoppingCart className="text-orange-600" />}
                        label="অপেক্ষমান (Pending)"
                        value={pendingOrders.toString().padStart(2, "0")}
                        bg="bg-orange-50"
                    />
                    <StatCard
                        icon={<CheckCircle className="text-green-600" />}
                        label="সম্পন্ন (Completed)"
                        value={completedOrders.toString().padStart(2, "0")}
                        bg="bg-green-50"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 3. Left Column: Profile & Navigation */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Summary Card */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
                            <div className="relative inline-block mb-4">
                                <img
                                    src="/carousel/customeres.png"
                                    alt="Profile"
                                    className="w-28 h-28 mx-auto rounded-full border-4 border-[#059669] object-cover transition-transform duration-300 hover:scale-105"
                                />
                                <div className="absolute bottom-1 right-1 bg-green-500 p-1 rounded-full border-2 border-white">
                                    <CheckCircle
                                        size={12}
                                        className="text-white"
                                    />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900">
                                {user?.name}
                            </h2>
                            <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">
                                {user?.role || "Customer"}
                            </p>

                            <div className="mt-6">
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors"
                                >
                                    <LogOut size={16} />
                                    লগ আউট করুন
                                </Link>
                            </div>
                        </div>

                        {/* Quick Navigation Links */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 px-2">
                                শর্টকাট মেনু
                            </h3>
                            <ul className="space-y-1">
                                <QuickLink
                                    href="/cart"
                                    icon={<ShoppingCart size={18} />}
                                    label="শপিং কার্ট"
                                />
                            </ul>
                        </div>
                    </div>

                    {/* 4. Right Column: Contact Info & Recent Orders */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                                <User size={20} className="text-[#059669]" />
                                ব্যক্তিগত তথ্য (Profile Details)
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InfoItem
                                    icon={<Mail size={18} />}
                                    label="ইমেইল অ্যাড্রেস"
                                    value={user?.email}
                                    verified={user?.email_verified_at}
                                />
                                <InfoItem
                                    icon={<Phone size={18} />}
                                    label="ফোন নম্বর"
                                    value={user?.phone || "দেওয়া হয়নি"}
                                />
                            </div>
                        </div>

                        {/* Recent Orders Component */}
                        <RecentOrdersTable orders={orders} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Sub-Component: StatCard
 */
const StatCard = ({ icon, label, value, bg }) => (
    <div
        className={`p-6 rounded-3xl ${bg} flex items-center gap-4 border border-white shadow-sm transition-all hover:shadow-md`}
    >
        <div className="bg-white p-3.5 rounded-2xl shadow-sm text-xl">
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                {label}
            </p>
            <p className="text-3xl font-black text-gray-900">{value}</p>
        </div>
    </div>
);

/**
 * Sub-Component: InfoItem
 */
const InfoItem = ({ icon, label, value, verified }) => (
    <div className="flex flex-col gap-1.5">
        <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5">
            {label}
            {verified && (
                <span className="flex items-center text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full lowercase">
                    <CheckCircle size={10} className="mr-1" /> verified
                </span>
            )}
        </p>
        <div className="flex items-center gap-3 text-gray-800 font-semibold group">
            <span className="text-[#059669] opacity-70 group-hover:opacity-100 transition-opacity">
                {icon}
            </span>
            <span className="truncate text-base">{value}</span>
        </div>
    </div>
);

/**
 * Sub-Component: QuickLink
 */
const QuickLink = ({ href, icon, label }) => (
    <li>
        <Link
            href={href}
            className="flex items-center gap-4 p-3.5 rounded-2xl text-gray-600 hover:text-[#059669] hover:bg-green-50 transition-all font-bold group"
        >
            <span className="p-2 bg-gray-50 rounded-xl group-hover:bg-white transition-colors">
                {icon}
            </span>
            {label}
        </Link>
    </li>
);

// Setting the layout
CustomerDashboard.layout = (page) => <CustomerLayout>{page}</CustomerLayout>;

export default CustomerDashboard;
