import AdminLayout from "@/Layouts/AdminLayouts/AdminLayout";
import React, { useState } from "react";
import { Link, useForm, router } from "@inertiajs/react";
import { FiArrowLeft, FiUploadCloud, FiX, FiPlus } from "react-icons/fi";
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

    const { data, setData, post, processing, errors } = useForm({
        productName: product.name || "",
        short_description: product.short_description || "",
        category: product.category_id || "",
        brand: product.brand || "",
        quick_view: product.quick_view || "",
        price: product.price || "",
        selling_price: initialSellingPrice || "",
        stock: product.stock || "",
        color: product.color || "",
        weight: product.weight || "",
        length: product.length || "",
        width: product.width || "",
        bussiness_class: product.bussiness_class || "",
        productDetails: product.description || "",
        specification: product.specification || "",
        discount: product.discount || "",
        initial_rating: product.initial_rating || "", // <-- Added initial_rating state
        image: null,
        gallery: [],
        _method: "PATCH",
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);

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
                "Are you sure you want to remove this gallery image permanently?",
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
            onError: () => toast.error("Check form for errors"),
        });
    };

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Edit Product
                </h2>
                <Link
                    href="/admin/products"
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                >
                    <FiArrowLeft /> Back to Products
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-200 border-b pb-2">
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Product Name
                            </label>
                            <input
                                type="text"
                                name="productName"
                                value={data.productName}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg dark:text-white"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Short Description
                            </label>
                            <input
                                type="text"
                                name="short_description"
                                value={data.short_description}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Category
                            </label>
                            <select
                                name="category"
                                value={data.category}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg dark:text-white"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Brand
                            </label>
                            <input
                                type="text"
                                name="brand"
                                value={data.brand}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg dark:text-white"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Quick View / Key Features
                            </label>
                            <TiptapEditor
                                value={data.quick_view}
                                onChange={(html) => setData("quick_view", html)}
                                placeholder="Add key features..."
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                        Product Media
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Main Thumbnail
                            </label>
                            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[200px]">
                                <img
                                    src={
                                        previewImage ||
                                        `/storage/${product.image}`
                                    }
                                    className="h-40 mx-auto object-contain rounded mb-2"
                                    alt="Thumbnail"
                                />
                                <p className="text-xs text-blue-500 font-medium cursor-pointer">
                                    Click to Change Image
                                </p>
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Add Gallery Images
                            </label>
                            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[200px]">
                                <FiPlus className="w-10 h-10 text-gray-400 mb-2" />
                                <input
                                    type="file"
                                    multiple
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleGalleryChange}
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-400">
                            Current Gallery Images
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 border dark:border-gray-800 p-4 rounded-lg">
                            {product.images?.map((img) => (
                                <div
                                    key={img.id}
                                    className="relative group aspect-square bg-gray-100 dark:bg-slate-900 rounded-md overflow-hidden"
                                >
                                    <img
                                        src={`/storage/${img.image_path}`}
                                        className="w-full h-full object-cover"
                                        alt="Gallery"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteExistingImage(img.id)
                                        }
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <FiX size={14} />
                                    </button>
                                </div>
                            ))}
                            {galleryPreviews.map((src, index) => (
                                <div
                                    key={index}
                                    className="relative aspect-square bg-gray-100 dark:bg-slate-900 rounded-md overflow-hidden border-2 border-blue-500"
                                >
                                    <img
                                        src={src}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeNewGalleryImage(index)
                                        }
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                                    >
                                        <FiX size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                    {/* 3. Updated Edit Pricing Layout (Now grid-cols-6 to accommodate Initial Rating) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        <div>
                            <label className="block mb-1 text-xs font-medium dark:text-gray-400">
                                Regular Price (TK)
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={data.price}
                                onChange={handleChange}
                                className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded text-sm dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-medium dark:text-gray-400">
                                Selling Price (TK)
                            </label>
                            <input
                                type="number"
                                name="selling_price"
                                value={data.selling_price}
                                onChange={handleChange}
                                className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded text-sm dark:text-white shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-medium dark:text-gray-400">
                                Auto Discount (%)
                            </label>
                            <input
                                type="number"
                                name="discount"
                                value={data.discount}
                                readOnly
                                className="w-full p-2 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded text-sm text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-medium dark:text-gray-400">
                                Stock
                            </label>
                            <input
                                type="number"
                                name="stock"
                                value={data.stock}
                                onChange={handleChange}
                                className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded text-sm dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-medium dark:text-gray-400">
                                Business Class
                            </label>
                            <select
                                name="bussiness_class"
                                value={data.bussiness_class}
                                onChange={handleChange}
                                className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded text-sm dark:text-white"
                            >
                                <option value="free">Free</option>
                                <option value="normal">Normal</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        {/* --- ADDED INITIAL RATING FIELD HERE --- */}
                        <div>
                            <label className="block mb-1 text-xs font-medium dark:text-gray-400">
                                Initial Rating (Floor)
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
                                className={`w-full p-2 bg-gray-50 dark:bg-slate-900 border ${errors.initial_rating ? "border-red-500" : "border-gray-300 dark:border-gray-700"} rounded text-sm dark:text-white`}
                            />
                            {errors.initial_rating && (
                                <p className="text-red-500 text-[10px] mt-1">
                                    {errors.initial_rating}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Technical Specifications
                            </label>
                            <TiptapEditor
                                value={data.specification}
                                onChange={(html) =>
                                    setData("specification", html)
                                }
                                placeholder="Specifications..."
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium dark:text-gray-300">
                                Full Product Details
                            </label>
                            <TiptapEditor
                                value={data.productDetails}
                                onChange={(html) =>
                                    setData("productDetails", html)
                                }
                                placeholder="Full description..."
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <Link
                        href="/admin/products"
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-8 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
