import React from "react";
import { IoAddCircleOutline } from "react-icons/io5";
import { Link, useForm } from "@inertiajs/react";
import { MdEdit } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";

function LandingSections({ sections, onDeleteSection }) {
    const { delete: destroy } = useForm();

    // If onDeleteSection prop is passed, use it. Otherwise, handle delete locally.
    const handleDelete =
        onDeleteSection ||
        ((e, id) => {
            e.preventDefault();
            destroy(`/admin/sectionDelete/${id}`, {
                onSuccess: () => {
                    // You can add a toast notification here if needed
                    console.log("Section deleted successfully");
                },
                onError: () => {
                    console.error("Failed to delete section");
                },
            });
        });

    return (
        <div>
            <div className="bg-white dark:bg-[#1F2937] rounded-xl shadow border border-gray-200 dark:border-[#374151] p-5">
                <div className="flex justify-between my-2">
                    <h2 className="text-sm sm:text-xl font-semibold font-poppins text-slate-800 dark:text-gray-200 mb-4">
                        Landing Page Sections Order
                    </h2>
                    <Link
                        href={"/admin/addSections"}
                        className="px-4 py-2 flex gap-1 items-center rounded bg-blue-600 text-gray-100 hover:bg-green-500"
                    >
                        <IoAddCircleOutline size={24} /> Section
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-[#374151]">
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Category ID
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Section Name
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {sections.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="3"
                                        className="text-center py-6 text-gray-500 dark:text-gray-400"
                                    >
                                        No sections configured
                                    </td>
                                </tr>
                            ) : (
                                sections.map((section) => (
                                    <tr
                                        key={section.id}
                                        className="border-t border-gray-200 dark:border-[#374151]"
                                    >
                                        <td className="px-4 py-3 text-center text-sm text-gray-800 dark:text-gray-200">
                                            {section.category_id}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {section.category_name}
                                        </td>
                                        <td className="px-4 py-3 ">
                                            <div className="flex gap-4 justify-center">
                                                <Link
                                                    href={`/admin/sectionEdit/${section.id}`}
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                                                    title="Edit Section"
                                                >
                                                    <MdEdit size={22} />
                                                </Link>
                                                <form
                                                    onSubmit={(e) =>
                                                        handleDelete(
                                                            e,
                                                            section.id,
                                                        )
                                                    }
                                                    className="inline"
                                                >
                                                    <button
                                                        type="submit"
                                                        className="text-red-600 hover:text-red-800 dark:text-red-400 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                                                        title="Delete Section"
                                                    >
                                                        <FiTrash2 size={20} />
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default LandingSections;
