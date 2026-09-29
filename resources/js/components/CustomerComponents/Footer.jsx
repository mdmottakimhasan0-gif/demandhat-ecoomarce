import React from "react";
import Brand from "@/components/Brand";

const Footer = () => {
    return (
        <footer className="bg-gradient-to-b from-[#064E3B] to-[#022C22] text-white border-t-4 border-amber-400">
            {/* Main Footer Content */}

            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="col-span-1 lg:col-span-1">
                        <div className="mb-4">
                            <Brand tone="light" size="text-2xl" />
                        </div>
                        <p className="font-hindSiliguri text-[#D1D5DB] text-sm mb-4 leading-relaxed">
                            আসসালামু আলাইকুম। আপনার প্রয়োজনীয় পণ্য বুঝে নিন
                            হাতের কাছে, আমরা আছি আপনাদের সাথে। টেকনাফ থেকে
                            তেতুলিয়া আমরা দিচ্ছি ক্যাশ অন ডেলিভারি। ধন্যবাদ।
                        </p>
                        <div className="flex space-x-4">
                            {/* Facebook Link Updated */}
                            <a
                                href="https://www.facebook.com/DemandHat"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#D1D5DB] hover:text-[#34D399] transition-colors"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                                </svg>
                            </a>
                            <a
                                href="#"
                                className="text-[#D1D5DB] hover:text-[#34D399] transition-colors"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 border-b border-[#34D399] w-fit">
                            Quick Links
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="/"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    Home
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/productspage"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    Products
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/categories"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    Categories
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/offers"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    Hot Deals
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/about"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    About Us
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 border-b border-[#34D399] w-fit">
                            Trending
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="#"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    Lifestyle Items
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    Gadgets
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    Home Appliances
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    Fashion
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    Daily Essentials
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Support */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 border-b border-[#34D399] w-fit">
                            Support
                        </h3>
                        <ul className="space-y-2 mb-4">
                            <li>
                                <a
                                    href="#"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    Shipping Policy
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    Return & Refund
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="text-[#D1D5DB] hover:text-white transition-colors text-sm"
                                >
                                    Track Order
                                </a>
                            </li>
                        </ul>

                        {/* Contact Info */}
                        <div className="text-sm text-[#D1D5DB] space-y-2">
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                info@demandhatbd.com
                            </p>
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                +88 01898-385395
                            </p>
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" /></svg>
                                Cash on Delivery Available
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Newsletter Section */}
            <div className="border-t border-[#4B5563]">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="mb-4 md:mb-0">
                            <h3 className="text-lg font-semibold mb-1">
                                Stay Updated
                            </h3>
                            <p className="text-[#D1D5DB] text-sm">
                                Get the latest offers delivered to your inbox
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 w-full px-4 py-2 bg-[#1F2937] border border-[#4B5563] rounded-lg text-white focus:outline-none focus:border-[#34D399]"
                            />
                            <button className="w-full sm:w-auto px-6 py-2 bg-[#059669] text-white rounded-lg hover:bg-[#047857] transition-colors font-medium">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Footer */}
            <div className="border-t border-[#4B5563] bg-[#022C22]">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="text-sm text-[#9CA3AF] text-center md:text-left">
                            <p>
                                &copy; {new Date().getFullYear()} Demand Bazar. All
                                rights reserved.
                            </p>
                        </div>
                        <div className="flex space-x-6 mt-4 md:mt-0 justify-center md:justify-end">
                            <a
                                href="#"
                                className="text-xs text-[#9CA3AF] hover:text-white"
                            >
                                Privacy Policy
                            </a>
                            <a
                                href="#"
                                className="text-xs text-[#9CA3AF] hover:text-white"
                            >
                                Terms of Service
                            </a>
                        </div>
                    </div>

                    {/* Payment & Delivery Methods */}
                    {/* <div className="mt-4 pt-4 border-t border-[#4B5563]">
                        <div className="flex flex-wrap items-center justify-center md:justify-between gap-4">
                            <span className="text-xs text-[#9CA3AF] uppercase tracking-widest">
                                Safe & Secure Shopping
                            </span>
                            <div className="flex items-center space-x-3 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                                <span className="text-xs font-bold border px-2 py-0.5 rounded border-[#4B5563]">
                                    BKASH
                                </span>
                                <span className="text-xs font-bold border px-2 py-0.5 rounded border-[#4B5563]">
                                    NAGAD
                                </span>
                                <span className="text-xs font-bold border px-2 py-0.5 rounded border-[#4B5563]">
                                    VISA
                                </span>
                                <span className="text-xs font-bold border px-2 py-0.5 rounded border-[#4B5563]">
                                    COD
                                </span>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
