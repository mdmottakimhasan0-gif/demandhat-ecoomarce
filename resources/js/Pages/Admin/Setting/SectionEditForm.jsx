import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayouts/AdminLayout";
import toast from "react-hot-toast";

function SectionEditForm({ section = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        category_name: section.category_name,
        category_id: section.category_id,
        _method: "patch",
    });

    const submit = (e) => {
        e.preventDefault();

        post(`/admin/section/${section.id}`, {
            onSuccess: () => {
                reset();
                toast.success("Section Update Successfully!");
            },
        });
    };

    return (
        <>
            <Head title="Add Section" />

            <div className="max-w-[1000px] mx-auto bg-white dark:bg-[#1F2937] rounded-xl shadow border border-gray-200 dark:border-[#374151] p-6 mt-8">
                <h1 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200 text-center">
                    Add Section
                </h1>

                <form onSubmit={submit} className="space-y-5 font-inter">
                    {/* Category Name */}
                    <div>
                        <label className="block mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
                            Category Name
                        </label>

                        <input
                            type="text"
                            value={data.category_name}
                            onChange={(e) =>
                                setData("category_name", e.target.value)
                            }
                            placeholder="Enter Category Name"
                            className="block p-2 w-full text-sm text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-[#111827] rounded-md"
                        />

                        {errors.category_name && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.category_name}
                            </p>
                        )}
                    </div>

                    {/* Category ID */}
                    <div>
                        <label className="block mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
                            Category ID
                        </label>

                        <input
                            type="number"
                            value={data.category_id}
                            onChange={(e) =>
                                setData("category_id", e.target.value)
                            }
                            placeholder="Enter Category ID"
                            className="block p-2 w-full text-sm text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-[#111827] rounded-md"
                        />

                        {errors.category_id && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.category_id}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition disabled:opacity-50"
                    >
                        {processing ? "Updating..." : "Update Section"}
                    </button>
                </form>
            </div>
        </>
    );
}

SectionEditForm.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default SectionEditForm;
