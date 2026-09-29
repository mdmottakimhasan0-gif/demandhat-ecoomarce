import AdminLayout from "@/Layouts/AdminLayouts/AdminLayout";
import React, { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import { FiArrowLeft, FiUploadCloud, FiX, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import TiptapEditor from "../../../components/AdminComponents/TiptapEditor";

function ProductForm({ categories = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        productName: "",
        short_description: "",
        category: "",
        brand: "",
        quick_view: "",
        price: "",
        selling_price: "", // <-- 1. Added selling_price state
        stock: "",
        color: "",
        weight: "",
        length: "",
        width: "",
        bussiness_class: "",
        initial_rating: "",
        productDetails: "",
        specification: "",
        discount: "",
        image: null,
        gallery: [],
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);

    // <-- 2. Smart Handle Change to calculate discount automatically
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

            // Calculate percentage if values are valid
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
                discountVal = parseFloat(discountVal); // Removes unnecessary .00
            } else if (
                !isNaN(priceVal) &&
                !isNaN(sellingVal) &&
                sellingVal > priceVal
            ) {
                discountVal = 0; // If they sell for more than regular price, 0 discount
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

    const removeGalleryImage = (index) => {
        const updatedGallery = data.gallery.filter((_, i) => i !== index);
        const updatedPreviews = galleryPreviews.filter((_, i) => i !== index);
        setData("gallery", updatedGallery);
        setGalleryPreviews(updatedPreviews);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/admin/products", {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Product created successfully!");
                reset();
                setPreviewImage(null);
                setGalleryPreviews([]);
            },
            onError: () => {
                toast.error("Please check the form for errors.");
            },
        });
    };

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-inter font-bold text-gray-800 dark:text-white">
                    Add New Product
                </h2>
                <Link
                    href="/admin/products"
                    className="flex items-center gap-2 font-inter text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                >
                    <FiArrowLeft /> Back to Products
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white font-poppins dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            Basic Information
                        </h3>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Product Name
                            </label>
                            <input
                                type="text"
                                name="productName"
                                value={data.productName}
                                onChange={handleChange}
                                className={`w-full p-2.5 bg-gray-50 dark:bg-slate-900 border ${errors.productName ? "border-red-500" : "border-gray-300"} dark:border-gray-700 rounded-lg text-sm dark:text-white`}
                            />
                            {errors.productName && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.productName}
                                </p>
                            )}
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Short Description
                            </label>
                            <input
                                type="text"
                                name="short_description"
                                value={data.short_description}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Category
                            </label>
                            <select
                                name="category"
                                value={data.category}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Brand
                            </label>
                            <input
                                type="text"
                                name="brand"
                                value={data.brand}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                            />
                        </div>

                        {/* <-- 3. Updated Price Section */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 col-span-1 md:col-span-2">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Regular Price (TK)
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={data.price}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Selling Price (TK)
                                </label>
                                <input
                                    type="number"
                                    name="selling_price"
                                    value={data.selling_price}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-lg text-sm dark:text-white shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Auto Discount (%)
                                </label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={data.discount}
                                    readOnly
                                    className="w-full p-2.5 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                    Stock
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={data.stock}
                                    onChange={handleChange}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Business Class
                            </label>
                            <select
                                name="bussiness_class"
                                value={data.bussiness_class}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                            >
                                <option value="">Select Class</option>
                                <option value="free">Free</option>
                                <option value="normal">Normal</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Initial Rating (e.g. 4.5)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                name="initial_rating"
                                value={data.initial_rating}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:text-white"
                                placeholder="Starts at 0 reviews"
                            />
                            {errors.initial_rating && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.initial_rating}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Quick View / Key Features
                            </label>
                            <TiptapEditor
                                value={data.quick_view}
                                onChange={(html) => setData("quick_view", html)}
                                placeholder="Add key features with emojis and lists..."
                            />
                        </div>
                    </div>
                </div>

                {/* IMAGES SECTION */}
                <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                        Product Media
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Main Thumbnail
                            </label>
                            <div className="relative group border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[200px]">
                                {previewImage ? (
                                    <div className="relative w-full">
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="h-40 mx-auto object-contain rounded"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPreviewImage(null);
                                                setData("image", null);
                                            }}
                                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <FiUploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleImageChange}
                                            accept="image/*"
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Gallery Images
                            </label>
                            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[200px]">
                                <FiPlus className="w-10 h-10 text-gray-400 mb-2" />
                                <input
                                    type="file"
                                    multiple
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleGalleryChange}
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>

                    {galleryPreviews.length > 0 && (
                        <div className="mt-6">
                            <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-400">
                                Gallery Preview ({galleryPreviews.length})
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 border dark:border-gray-800 p-4 rounded-lg">
                                {galleryPreviews.map((src, index) => (
                                    <div
                                        key={index}
                                        className="relative group aspect-square bg-gray-100 dark:bg-slate-900 rounded-md overflow-hidden border dark:border-gray-700"
                                    >
                                        <img
                                            src={src}
                                            className="w-full h-full object-cover"
                                            alt="Gallery preview"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeGalleryImage(index)
                                            }
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <FiX size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Details & Dimensions */}
                <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                        Technical Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block mb-1 text-xs font-medium dark:text-gray-400">
                                Color
                            </label>
                            <input
                                type="text"
                                name="color"
                                value={data.color}
                                onChange={handleChange}
                                className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded text-sm dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-medium dark:text-gray-400">
                                Weight (kg)
                            </label>
                            <input
                                type="number"
                                name="weight"
                                value={data.weight}
                                onChange={handleChange}
                                className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded text-sm dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-medium dark:text-gray-400">
                                Length (cm)
                            </label>
                            <input
                                type="number"
                                name="length"
                                value={data.length}
                                onChange={handleChange}
                                className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded text-sm dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-medium dark:text-gray-400">
                                Width (cm)
                            </label>
                            <input
                                type="number"
                                name="width"
                                value={data.width}
                                onChange={handleChange}
                                className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded text-sm dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="my-6">
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                            Technical Specifications
                        </label>
                        <TiptapEditor
                            value={data.specification}
                            onChange={(html) => setData("specification", html)}
                            placeholder="Enter technical specifications, dimensions, materials, etc."
                        />
                    </div>

                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                        Full Product Details
                    </label>
                    <TiptapEditor
                        value={data.productDetails}
                        onChange={(html) => setData("productDetails", html)}
                        placeholder="Write full detailed description here..."
                    />
                </div>

                <div className="flex items-center justify-end gap-4 bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                    <Link
                        href="/admin/products"
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-8 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? "Saving Product..." : "Publish Product"}
                    </button>
                </div>
            </form>
        </div>
    );
}

ProductForm.layout = (page) => (
    <AdminLayout children={page} title="Add Products" />
);
export default ProductForm;
