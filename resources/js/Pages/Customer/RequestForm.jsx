import React, { useState } from "react";
import CustomerLayout from "../../Layouts/CustomerLayouts/CustomerLayout";
import { router, Head } from "@inertiajs/react";
import { toast } from "react-hot-toast";

function RequestForm() {
    const [form, setForm] = useState({
        product_name: "",
        description: "",
        phone: "",
        photo: null,
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const submitForm = (e) => {
        e.preventDefault();
        setLoading(true);

        router.post(
            "/requestForm/submit",
            {
                product_name: form.product_name,
                description: form.description,
                phone: form.phone,
                photo: form.photo,
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    toast.success("Product request submitted successfully!");
                    setForm({
                        product_name: "",
                        description: "",
                        phone: "",
                        photo: null,
                    });
                },
                onError: () => {
                    toast.error("Something went wrong. Please try again.");
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    return (
        <>
            <Head title="Request a Product" />

            <div className="bg-gray-50 py-12 px-4">
                <div className="max-w-[720px] mx-auto">
                    {/* Heading */}
                    <h1 className="text-2xl md:text-3xl font-poppins font-bold text-center text-gray-900 mb-2">
                        Request a Product
                    </h1>
                    <p className="text-center font-inter text-gray-600 mb-8">
                        Can’t find what you’re looking for? Let us know and
                        we’ll try to arrange it for you.
                    </p>

                    {/* Form Card */}
                    <form
                        onSubmit={submitForm}
                        className="bg-white rounded-2xl shadow-lg font-inter p-6 space-y-5 border border-gray-200"
                    >
                        {/* Product Name */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-gray-700">
                                Product Name
                            </label>
                            <input
                                type="text"
                                name="product_name"
                                value={form.product_name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Wireless Headphones"
                                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                            />
                        </div>

                        {/* Reference Image */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-gray-700">
                                Reference Image (optional)
                            </label>
                            <input
                                type="file"
                                name="photo"
                                accept="image/*"
                                onChange={handleChange}
                                className="text-sm text-gray-600"
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-gray-700">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                required
                                rows={3}
                                placeholder="Color, size, brand, budget, etc."
                                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                            />
                        </div>

                        {/* Phone */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-gray-700">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                                placeholder="01XXXXXXXXX"
                                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 py-3 rounded-xl bg-[#059669] text-white font-semibold hover:bg-[#047857] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? "Submitting..."
                                : "Confirm Product Request"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

RequestForm.layout = (page) => <CustomerLayout>{page}</CustomerLayout>;
export default RequestForm;
