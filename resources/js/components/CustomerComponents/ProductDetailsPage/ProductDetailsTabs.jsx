import React from "react";
import SafeHTML from "../../CustomerComponents/SafeHTML";
import { useForm, usePage, Link } from "@inertiajs/react";
import { Star } from "lucide-react";
import toast from "react-hot-toast";

const ProductDetailsTabs = ({ activeTab, setActiveTab, product }) => {
    // Ensure you have auth context available via Inertia share
    const { auth } = usePage().props;
    const reviews = product.reviews || [];

    // Inertia Form Hook
    const { data, setData, post, processing, reset, errors } = useForm({
        product_id: product.id,
        rating: 5,
        review: "",
    });

    const submitReview = (e) => {
        e.preventDefault();
        post("/reviews", {
            preserveScroll: true,
            onSuccess: () => {
                reset("review", "rating");
                toast.success("Review submitted! Waiting for approval.");
            },
        });
    };

    const allTabs = [
        {
            id: "details",
            label: "বিস্তারিত বিবরণ",
            content: product.description,
            show: true,
        },
        {
            id: "specification",
            label: "স্পেসিফিকেশন",
            content: product.specification,
            show: product.specification && product.specification !== "<p></p>",
        },
        {
            id: "reviews",
            label: `রিভিউ (${reviews.length})`,
            content: null, // Rendered uniquely below
            show: true,
        },
    ];

    const visibleTabs = allTabs.filter((tab) => tab.show);

    return (
        <div className="mt-10 font-hindSiliguri sm:mt-14 rounded-xl bg-white border border-gray-200 p-5 sm:p-8">
            {/* Tab Headers */}
            <div className="h-10 flex gap-5 items-center mb-5 border-b border-gray-100 overflow-x-auto">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-2 px-1 font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? "text-green-600 border-b-2 border-green-600" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-500">
                {activeTab === "reviews" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6">
                        {/* LEFT: Existing Reviews List */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-6">
                                Customer Reviews
                            </h3>
                            {reviews.length === 0 ? (
                                <p className="text-gray-500 italic">
                                    এই পণ্যের জন্য এখনো কোনো রিভিউ নেই। প্রথম
                                    রিভিউটি দিন!
                                </p>
                            ) : (
                                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                                    {reviews.map((rev) => (
                                        <div
                                            key={rev.id}
                                            className="border-b border-gray-100 pb-4"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex">
                                                    {[...Array(5)].map(
                                                        (_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={"w-4 h-4 " + (i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                                <span className="font-bold text-sm text-gray-800">
                                                    {rev.user?.name ||
                                                        "Customer"}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm">
                                                {rev.review}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Write a Review Form */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 h-fit">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                                Write a Review
                            </h3>

                            {!auth?.user ? (
                                <div className="text-center py-6">
                                    <p className="text-gray-500 mb-4">
                                        রিভিউ দিতে আপনাকে লগইন করতে হবে।
                                    </p>
                                    <Link
                                        href="/login"
                                        className="px-6 py-2 bg-green-600 text-white rounded-md font-bold"
                                    >
                                        Login to Review
                                    </Link>
                                </div>
                            ) : (
                                <form
                                    onSubmit={submitReview}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Rating
                                        </label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    type="button"
                                                    key={star}
                                                    onClick={() =>
                                                        setData("rating", star)
                                                    }
                                                    className="focus:outline-none"
                                                >
                                                    <Star
                                                        className={"w-8 h-8 " + (data.rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        {errors.rating && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.rating}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Your Review
                                        </label>
                                        <textarea
                                            rows="4"
                                            value={data.review}
                                            onChange={(e) =>
                                                setData(
                                                    "review",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm"
                                            placeholder="আপনার মতামত লিখুন..."
                                        ></textarea>
                                        {errors.review && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.review}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                    >
                                        {processing
                                            ? "Submitting..."
                                            : "Submit Review"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                ) : (
                    <SafeHTML
                        html={
                            visibleTabs.find((t) => t.id === activeTab)?.content
                        }
                        className="mt-4"
                    />
                )}
            </div>
        </div>
    );
};

export default ProductDetailsTabs;
