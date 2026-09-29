import React from "react";
// FIX 1: Import 'router' so the cart function works
import { Link, router } from "@inertiajs/react";
import { BsCartPlusFill } from "react-icons/bs";
import { toast } from "react-hot-toast";
import ReactPixel from "react-facebook-pixel";

// FIX 2: Corrected spelling from NewArraivals to NewArrivals
function NewArrivals({ products }) {
    const handleAddToCart = (productId) => {
        const productToAdd = products.find((p) => p.id === productId);
        if (productToAdd.stock <= 0) {
            toast.error("Sorry, this item is currently out of stock.");
            return;
        } else {
            if (productToAdd) {
                ReactPixel.track("AddToCart", {
                    currency: "USD",
                    value: productToAdd.price, // Use the found object
                    content_name: productToAdd.name, // Use the found object
                    content_ids: [productId],
                    content_type: "product",
                });
            }

            router.post(
                "/cart/add",
                {
                    product_id: productId,
                    quantity: 1,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success("Successfully Added to Cart!");
                    },
                },
            );
        }

        // 2. Check if found (safety measure) and Track
    };

    // Safety check if products is undefined
    if (!products) return null;

    return (
        <div className="pt-5 mt-5 px-5 bg-white">
            <div className="max-w-[1200px] mx-auto">
                <h1
                    className="text-2xl md:text-3xl mb-6 tracking-tight text-gray-900 font-bold font-poppins px-2"
                >
                    New Arrivals
                </h1>

                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="group relative flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden cursor-pointer"
                        >
                            {/* Card content Link */}
                            {/* FIX 3: Removed the onClick check. The button is outside this Link, so no conflict exists. */}
                            <Link
                                href={`/product/${product.id}`}
                                className="flex flex-col flex-1"
                            >
                                {/* Image Container */}
                                <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                                    <img
                                        className="h-full w-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
                                        src={`/storage/${product.image}`}
                                        alt={product.name}
                                    />
                                </div>

                                {/* Content Section */}
                                <div className="p-3 flex flex-col flex-1">
                                    <h3 className="font-poppins text-gray-900 font-bold mb-1 line-clamp-1">
                                        {product.name}
                                    </h3>
                                    <p className="text-gray-700 font-inter text-sm mb-1 line-clamp-2 leading-relaxed">
                                        {product.short_description ||
                                            "Product description..."}
                                    </p>

                                    <div
                                        className="mt-auto flex items-center justify-between border-t border-gray-100"
                                    >
                                        <div className="">
                                            <span className="font-bold text-[#059669] font-poppins text-lg">
                                                Tk {product.price}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* Cart Button */}
                            <button
                                onClick={(e) => {
                                    // stopPropagation prevents the click from triggering parent div events (if any)
                                    e.stopPropagation();
                                    handleAddToCart(product.id);
                                }}
                                // FIX 4: Mobile Responsiveness
                                // Changed 'opacity-0' to 'opacity-100 lg:opacity-0'.
                                // Now the button is ALWAYS visible on mobile/tablet, but hides and waits for hover on Desktop (lg).
                                className="absolute top-3 right-3 z-10 bg-[#059669]/90 backdrop-blur-sm text-white p-2 rounded-full shadow-sm border-none opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transform scale-100 lg:scale-90 lg:group-hover:scale-100 transition-all duration-300 cursor-pointer hover:bg-[#047857] active:scale-95"
                            >
                                <BsCartPlusFill size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default NewArrivals;
