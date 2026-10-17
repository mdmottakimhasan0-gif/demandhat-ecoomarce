import React, { useState, useEffect } from "react";
import CustomerNavbar from "../../components/CustomerComponents/CustomerNavbar";
import CustomerSidebar from "../../components/CustomerComponents/CustomerSidebar";
import Footer from "../../components/CustomerComponents/Footer";
import CustomerChatbot from "../../components/CustomerComponents/CustomerChatbot";
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
            <CustomerSidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <CustomerNavbar
                onToggleSidebar={() => setSidebarOpen(true)}
            />

            <main className="grow w-full">{children}</main>

            {/* AI Customer Chatbot */}
            <CustomerChatbot />

            <Footer />
        </div>
    );
}
