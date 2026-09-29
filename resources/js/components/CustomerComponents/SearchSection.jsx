import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { FiSearch, FiX } from "react-icons/fi";

const SearchSection = () => {
    // Get existing search query from URL to populate input (if user refreshes)
    const { url } = usePage();
    const queryParams = new URLSearchParams(window.location.search);
    const initialSearch = queryParams.get("search") || "";

    const [searchTerm, setSearchTerm] = useState(initialSearch);

    const handleSearch = (e) => {
        e.preventDefault();

        // 1. Define the route where search results should appear.
        // CHANGE '/productspage' to your actual product listing route
        const searchRoute = "/productspage";

        router.get(
            searchRoute,
            {
                search: searchTerm, // Sends ?search=Value
                // maintain other filters if needed (e.g. sort)
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true, // Prevents cluttering browser history
            },
        );
    };

    const clearSearch = () => {
        setSearchTerm("");
        // Optional: If you want clearing to immediately reload all products:
        // router.get('/productspage');
    };

    return (
        <div className="w-full max-w-3xl mx-auto mt-1 mb-1 px-1">
            <form onSubmit={handleSearch} className="relative group">
                {/* Input Field */}
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Product Name...."
                    className="w-full py-2 pl-10 pr-10 bg-white/90 text-gray-800 rounded-lg shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white placeholder-gray-500 transition-all duration-300"
                />

                {/* Search Icon (Left) */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch
                        className="text-gray-500 group-focus-within:text-[#059669]"
                        size={18}
                    />
                </div>

                {/* Clear/Submit Action (Right) */}
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="p-1 mr-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <FiX size={16} />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default SearchSection;
