import React, { useState, useEffect } from "react";
import { Link, useForm, router } from "@inertiajs/react";
import { FiPlus, FiSearch, FiEdit2, FiTrash2 } from "react-icons/fi";
import AdminLayout from "../../../Layouts/AdminLayouts/AdminLayout";

const Products = ({ products = [], categories = [], filters = {} }) => {
    const { delete: destroy } = useForm();

    // Local states for filters
    const [search, setSearch] = useState(filters.search || "");
    const [category, setCategory] = useState(filters.category || "");
    const [status, setStatus] = useState(filters.status || "");

    // Native Debounce: Wait for user to stop typing before refreshing data
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            // Check if values actually changed to avoid unnecessary reloads
            if (
                search !== (filters.search || "") ||
                category !== (filters.category || "") ||
                status !== (filters.status || "")
            ) {
                router.get(
                    "/admin/products",
                    { search, category, status },
                    {
                        preserveState: true,
                        replace: true,
                        preserveScroll: true,
                    },
                );
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [search, category, status]);

    const handleDelete = (e, id) => {
        e.preventDefault();
        if (confirm("Are you sure you want to delete this product?")) {
            destroy(`/admin/products/${id}`, {
                onSuccess: () => alert("Product Deleted successfully!"),
            });
        }
    };

    const stockStatus = (stock) => {
        if (stock > 5) return "In Stock";
        if (stock <= 0) return "Out of Stock";
        return "Low Stock";
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "In Stock":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "Low Stock":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "Out of Stock":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="pb-10 font-poppins">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Products
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage your product inventory
                    </p>
                </div>
                <Link
                    href="/admin/products/create"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                >
                    <FiPlus size={18} />
                    Add Product
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-950 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200"
                        />
                    </div>

                    <div className="flex gap-3">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-300"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-300"
                        >
                            <option value="">Status</option>
                            <option value="instock">In Stock</option>
                            <option value="lowstock">Low Stock</option>
                            <option value="outofstock">Out of Stock</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4 border-b dark:border-gray-800">
                                    Product
                                </th>
                                <th className="p-4 border-b dark:border-gray-800">
                                    Category
                                </th>
                                <th className="p-4 border-b dark:border-gray-800">
                                    Stock
                                </th>
                                <th className="p-4 border-b dark:border-gray-800">
                                    Price
                                </th>
                                <th className="p-4 border-b dark:border-gray-800">
                                    Discount
                                </th>
                                <th className="p-4 border-b dark:border-gray-800">
                                    Status
                                </th>
                                <th className="p-4 border-b dark:border-gray-800">
                                    Business Class
                                </th>
                                <th className="p-4 border-b dark:border-gray-800 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {products.data && products.data.length > 0 ? (
                                products.data.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-200 flex-shrink-0 border dark:border-gray-700">
                                                    <img
                                                        src={`/storage/${product.image}`}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 dark:text-gray-200">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        ID: {product.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                            {product.category?.name}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                            {product.stock} units
                                        </td>
                                        <td className="p-4 font-medium text-gray-800 dark:text-gray-200">
                                            {product.price}
                                        </td>
                                        <td className="p-4 text-center font-medium text-gray-800 dark:text-gray-200">
                                            {product.discount}%
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${getStatusColor(stockStatus(product.stock))}`}
                                            >
                                                {stockStatus(product.stock)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm capitalize text-center text-gray-800 dark:text-gray-200">
                                            {product.bussiness_class}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/admin/products/${product.id}/edit`}
                                                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-blue-600 transition-colors"
                                                >
                                                    <FiEdit2 size={16} />
                                                </Link>
                                                <button
                                                    onClick={(e) =>
                                                        handleDelete(
                                                            e,
                                                            product.id,
                                                        )
                                                    }
                                                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-red-500 transition-colors"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="p-10 text-center text-gray-500"
                                    >
                                        No products found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total {products.total} products
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                        {products.links &&
                            products.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url ?? "#"}
                                    className={`px-3 py-1.5 text-sm rounded-md border dark:border-gray-700 ${
                                        link.active
                                            ? "bg-blue-600 text-white"
                                            : "bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300"
                                    } ${!link.url ? "opacity-50 cursor-default" : ""}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Layout setup
Products.layout = (page) => <AdminLayout children={page} />;

export default Products;
