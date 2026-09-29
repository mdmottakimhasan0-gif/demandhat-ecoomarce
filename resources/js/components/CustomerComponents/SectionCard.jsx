import React from "react";
import { Link, router } from "@inertiajs/react";
import { BsCartPlusFill } from "react-icons/bs";
import { toast } from "react-hot-toast";
import ReactPixel from "react-facebook-pixel";

function SectionCard({ product }) {
    const discountPercentage = product.discount ? Number(product.discount) : 0;
    const originalPrice = Number(product.price);

    const discountedPrice =
        originalPrice - originalPrice * (discountPercentage / 100);

    /**
     * @param {number} productId
     * @param {boolean} shouldRedirect - If true, goes to checkout. If false, shows toast.
     */
    const handleAddToCart = (productId, shouldRedirect = false) => {
        if (product.stock <= 0) {
            toast.error("Sorry, this item is currently out of stock.");
            return;
        }

        ReactPixel.track("AddToCart", {
            currency: "BDT",
            value: discountedPrice,
            content_name: product.name,
            content_ids: [productId],
            content_type: "product",
        });

        router.post(
            "/cart/add",
            { product_id: productId, quantity: 1 },
            {
                preserveScroll: true,
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

    const isOutOfStock = product.stock <= 0;

    return (
        <div className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-md hover:border-slate-350 transition-all duration-300 cursor-pointer h-full">
            {/* Conditional Discount Badge */}
            {discountPercentage > 0 && (
                <div className="absolute top-0 left-0 z-10 bg-rose-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-br-xl shadow-sm font-poppins tracking-wider">
                    -{discountPercentage}%
                </div>
            )}

            {/* Cart Button (Add Only - Hidden when Out of Stock) */}
            {!isOutOfStock && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart(product.id, false);
                    }}
                    className="absolute top-3 right-3 z-10 bg-white/95 text-slate-700 p-2.5 rounded-full shadow-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transform scale-100 lg:scale-90 lg:group-hover:scale-100 transition-all duration-300 hover:bg-[#059669] hover:text-white hover:scale-105 active:scale-95 border border-slate-100"
                >
                    <BsCartPlusFill size={16} />
                </button>
            )}

            <Link
                href={`/product/${product.id}`}
                className="flex flex-col h-full"
            >
                {/* Image Container */}
                <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100/50">
                    <img
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
                        src={`/storage/${product.image}`}
                        alt={product.name}
                    />
                </div>

                {/* Content Section */}
                <div className="p-3.5 flex flex-col flex-grow">
                    <h3 className="font-poppins text-slate-800 font-semibold text-sm sm:text-base mb-1 line-clamp-1 group-hover:text-[#059669] transition-colors tracking-tight">
                        {product.name}
                    </h3>

                    <p className="text-slate-400 font-hindSiliguri text-xs mb-3 line-clamp-2 leading-relaxed">
                        {product.short_description || "Product description..."}
                    </p>

                    <div className="mt-auto space-y-3">
                        {/* Compact Inline Pricing */}
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-[#059669] text-lg">
                                Tk {Math.round(discountedPrice)}
                            </span>
                            {discountPercentage > 0 && (
                                <span className="text-slate-400 line-through text-xs font-medium">
                                    Tk {originalPrice}
                                </span>
                            )}
                        </div>

                        {/* Order Now Button */}
                        {isOutOfStock ? (
                            <button
                                disabled
                                className="w-full bg-slate-100 text-slate-400 font-semibold py-2 rounded-xl text-sm cursor-not-allowed border border-slate-200/40 text-center"
                            >
                                স্টক আউট
                            </button>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAddToCart(product.id, true);
                                }}
                                className="w-full bg-[#059669] hover:bg-[#047857] text-white font-medium py-2 rounded-xl text-sm transition-all duration-300 transform active:scale-95 shadow-sm hover:shadow"
                            >
                                অর্ডার করুন
                            </button>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}

export default SectionCard;
