import CustomerLayout from "../../Layouts/CustomerLayouts/CustomerLayout";
import React from "react";

function CustomerDetails({ user }) {
    return (
        <div className="flex justify-center p-6">
            <div className="w-full max-w-4xl bg-white rounded-2xl p-8 shadow-xl text-gray-900">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left */}
                    <div className="md:w-1/3 text-center">
                        <img
                            src="https://i.pravatar.cc/300"
                            alt="Profile Picture"
                            className="w-48 h-48 mx-auto rounded-full border-4 border-indigo-800 transition-transform duration-300 hover:scale-105"
                        />

                        <button className="mt-6 px-4 py-2 bg-indigo-800 text-white rounded-lg hover:bg-indigo-900 transition">
                            {user?.role}
                        </button>
                    </div>

                    {/* Right */}
                    <div className="md:w-2/3">
                        <h1 className="text-2xl font-bold text-indigo-800">
                            {user?.name}
                        </h1>

                        <h2 className="text-xl font-semibold text-indigo-800 mb-4">
                            Contact Information
                        </h2>

                        <ul className="space-y-3 text-gray-700">
                            <li className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 text-indigo-800"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                                {user?.email} (
                                <span className="font-semibold font-poppins">
                                    {user?.email_verified_at
                                        ? "Verified"
                                        : "Unverified"}
                                </span>
                                )
                            </li>

                            <li className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 text-indigo-800"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                {user?.phone || "No Phone Number Provided"}
                            </li>

                            <li className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 text-indigo-800"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                    />
                                </svg>
                                {user?.address || "No Address Provided"}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

CustomerDetails.layout = (page) => <CustomerLayout children={page} />;
export default CustomerDetails;
