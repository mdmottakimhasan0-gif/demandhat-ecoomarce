import AdminLayout from "@/Layouts/AdminLayouts/AdminLayout";
import React, { useState } from "react";
import { Link, useForm, router } from "@inertiajs/react";
import { FiArrowLeft, FiUploadCloud, FiX, FiPlus, FiAlertCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import TiptapEditor from "../../../components/AdminComponents/TiptapEditor";

function EditProduct({ categories = [], product = {} }) {
    // 1. Calculate the initial selling price based on existing DB price/discount
    const initialPrice = parseFloat(product.price) || 0;
    const initialDiscount = parseFloat(product.discount) || 0;
    const initialSellingPrice =
        initialDiscount > 0
            ? initialPrice - initialPrice * (initialDiscount / 100)
            : initialPrice;

    // Parse initial colors & sizes if needed
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

    const initialColors = parseVariationList(product.colors || (product.color ? [product.color] : []));
    const initialSizes = parseVariationList(product.sizes);

    const { data, setData, post, processing, errors } = useForm({
        productName: product.name || "",
        category: product.category_id || "",
        price: product.price || "",
        selling_price: initialSellingPrice || "",
        stock: product.stock || "",
        bussiness_class: product.bussiness_class || "normal",
        productDetails: product.description || "",
        discount: product.discount || 0,
        initial_rating: product.initial_rating || "",
        colors: initialColors,
        sizes: initialSizes,
        image: null,
        gallery: [],
        _method: "PATCH",
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [colorInput, setColorInput] = useState("");
    const [sizeInput, setSizeInput] = useState("");

    const PRESET_COLORS = [
        "কালো (Black)",
        "সাদা (White)",
        "লাল (Red)",
        "নীল (Blue)",
        "সবুজ (Green)",
        "হলুদ (Yellow)",
        "গোলাপি (Pink)",
        "ছাই (Ash)",
    ];

    const PRESET_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "Free Size"];

    const handleAddColor = (colorToAdd) => {
        const val = (colorToAdd || colorInput).trim();
        if (!val) return;
        if (!data.colors.includes(val)) {
            setData("colors", [...data.colors, val]);
        }
        setColorInput("");
    };

    const handleRemoveColor = (indexToRemove) => {
        setData(
            "colors",
            data.colors.filter((_, i) => i !== indexToRemove)
        );
    };

    const handleAddSize = (sizeToAdd) => {
        const val = (sizeToAdd || sizeInput).trim();
        if (!val) return;
        if (!data.sizes.includes(val)) {
            setData("sizes", [...data.sizes, val]);
        }
        setSizeInput("");
    };

    const handleRemoveSize = (indexToRemove) => {
        setData(
            "sizes",
            data.sizes.filter((_, i) => i !== indexToRemove)
        );
    };

    // 2. Override Handle Change to auto-calculate discount
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "price" || name === "selling_price") {
            const priceVal =
                name === "price" ? parseFloat(value) : parseFloat(data.price);
            const sellingVal =
                name === "selling_price"
                    ? parseFloat(value)
                    : parseFloat(data.selling_price);

            let discountVal = data.discount;

            if (
                !isNaN(priceVal) &&
                !isNaN(sellingVal) &&
                priceVal > 0 &&
                priceVal >= sellingVal
            ) {
                discountVal = (
                    ((priceVal - sellingVal) / priceVal) *
                    100
                ).toFixed(2);
                discountVal = parseFloat(discountVal);
            } else if (
                !isNaN(priceVal) &&
                !isNaN(sellingVal) &&
                sellingVal > priceVal
            ) {
                discountVal = 0;
            }

            setData((prev) => ({
                ...prev,
                [name]: value,
                discount: discountVal,
            }));
        } else {
            setData(name, value);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("image", file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        setData("gallery", [...data.gallery, ...files]);
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setGalleryPreviews([...galleryPreviews, ...newPreviews]);
    };

    const removeNewGalleryImage = (index) => {
        const updatedGallery = data.gallery.filter((_, i) => i !== index);
        const updatedPreviews = galleryPreviews.filter((_, i) => i !== index);
        setData("gallery", updatedGallery);
        setGalleryPreviews(updatedPreviews);
    };

    const deleteExistingImage = (imageId) => {
        if (
            confirm(
                "Are you sure you want to remove this gallery image permanently?"
            )
        ) {
            router.delete(`/admin/products/gallery/${imageId}`, {
                preserveScroll: true,
                onSuccess: () => toast.success("Image removed"),
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/admin/products/${product.id}`, {
            forceFormData: true,
            onSuccess: () => toast.success("Product updated successfully!"),
            onError: (formErrors) => {
                const errValues = Object.values(formErrors);
                if (errValues.length > 0) {
                    toast.error(errValues[0], { duration: 5000 });
                } else {
                    toast.error("Please check the form for errors.");
                }

                setTimeout(() => {
                    const firstErrorEl = document.querySelector(".field-has-error");
                    if (firstErrorEl) {
                        firstErrorEl.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                        });
                    }
                }, 100);
            },
        });
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <div className="max-w-5xl mx-auto pb-12 font-poppins">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Edit Product
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Editing: <span className="font-semibold text-gray-700 dark:text-gray-200">{product.name}</span>
                    </p>
                </div>
                <Link
                    href="/admin/products"
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                >
                    <FiArrowLeft /> Back to Products
                </Link>
            </div>

            {/* TOP ERROR SUMMARY ALERT */}
            {hasErrors && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold mb-2">
                        <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <span>ফর্মে কিছু ভুল বা তথ্য বাদ পড়েছে (Please fix the following issues):</span>
                    </div>
                    <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 ml-2">
                        {Object.entries(errors).map(([key, msg]) => (
                            <li key={key}>
                                <span className="font-semibold capitalize">
                                    {key === "productName"
                                        ? "Product Name"
                                        : key === "productDetails"
                                        ? "Product Details"
                                        : key === "bussiness_class"
                                        ? "Delivery Class"
                                        : key.replace("_", " ")}
                                    :
                                </span>{" "}
                                {msg}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. BASIC INFORMATION */}
                <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-200 border-b pb-3">
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Name */}
                        <div className={`col-span-1 md:col-span-2 ${errors.productName ? "field-has-error" : ""}`}>
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Product Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="productName"
                                value={data.productName}
                                onChange={handleChange}
                                className={`w-full p-2.5 bg-gray-50 dark:bg-slate-900 border ${
                                    errors.productName
                                        ? "border-red-500 ring-2 ring-red-100 dark:ring-red-950"
                                        : "border-gray-300 dark:border-gray-700"
                                } rounded-lg dark:text-white transition-all`}
                            />
                            {errors.productName && (
                                <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                                    <FiAlertCircle className="inline" /> {errors.productName}
                                </p>
                            )}
                        </div>

                        {/* Category */}
                        <div className={errors.category ? "field-has-error" : ""}>
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="category"
                                value={data.category}
                                onChange={handleChange}
                                className={`w-full p-2.5 bg-gray-50 dark:bg-slate-900 border ${
                                    errors.category
                                        ? "border-red-500 ring-2 ring-red-100 dark:ring-red-950"
                                        : "border-gray-300 dark:border-gray-700"
                                } rounded-lg dark:text-white transition-all`}
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                                    <FiAlertCircle className="inline" /> {errors.category}
                                </p>
                            )}
                        </div>

                        {/* Delivery / Business Class */}
                        <div className={errors.bussiness_class ? "field-has-error" : ""}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium dark:text-gray-300">
                                    Delivery / Business Class <span className="text-red-500">*</span>
                                </label>
                                {data.bussiness_class === "free" && (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                        🎉 Free Shipping Offer
                                    </span>
                                )}
                            </div>
                            <select
                                name="bussiness_class"
                                value={data.bussiness_class || "normal"}
                                onChange={handleChange}
                                className={`w-full p-2.5 bg-gray-50 dark:bg-slate-900 border ${
                                    errors.bussiness_class
                                        ? "border-red-500 ring-2 ring-red-100 dark:ring-red-950"
                                        : "border-gray-300 dark:border-gray-700"
                                } rounded-lg dark:text-white transition-all`}
                            >
                                <option value="normal">সাধারণ ডেলিভারি চার্জ (Standard Rate)</option>
                                <option value="free">🎉 Free Delivery / ফ্রি ডেলিভারি (৳0)</option>
                            </select>
                            {errors.bussiness_class && (
                                <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                                    <FiAlertCircle className="inline" /> {errors.bussiness_class}
                                </p>
                            )}
                        </div>

                        {/* Price & Stock Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 col-span-1 md:col-span-2">
                            <div className={errors.price ? "field-has-error" : ""}>
                                <label className="block mb-2 text-sm font-medium dark:text-gray-400">
                                    Regular Price (TK) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    min="0"
                                    value={data.price}
                                    onChange={handleChange}
                                    className={`w-full p-2.5 bg-gray-50 dark:bg-slate-900 border ${
                                        errors.price
                                            ? "border-red-500 ring-2 ring-red-100"
                                            : "border-gray-300 dark:border-gray-700"
                                    } rounded-lg text-sm dark:text-white transition-all`}
                                />
                                {errors.price && (
                                    <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                                        <FiAlertCircle className="inline" /> {errors.price}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium dark:text-gray-400">
                                    Selling Price (TK)
                                </label>
                                <input
                                    type="number"
                                    name="selling_price"
                                    min="0"
                                    value={data.selling_price}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-lg text-sm dark:text-white shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium dark:text-gray-400">
                                    Auto Discount (%)
                                </label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={data.discount}
                                    readOnly
                                    className="w-full p-2.5 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            <div className={errors.stock ? "field-has-error" : ""}>
                                <label className="block mb-2 text-sm font-medium dark:text-gray-400">
                                    Stock <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    min="0"
                                    value={data.stock}
                                    onChange={handleChange}
                                    className={`w-full p-2.5 bg-gray-50 dark:bg-slate-900 border ${
                                        errors.stock
                                            ? "border-red-500 ring-2 ring-red-100"
                                            : "border-gray-300 dark:border-gray-700"
                                    } rounded-lg text-sm dark:text-white transition-all`}
                                />
                                {errors.stock && (
                                    <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                                        <FiAlertCircle className="inline" /> {errors.stock}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Initial Rating */}
                        <div className={`col-span-1 md:col-span-2 ${errors.initial_rating ? "field-has-error" : ""}`}>
                            <label className="block mb-2 text-sm font-medium dark:text-gray-400">
                                Initial Rating (Optional)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                name="initial_rating"
                                value={data.initial_rating}
                                onChange={handleChange}
                                placeholder="e.g. 4.5"
                                className={`w-full max-w-xs p-2.5 bg-gray-50 dark:bg-slate-900 border ${
                                    errors.initial_rating
                                        ? "border-red-500"
                                        : "border-gray-300 dark:border-gray-700"
                                } rounded-lg text-sm dark:text-white`}
                            />
                            {errors.initial_rating && (
                                <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                                    <FiAlertCircle className="inline" /> {errors.initial_rating}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. PRODUCT VARIATIONS (COLOR & SIZE) - OPTIONAL */}
                <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                Product Variations (কালার ও সাইজ ভেরিয়েশন)
                            </h3>
                            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                ঐচ্ছিক / Optional
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            যদি পণ্যটির কালার বা সাইজ পছন্দ করার অপশন থাকে, তবে নিচে যোগ করুন। ভেরিয়েশন না থাকলে খালি রাখুন।
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                        {/* COLOR VARIATION */}
                        <div className="bg-gray-50 dark:bg-slate-900/60 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                            <label className="block mb-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                🎨 Color Variations (কালার অপশন)
                            </label>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                                কালারের নাম লিখে Enter চাপুন বা দ্রুত প্রিসেট ক্লিক করুন:
                            </p>

                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={colorInput}
                                    onChange={(e) => setColorInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddColor();
                                        }
                                    }}
                                    placeholder="e.g. Red, Blue, কালো..."
                                    className="flex-1 p-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddColor()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <FiPlus /> Add
                                </button>
                            </div>

                            {/* Color Presets */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {PRESET_COLORS.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => handleAddColor(preset)}
                                        className="text-[11px] bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-md transition-colors"
                                    >
                                        + {preset}
                                    </button>
                                ))}
                            </div>

                            {/* Added Color Chips */}
                            {data.colors.length > 0 ? (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                                    {data.colors.map((color, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-900 shadow-sm"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                                            {color}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveColor(index)}
                                                className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                                            >
                                                <FiX size={13} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-gray-400 italic pt-1">
                                    কোনো কালার যোগ করা হয়নি (No colors added)
                                </p>
                            )}
                        </div>

                        {/* SIZE VARIATION */}
                        <div className="bg-gray-50 dark:bg-slate-900/60 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                            <label className="block mb-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                📏 Size Variations (সাইজ অপশন)
                            </label>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                                সাইজ লিখে Enter চাপুন বা প্রিসেট ক্লিক করুন:
                            </p>

                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={sizeInput}
                                    onChange={(e) => setSizeInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddSize();
                                        }
                                    }}
                                    placeholder="e.g. M, L, XL, 32, Free Size..."
                                    className="flex-1 p-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddSize()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <FiPlus /> Add
                                </button>
                            </div>

                            {/* Size Presets */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {PRESET_SIZES.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => handleAddSize(preset)}
                                        className="text-[11px] bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-md transition-colors"
                                    >
                                        + {preset}
                                    </button>
                                ))}
                            </div>

                            {/* Added Size Chips */}
                            {data.sizes.length > 0 ? (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                                    {data.sizes.map((size, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-900 shadow-sm"
                                        >
                                            {size}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSize(index)}
                                                className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                                            >
                                                <FiX size={13} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-gray-400 italic pt-1">
                                    কোনো সাইজ যোগ করা হয়নি (No sizes added)
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. PRODUCT MEDIA */}
                <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                        Product Media (ছবিসমূহ)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Main Thumbnail */}
                        <div className={errors.image ? "field-has-error" : ""}>
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Main Thumbnail (প্রধান ছবি)
                            </label>
                            <div
                                className={`relative border-2 border-dashed ${
                                    errors.image
                                        ? "border-red-500 bg-red-50/20"
                                        : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-slate-900"
                                } rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] transition-all`}
                            >
                                <img
                                    src={
                                        previewImage ||
                                        (product.image ? `/storage/${product.image}` : "")
                                    }
                                    className="h-40 mx-auto object-contain rounded mb-2"
                                    alt="Thumbnail"
                                />
                                <p className="text-xs text-blue-500 font-medium cursor-pointer">
                                    Click to Change Image (Max: 5MB)
                                </p>
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                />
                            </div>
                            {errors.image && (
                                <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
                                    <FiAlertCircle className="inline" /> {errors.image}
                                </p>
                            )}
                        </div>

                        {/* Add Gallery Images */}
                        <div className={errors.gallery ? "field-has-error" : ""}>
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Add Gallery Images (অতিরিক্ত ছবি)
                            </label>
                            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[200px] transition-all">
                                <FiPlus className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-xs text-gray-500 mb-1">
                                    একাধিক ছবি যোগ করতে পারেন (Max: 5MB each)
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleGalleryChange}
                                    accept="image/*"
                                />
                            </div>
                            {errors.gallery && (
                                <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
                                    <FiAlertCircle className="inline" /> {errors.gallery}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Existing Gallery Images */}
                    <div className="mt-6">
                        <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-400">
                            Current Gallery Images ({product.images?.length || 0})
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 border dark:border-gray-800 p-4 rounded-xl">
                            {product.images?.map((img) => (
                                <div
                                    key={img.id}
                                    className="relative group aspect-square bg-gray-100 dark:bg-slate-900 rounded-lg overflow-hidden"
                                >
                                    <img
                                        src={`/storage/${img.image_path}`}
                                        className="w-full h-full object-cover"
                                        alt="Gallery"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => deleteExistingImage(img.id)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete permanently"
                                    >
                                        <FiX size={14} />
                                    </button>
                                </div>
                            ))}
                            {galleryPreviews.map((src, index) => (
                                <div
                                    key={index}
                                    className="relative aspect-square bg-gray-100 dark:bg-slate-900 rounded-lg overflow-hidden border-2 border-blue-500"
                                >
                                    <img
                                        src={src}
                                        className="w-full h-full object-cover"
                                        alt="New upload"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeNewGalleryImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                                    >
                                        <FiX size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. FULL PRODUCT DETAILS */}
                <div className={`bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm ${errors.productDetails ? "field-has-error" : ""}`}>
                    <label className="block mb-2 text-sm font-semibold dark:text-gray-300">
                        Full Product Details (পণ্যের বিস্তারিত বিবরণ) <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        পণ্যের সকল বিস্তারিত বিবরণ, বৈশিষ্ট্য এবং সুবিধা এখানে লিখুন।
                    </p>
                    <div className={errors.productDetails ? "border-2 border-red-500 rounded-xl overflow-hidden" : ""}>
                        <TiptapEditor
                            value={data.productDetails}
                            onChange={(html) => setData("productDetails", html)}
                            placeholder="Full description..."
                        />
                    </div>
                    {errors.productDetails && (
                        <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
                            <FiAlertCircle className="inline" /> {errors.productDetails}
                        </p>
                    )}
                </div>

                {/* SUBMIT BUTTONS */}
                <div className="flex items-center justify-end gap-4 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <Link
                        href="/admin/products"
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-8 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm font-semibold"
                    >
                        {processing ? "Updating..." : "Update Product"}
                    </button>
                </div>
            </form>
        </div>
    );
}

EditProduct.layout = (page) => (
    <AdminLayout children={page} title="Edit Product" />
);
export default EditProduct;
