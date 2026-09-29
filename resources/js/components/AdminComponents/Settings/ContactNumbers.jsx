import React from "react";
import { IoAddCircleOutline } from "react-icons/io5";
import { Link, useForm } from "@inertiajs/react";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-hot-toast";

function ContactNumbers({ contacts = [] }) {
    const { delete: destroy } = useForm();

    const handleDelete = (e, id) => {
        e.preventDefault();
        destroy(`/admin/contactDelete/${id}`, {
            onSuccess: () => {
                toast.success("Contact deleted successfully!");
            },
            onError: () => {
                toast.error("Failed to delete contact!");
            },
        });
    };

    return (
        <div className="bg-white dark:bg-[#1F2937] rounded-xl shadow border border-gray-200 dark:border-[#374151] p-5">
            <div className="flex justify-between my-2">
                <h2 className="text-sm sm:text-xl font-semibold font-poppins text-slate-800 dark:text-gray-200 mb-4">
                    Contact Numbers (Order Details)
                </h2>
                <Link
                    href={"/admin/addContact"}
                    className="px-4 py-2 flex gap-1 items-center rounded bg-blue-600 text-gray-100 hover:bg-green-500 transition-colors"
                >
                    <IoAddCircleOutline size={24} />
                    <span className="hidden sm:block">Add Contact</span>
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-[#374151]">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Phone Number
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                                WhatsApp Number
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {contacts.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="3"
                                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                                >
                                    No contact numbers configured
                                </td>
                            </tr>
                        ) : (
                            contacts.map((contact) => (
                                <tr
                                    key={contact.id}
                                    className="border-t border-gray-200 dark:border-[#374151]"
                                >
                                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                                        {contact.phone || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                                        {contact.whatsapp || "N/A"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center">
                                            <form
                                                onSubmit={(e) =>
                                                    handleDelete(e, contact.id)
                                                }
                                            >
                                                <button
                                                    type="submit"
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                                    title="Delete Contact"
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
    );
}

export default ContactNumbers;
