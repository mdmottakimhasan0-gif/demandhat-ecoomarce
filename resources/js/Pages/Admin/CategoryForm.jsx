import React, { useState, useRef } from "react";
import AdminLayout from "../../Layouts/AdminLayouts/AdminLayout";
import { useForm, Link } from "@inertiajs/react";
import { FiUploadCloud, FiX, FiTag, FiArrowLeft, FiCheck } from "react-icons/fi";

function CategoryForm() {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        name: "",
        photo: null,
    });

    const [preview, setPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/admin/categories/store", {
            onSuccess: () => {
                reset();
                setPreview(null);
            },
        });
    };

    const handleFile = (file) => {
        if (!file) return;
        setData("photo", file);
        setPreview(URL.createObjectURL(file));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) handleFile(file);
    };

    const clearImage = () => {
        setData("photo", null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="min-h-screen py-10 px-4">
            <div className="max-w-2xl mx-auto">

                {/* Back Link */}
                <Link
                    href="/admin/categories"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#059669] dark:hover:text-[#8ab87a] mb-6 transition-colors"
                >
                    <FiArrowLeft size={14} /> Back to Categories
                </Link>

                {/* Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                        <div className="p-2.5 bg-[#059669]/10 dark:bg-[#059669]/20 rounded-xl">
                            <FiTag className="text-[#059669] dark:text-[#8ab87a]" size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
                                Create Category
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Add a new product category to your store
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">

                        {/* Success Banner */}
                        {wasSuccessful && (
                            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 rounded-xl px-4 py-3 text-sm font-medium">
                                <FiCheck size={16} />
                                Category created successfully!
                            </div>
                        )}

                        {/* Category Name */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Category Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="e.g. Electronics, Clothing, Food..."
                                className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#059669] transition-all ${
                                    errors.name
                                        ? "border-red-400 dark:border-red-500"
                                        : "border-gray-200 dark:border-gray-600"
                                }`}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Category Image
                                <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(optional)</span>
                            </label>

                            {preview ? (
                                /* Image Preview */
                                <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-slate-900">
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full h-52 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                        >
                                            <FiX size={14} /> Remove Image
                                        </button>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition"
                                        >
                                            <FiX size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Drop Zone */
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={`w-full h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                                        isDragging
                                            ? "border-[#059669] bg-[#059669]/5 dark:bg-[#059669]/10"
                                            : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-slate-900 hover:border-[#059669] hover:bg-[#059669]/5 dark:hover:bg-[#059669]/10"
                                    }`}
                                >
                                    <div className="p-3 bg-[#059669]/10 dark:bg-[#059669]/20 rounded-xl">
                                        <FiUploadCloud className="text-[#059669] dark:text-[#8ab87a]" size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Drop image here or <span className="text-[#059669] dark:text-[#8ab87a]">browse</span>
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            PNG, JPG, WEBP up to 5MB
                                        </p>
                                    </div>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files[0])}
                            />
                            {errors.photo && (
                                <p className="text-xs text-red-500 mt-1">{errors.photo}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857] disabled:bg-[#059669]/50 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm"
                            >
                                {processing ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <><FiCheck size={16} /> Save Category</>
                                )}
                            </button>
                            <Link
                                href="/admin/categories"
                                className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

CategoryForm.layout = (page) => (
    <AdminLayout children={page} title="Add Category" />
);

export default CategoryForm;
