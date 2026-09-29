import React, { useState } from "react";
import { Link, router, usePage, Head } from "@inertiajs/react";
import { BsCartPlusFill, BsFilter, BsX } from "react-icons/bs";
import { Toaster, toast } from "react-hot-toast";
import FilterSidebar from "../../components/CustomerComponents/FilterSidebar";
import CustomerLayout from "@/Layouts/CustomerLayouts/CustomerLayout";
import ReactPixel from "react-facebook-pixel";
import ProductCard from "@/components/CustomerComponents/ProductCard";

function ProductWithCategory({ products, name }) {
    const { url } = usePage();

    const queryParams = new URLSearchParams(window.location.search);
    const initialMin = queryParams.get("min_price") || "";
    const initialMax = queryParams.get("max_price") || "";
    const initialSort = queryParams.get("sort") || "default";

    const [minPrice, setMinPrice] = useState(initialMin);
    const [maxPrice, setMaxPrice] = useState(initialMax);
    const [sortBy, setSortBy] = useState(initialSort);
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    const sortOptions = [
        { label: "Default", value: "default" },
        { label: "Newest First", value: "date_desc" },
        { label: "Oldest First", value: "date_asc" },
        { label: "Name A to Z", value: "name_asc" },
        { label: "Name Z to A", value: "name_desc" },
        { label: "Price High to Low", value: "price_desc" },
        { label: "Price Low to High", value: "price_asc" },
    ];

    const applyFilters = (newSort = sortBy, min = minPrice, max = maxPrice) => {
        router.get(
            window.location.pathname,
            { sort: newSort, min_price: min, max_price: max },
            { preserveScroll: true, preserveState: true },
        );
    };

    const handleSortChange = (e) => {
        const newSort = e.target.value;
        setSortBy(newSort);
        applyFilters(newSort, minPrice, maxPrice);
    };

    const handlePriceFilter = () => {
        applyFilters(sortBy, minPrice, maxPrice);
    };

    const clearFilters = () => {
        setMinPrice("");
        setMaxPrice("");
        setSortBy("default");
        router.get(window.location.pathname, {}, { preserveScroll: true });
    };

    // UPDATED: Syncing logic with SectionCard
    const handleAddToCart = (productId, shouldRedirect = false) => {
        const productToAdd = products?.data?.find((p) => p.id === productId);

        if (!productToAdd) return;

        if (productToAdd.stock <= 0) {
            toast.error("Sorry, this item is currently out of stock.");
            return;
        }

        const discountPercentage = productToAdd.discount
            ? Number(productToAdd.discount)
            : 0;
        const originalPrice = Number(productToAdd.price);
        const discountedPrice =
            originalPrice - originalPrice * (discountPercentage / 100);

        ReactPixel.track("AddToCart", {
            currency: "BDT",
            value: discountedPrice,
            content_name: productToAdd.name,
            content_ids: [productToAdd.id],
            content_type: "product",
        });

        router.post(
            "/cart/add",
            { product_id: productId, quantity: 1 },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (shouldRedirect) {
                        router.visit("/checkout");
                    } else {
                        toast.success("Successfully Added to Cart!");
                    }
                },
            },
        );
    };

    if (!products || !products.data) return null;
    const hasActivePriceFilter = minPrice || maxPrice;

    return (
        <div className="min-h-screen py-3 transition-colors duration-300">
            <Head title="Product With Category" />
            <Toaster />
            <div className="mx-auto max-w-[1200px]">
                <div className="mx-auto mt-5 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <aside className="hidden lg:block">
                            <FilterSidebar
                                minPrice={minPrice}
                                setMinPrice={setMinPrice}
                                maxPrice={maxPrice}
                                setMaxPrice={setMaxPrice}
                                onApplyPrice={handlePriceFilter}
                            />
                        </aside>

                        <div className="flex-1">
                            {/* Header Section */}
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-900 font-inter mb-2">
                                    {name}
                                </h1>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <span className="text-sm text-gray-500">
                                        {products.total} items found in {name}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <button
                                            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700"
                                            onClick={() =>
                                                setShowMobileFilter(true)
                                            }
                                        >
                                            <BsFilter size={16} />
                                            <span className="font-semibold">
                                                Filters
                                            </span>
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-inter text-gray-600">
                                                Sort:
                                            </span>
                                            <select
                                                value={sortBy}
                                                onChange={handleSortChange}
                                                className="border border-gray-300 font-inter rounded p-2 text-sm"
                                            >
                                                {sortOptions.map((opt) => (
                                                    <option
                                                        key={opt.value}
                                                        value={opt.value}
                                                    >
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PRODUCT GRID - UPDATED UI */}
                            <div className="grid font-inter gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {products.data.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </div>

                            {/* PAGINATION */}
                            <div className="flex justify-center mt-10 gap-2 flex-wrap">
                                {products.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || "#"}
                                        preserveScroll
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${link.active ? "bg-green-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"} ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Filter Drawer */}
                {showMobileFilter && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div
                            className="absolute inset-0 bg-black/50"
                            onClick={() => setShowMobileFilter(false)}
                        />
                        <div className="absolute left-0 top-0 bottom-0 w-80 bg-white p-6 shadow-xl overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Filters
                                </h2>
                                <button
                                    onClick={() => setShowMobileFilter(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <BsX size={24} />
                                </button>
                            </div>
                            <FilterSidebar
                                minPrice={minPrice}
                                setMinPrice={setMinPrice}
                                maxPrice={maxPrice}
                                setMaxPrice={setMaxPrice}
                                onApplyPrice={() => {
                                    handlePriceFilter();
                                    setShowMobileFilter(false);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

ProductWithCategory.layout = (page) => <CustomerLayout children={page} />;
export default ProductWithCategory;
