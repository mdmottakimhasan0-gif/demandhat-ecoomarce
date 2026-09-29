import AdminLayout from "@/Layouts/AdminLayouts/AdminLayout";
import React from "react";
import { useForm, Head } from "@inertiajs/react";
import { toast } from "react-hot-toast";

function EditHeroImage({ hero }) {
    const { data, setData, post, processing, errors } = useForm({
        image: null,
        _method: "patch", //method spoofing because php support korena multipart/form-data with PUT, PATCH, DELETE
    });

    const submit = (e) => {
        e.preventDefault();

        post(`/admin/hero/${hero.id}`, {
            //PHP does not natively support multipart/form-data on PUT, PATCH, or DELETE requests. So we use POST with method spoofing.
            onSuccess: () => {
                toast.success("Hero Image Updated Successfully!");
            },
        });
    };

    return (
        <>
            <Head title="Edit Hero Image" />

            <div className="max-w-xl mx-auto bg-white dark:bg-[#1F2937] rounded-xl shadow border border-gray-200 dark:border-[#374151] p-6 mt-10">
                <h1 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200 text-center">
                    Edit Hero Image
                </h1>

                {/* Current Image Preview */}
                <div className="mb-4 flex justify-center">
                    <img
                        src={`/storage/${hero.image}`}
                        alt="Current Hero"
                        className="h-40 w-full object-cover rounded-lg border dark:border-gray-600"
                    />
                </div>

                <form onSubmit={submit} className="space-y-5">
                    {/* Image Input */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Replace Hero Image
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setData("image", e.target.files[0])
                            }
                            className="block w-full text-sm text-gray-900 dark:text-gray-300
                                       file:mr-4 file:py-2 file:px-4
                                       file:rounded-md file:border-0
                                       file:text-sm file:font-semibold
                                       file:bg-green-600 file:text-white
                                       hover:file:bg-green-700
                                       bg-gray-50 dark:bg-[#111827] rounded-md"
                        />

                        {errors.image && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.image}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition disabled:opacity-50"
                    >
                        {processing ? "Updating..." : "Update Hero Image"}
                    </button>
                </form>
            </div>
        </>
    );
}

EditHeroImage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default EditHeroImage;
