import React, { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import toast from "react-hot-toast";
import { FiCheckCircle } from "react-icons/fi";

function MarqueeForm() {
    const { marquee } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        content: marquee?.content || "",
        position: marquee?.position || "",
        _method: "PATCH",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.content.trim()) {
            toast.error("Announcement content cannot be empty!");
            return;
        }

        post(`/admin/marquee/${marquee.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Marquee announcement updated successfully!");
            },
            onError: () => {
                toast.error("Failed to update announcement.");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 font-poppins">
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Marquee Announcement Content
                    </label>
                    <span className="text-[10px] font-medium text-slate-400">
                        Characters: {data.content.length}
                    </span>
                </div>

                <textarea
                    value={data.content}
                    onChange={(e) => setData("content", e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 p-3.5 text-sm transition-all shadow-sm placeholder-slate-400"
                    placeholder="Type store banner announcement text here (e.g. '🎉 GET 10% OFF ON YOUR FIRST ORDER - COD IS AVAILABLE NATIONWIDE!')..."
                ></textarea>

                {errors.content && (
                    <p className="text-xs text-red-500 mt-1">
                        {errors.content}
                    </p>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95"
                >
                    <FiCheckCircle size={16} />
                    {processing ? "Saving Changes..." : "Apply Announcement"}
                </button>
            </div>
        </form>
    );
}

export default MarqueeForm;
