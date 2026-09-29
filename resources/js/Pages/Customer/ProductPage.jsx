import React, { useEffect } from "react";
import CustomerLayout from "../../Layouts/CustomerLayouts/CustomerLayout";
import ProductCard from "@/components/CustomerComponents/ProductCard";
import ReactPixel from "react-facebook-pixel";
import { Link, Head } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";

function ProductPage({ products }) {
    const productList = Array.isArray(products) ? products : products.data;
    const paginationLinks = !Array.isArray(products) ? products.links : [];

    useEffect(() => {
        if (!productList || productList.length === 0) return;

        const eventId = "viewlist_" + Date.now();
        const contentIds = productList.map((p) => p.id);

        // Facebook Pixel Client-side
        ReactPixel.track(
            "ViewContent",
            {
                content_ids: contentIds,
                content_name: "Product Listing Page",
                content_type: "product",
            },
            { eventID: eventId },
        );

        // Google Tag Manager Server-Side
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({
            event: "view_item_list",
            event_id: eventId,
            ecommerce: {
                item_list_name: "All Products",
                items: productList.map((p, index) => ({
                    item_id: p.id,
                    item_name: p.name,
                    price: p.price,
                    index: index,
                })),
            },
        });
    }, [productList]);

    return (
        <div className="mx-auto mt-8 max-w-[1200px] px-4">
            <Head title="All Products" />
            <Toaster position="top-right" />

            <div className="flex items-center justify-between border-b pb-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold font-inter text-slate-800">
                    All Products
                </h1>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {productList.length} Items Found
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                {productList.length > 0 ? (
                    productList.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-20">
                        <p className="text-gray-400 text-lg">
                            No products found matching your search.
                        </p>
                        <Link
                            href="/"
                            className="text-green-600 font-bold mt-2 inline-block"
                        >
                            Go back home
                        </Link>
                    </div>
                )}
            </div>

            {paginationLinks.length > 0 && (
                <div className="flex justify-center mt-12 gap-2 flex-wrap mb-10">
                    {paginationLinks.map((link, index) => (
                        <Link
                            key={index}
                            href={link.url || "#"}
                            preserveScroll
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                                ${
                                    link.active
                                        ? "bg-[#059669] text-white shadow-lg shadow-[#059669]/30"
                                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                                }
                                ${!link.url && "opacity-40 cursor-not-allowed"}
                            `}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

ProductPage.layout = (page) => <CustomerLayout>{page}</CustomerLayout>;
export default ProductPage;
