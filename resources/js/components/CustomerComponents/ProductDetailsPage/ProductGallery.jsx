import React from "react";

const ProductGallery = ({
    product,
    selectedImage,
    setSelectedImage,
    discountPercentage,
}) => {
    /**
     * Helper to extract the image path string.
     * Logic:
     * 1. If img is an object (from ProductImage model), return the 'image_path' property.
     * 2. If img is a string, return the string itself.
     */
    const getImagePath = (img) => {
        if (!img) return "";
        if (typeof img === "object") return img.image_path;
        return img;
    };

    /**
     * Professional Fix for the "/storage/0" error:
     * Sometimes Inertia/Laravel sends the gallery as an Object { "0": {...}, "1": {...} }
     * instead of a standard Array [ {...}, {...} ].
     * This forces it into a clean array.
     */
    const galleryItems = Array.isArray(product.images)
        ? product.images
        : Object.values(product.images || {});

    return (
        <div className="flex flex-col gap-4">
            {/* Main Featured Image */}
            <div className="relative group">
                <div className="relative overflow-hidden rounded-2xl border border-green-700 bg-gray-100 aspect-square shadow-lg">
                    {discountPercentage > 0 && (
                        <div className="absolute top-0 left-0 z-20 bg-orange-500 text-white text-sm sm:text-base font-bold px-3 py-1 rounded-br-lg shadow-sm">
                            -{discountPercentage}%
                        </div>
                    )}

                    {/* We prepend /storage/ to the path */}
                    <img
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500"
                        src={
                            selectedImage
                                ? `/storage/${selectedImage}`
                                : "/placeholder.png"
                        }
                        alt={product.name}
                        onError={(e) => {
                            e.target.src =
                                "https://placehold.co/600x600?text=Image+Not+Found";
                        }}
                    />

                    {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                            <span className="text-white font-bold text-xl sm:text-2xl xl:text-3xl uppercase tracking-widest border-2 sm:border-4 border-white px-4 py-2 sm:px-6 sm:py-3 -rotate-12">
                                Out of Stock
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Gallery Thumbnails Section */}
            {(product.image || galleryItems.length > 0) && (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    {/* 1. Main Thumbnail (Always show the primary image first) */}
                    {product.image && (
                        <button
                            onClick={() => setSelectedImage(product.image)}
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === product.image ? "border-green-600 scale-105 shadow-md" : "border-gray-200 opacity-70 hover:opacity-100"}`}
                        >
                            <img
                                src={`/storage/${product.image}`}
                                className="w-full h-full object-cover"
                                alt="main-thumbnail"
                            />
                        </button>
                    )}

                    {/* 2. Additional Gallery Images Loop */}
                    {galleryItems.map((img, index) => {
                        const path = getImagePath(img);

                        // CRITICAL PROTECTION:
                        // If path is missing, or is literally "0" (the index bug), skip rendering this thumbnail.
                        if (!path || path === "0" || typeof path === "number") {
                            return null;
                        }

                        return (
                            <button
                                key={`gallery-${index}`}
                                onClick={() => setSelectedImage(path)}
                                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === path ? "border-green-600 scale-105 shadow-md" : "border-gray-200 opacity-70 hover:opacity-100"}`}
                            >
                                <img
                                    src={`/storage/${path}`}
                                    className="w-full h-full object-cover"
                                    alt={`gallery-thumb-${index}`}
                                    onError={(e) => {
                                        // If specific thumbnail fails, show a placeholder
                                        e.target.src =
                                            "https://placehold.co/100x100?text=Error";
                                    }}
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProductGallery;
