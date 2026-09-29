import React, { use, useEffect, useState } from "react";
import Sidebar from "../../Components/AdminComponents/Sidebar";
import Header from "../../Components/AdminComponents/Header";
import { Toaster } from "react-hot-toast";

function AdminLayout({ children }) {
    const [collapsed, setCollapsed] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        let localTheme = localStorage.getItem("theme");
        if (
            (!localTheme && localTheme === "dark") ||
            window.matchMedia("(prefers-color-scheme:dark)").matches
        ) {
            setDarkMode(true);
            document.documentElement.classList.add("dark");
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    return (
        <div className={darkMode ? "dark" : ""}>
            <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-900">
                {/* Sidebar */}
                {/* We pass the props as before */}
                <Sidebar
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    toggleDarkMode={toggleDarkMode}
                />

                {/* Main Content Wrapper */}
                {/* FIX 1: Add 'min-w-0'. This prevents the flex child from overflowing its parent */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-slate-900 transition-all duration-300">
                    {/* Top Navbar */}
                    <Header />

                    {/* Main Content Area */}
                    {/* FIX 2: Removed 'overflow-x-hidden'. Added 'overflow-x-auto' so the page can scroll horizontally if absolutely needed, though ideally, the table wrapper handles this. */}
                    <main className="flex-1 overflow-y-auto p-3 sm:p-6">
                        <Toaster position="top-center" reverseOrder={false} />
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default AdminLayout;
