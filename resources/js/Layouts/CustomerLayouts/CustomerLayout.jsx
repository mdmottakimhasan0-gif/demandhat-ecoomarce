import React, { useState, useEffect } from "react";
import CustomerNavbar from "../../components/CustomerComponents/CustomerNavbar";
import CustomerSidebar from "../../components/CustomerComponents/CustomerSidebar";
import Footer from "../../components/CustomerComponents/Footer";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "@inertiajs/react";
import Marqueee from "@/components/CustomerComponents/Marqueee";

export default function CustomerLayout({ children }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // This is the "Magic" fix.
    // It runs every time this layout is loaded and forces the <html> tag
    // to remove the "dark" class left behind by the Admin panel.
    useEffect(() => {
        document.documentElement.classList.remove("dark");
        // Also ensure localStorage is set to light so it doesn't flip back
        localStorage.setItem("theme", "light");
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-white text-gray-800 transition-colors duration-300 font-poppins relative">
            {/* 
               Note: I removed "dark:bg-[#182216]" from the div above 
               to ensure the base is always clean white. 
            */}

            <CustomerSidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <CustomerNavbar
                onToggleSidebar={() => setSidebarOpen(true)}
                // Removed isDarkMode and toggleDarkMode props
                // because they are no longer used.
            />

            {/* <Link className="float-right bottom-16 p-2 shadow-lg hover:cursor-pointer hover:scale-110  bg-[#25d366] transition-all duration-200 text-gray-200 fixed rounded-full  right-4 z-[9999999] ">
                <FaWhatsapp size={30} className="  " />
            </Link> */}

            <main className="grow w-full">{children}</main>

            <Footer />
        </div>
    );
}
