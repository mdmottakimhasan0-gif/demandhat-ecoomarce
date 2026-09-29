import { Link } from "@inertiajs/react";
import React, { useState } from "react";
import { IoIosArrowDropdownCircle } from "react-icons/io";

const categories = [
    {
        id: 1,
        name: "Electronics",
        subcategories: ["Mobile Phones", "Laptops", "Headphones", "Cameras"],
    },
    {
        id: 2,
        name: "Fashion",
        subcategories: [
            "Men's Clothing",
            "Women's Clothing",
            "Shoes",
            "Accessories",
        ],
    },
    {
        id: 3,
        name: "Home & Living",
        subcategories: ["Furniture", "Kitchen", "Decor", "Garden"],
    },
    {
        id: 4,
        name: "Sports",
        subcategories: ["Fitness", "Outdoor", "Team Sports", "Water Sports"],
    },
    {
        id: 5,
        name: "Beauty",
        subcategories: ["Skincare", "Makeup", "Hair Care", "Fragrances"],
    },
    {
        id: 6,
        name: "Books",
        subcategories: ["Fiction", "Non-Fiction", "Educational", "Comics"],
    },
];

const Sidebar = () => {
    const [expandedCategory, setExpandedCategory] = useState(null);

    const toggleCategory = (categoryId) => {
        setExpandedCategory(
            expandedCategory === categoryId ? null : categoryId
        );
    };

    return (
        <div className="w-1/2 sm:w-full h-full bg-gray-200 shadow-lg">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">Categories</h2>
            </div>

            <div className="p-2">
                {categories.map((category) => (
                    <div key={category.id} className="mb-1 rounded border">
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full text-left px-3 py-2 rounded-md flex justify-between items-center transition-colors duration-200"
                        >
                            <span className="font-medium text-gray-700">
                                {category.name}
                            </span>
                            <span
                                className={`text-gray-500 transform transition-transform duration-200 ${ expandedCategory === category.id ? "rotate-90" : ""`}}
                            >
                                <IoIosArrowDropdownCircle />
                            </span>
                        </button>

                        {expandedCategory === category.id && (
                            <div className="p-2 mt-1 space-y-1">
                                {category.subcategories.map(
                                    (subcategory, index) => (
                                        <Link
                                            key={index}
                                            className="block w-full text-left py-2 px-2 hover:bg-slate-600 hover:rounded hover:text-white text-sm text-gray-600 transition-colors duration-200"
                                        >
                                            {subcategory}
                                        </Link>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Price Filter Section */}
            <div className="p-4 border-t border-gray-200 mt-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                    Price Range
                </h3>
                <div className="space-y-2">
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2 text-red-500" />
                        <span className="text-sm text-gray-600">
                            Under ৳1,000
                        </span>
                    </label>
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2 text-red-500" />
                        <span className="text-sm text-gray-600">
                            ৳1,000 - ৳5,000
                        </span>
                    </label>
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2 text-red-500" />
                        <span className="text-sm text-gray-600">
                            ৳5,000 - ৳10,000
                        </span>
                    </label>
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2 text-red-500" />
                        <span className="text-sm text-gray-600">
                            Above ৳10,000
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
