import React from "react";
import { CheckCircle, XCircle, Star, StarHalf } from "lucide-react";

const ProductInfo = ({
    product,
    discountedPrice,
    originalPrice,
    discountPercentage,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
}) => {
    // --- FLOOR RATING LOGIC ---
    const approvedReviews = product.reviews || [];
    const realReviewCount = approvedReviews.length;

    const realAverage =
        realReviewCount > 0
            ? approvedReviews.reduce((sum, curr) => sum + curr.rating, 0) /
              realReviewCount
            : 0;

    const initialRating = product.initial_rating
        ? parseFloat(product.initial_rating)
        : 0;

    const displayRating = (
        realAverage > initialRating ? realAverage : initialRating
    ).toFixed(1);

    const displayReviewCount = realReviewCount;

    const numericRating = parseFloat(displayRating);
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating - fullStars >= 0.5;
    const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

    // Parse colors and sizes safely
    const parseVariationList = (raw) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return typeof raw === "string" ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
        }
    };

    const colors = parseVariationList(product.colors || (product.color ? [product.color] : []));
    const sizes = parseVariationList(product.sizes);

    return (
        <>
            <h1 className="text-xl font-inter sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4 leading-tight">
                {product.name}
            </h1>

            {/* --- RATING SECTION --- */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                    {[...Array(fullStars)].map((_, i) => (
                        <Star
                            key={`full-${i}`}
                            className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400"
                        />
                    ))}
                    {hasHalfStar && (
                        <StarHalf className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                    )}
                    {[...Array(emptyStars)].map((_, i) => (
                        <Star
                            key={`empty-${i}`}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300"
                        />
                    ))}
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base font-bold text-gray-800">
                        {displayRating}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-gray-500">
                        ({displayReviewCount} reviews)
                    </span>
                </div>
            </div>

            {/* Pricing and Stock Status */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-5">
                <div className="flex items-baseline gap-3">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#059669]">
                        TK {Math.round(discountedPrice).toLocaleString()}
                    </p>
                    {discountPercentage > 0 && (
                        <p className="text-sm sm:text-base md:text-lg font-medium text-gray-400 line-through">
                            TK {originalPrice.toLocaleString()}
                        </p>
                    )}
                </div>

                <span className="hidden sm:block text-gray-300">|</span>

                <span
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${
                        product.stock > 0
                            ? "bg-[#D1FAE5] border-[#34D399] text-[#047857]"
                            : "bg-red-50 border-red-200 text-red-700"
                    }`}
                >
                    {product.stock > 0 ? (
                        <>
                            <CheckCircle size={14} /> Available
                        </>
                    ) : (
                        <>
                            <XCircle size={14} /> Unavailable
                        </>
                    )}
                </span>

                {product.bussiness_class === "free" && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        🎉 ফ্রি ডেলিভারি অফার
                    </span>
                )}
            </div>

            {/* COLOR VARIATION SELECTOR (Optional) */}
            {colors.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2 font-hindSiliguri">
                        <span className="text-sm font-bold text-gray-800">
                            কালার পছন্দ করুন:
                        </span>
                        {selectedColor && (
                            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                                {selectedColor}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {colors.map((color) => {
                            const isSelected = selectedColor === color;
                            return (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-1.5 ${
                                        isSelected
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200 font-bold"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                    }`}
                                >
                                    {isSelected && <CheckCircle size={14} />}
                                    {color}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SIZE VARIATION SELECTOR (Optional) */}
            {sizes.length > 0 && (
                <div className="mb-5">
                    <div className="flex items-center gap-2 mb-2 font-hindSiliguri">
                        <span className="text-sm font-bold text-gray-800">
                            সাইজ পছন্দ করুন:
                        </span>
                        {selectedSize && (
                            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                                {selectedSize}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => {
                            const isSelected = selectedSize === size;
                            return (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => setSelectedSize(size)}
                                    className={`min-w-[42px] px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all text-center ${
                                        isSelected
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200 font-bold"
                                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                    }`}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductInfo;
