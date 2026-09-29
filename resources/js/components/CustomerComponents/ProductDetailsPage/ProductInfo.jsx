import React from "react";
import { CheckCircle, XCircle, Star, StarHalf } from "lucide-react";
import SafeHTML from "../../CustomerComponents/SafeHTML";

const ProductInfo = ({
    product,
    discountedPrice,
    originalPrice,
    discountPercentage,
}) => {
    // --- FLOOR RATING LOGIC ---
    const approvedReviews = product.reviews || [];
    const realReviewCount = approvedReviews.length;

    // Calculate the actual average of approved reviews
    const realAverage =
        realReviewCount > 0
            ? approvedReviews.reduce((sum, curr) => sum + curr.rating, 0) /
              realReviewCount
            : 0;

    const initialRating = product.initial_rating
        ? parseFloat(product.initial_rating)
        : 0;

    // Core Logic: If real average exceeds initial rating, show real. Otherwise, show initial.
    const displayRating = (
        realAverage > initialRating ? realAverage : initialRating
    ).toFixed(1);

    // Review count is ALWAYS the actual count
    const displayReviewCount = realReviewCount;

    // Logic to calculate stars
    const numericRating = parseFloat(displayRating);
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating - fullStars >= 0.5;
    const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

    return (
        <>
            <h1 className="text-xl font-inter sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4 leading-tight">
                {product.name}
            </h1>

            {/* --- RATING SECTION --- */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                    {/* Render Full Stars */}
                    {[...Array(fullStars)].map((_, i) => (
                        <Star
                            key={`full-${i}`}
                            className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400"
                        />
                    ))}

                    {/* Render Half Star if applicable */}
                    {hasHalfStar && (
                        <StarHalf className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                    )}

                    {/* Render Empty Stars */}
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

            {product.short_description && (
                <p className="font-semibold text-lg font-hindSiliguri tracking-tight text-gray-900 my-2">
                    {product.short_description}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
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
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${product.stock > 0 ? "bg-[#D1FAE5] border-[#34D399] text-[#047857]" : "bg-red-50 border-red-200 text-red-700"}`}
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
            </div>

            {product.quick_view && (
                <div className="mb-6 md:mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        Quick Overview
                    </h3>
                    <SafeHTML html={product.quick_view} />
                </div>
            )}
        </>
    );
};

export default ProductInfo;
