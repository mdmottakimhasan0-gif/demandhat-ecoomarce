import React from "react";
import { User, Phone, MapPin, Truck, Banknote } from "lucide-react";

export default function ShippingForm({ data, setData, errors, deliveryFee }) {
    return (
        <div className="font-hindSiliguri bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6 mb-6">
            <h2 className="text-xl font-bold  text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    1
                </span>
                Shipping Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                    <label className="block  font-medium text-gray-700 mb-1">
                        আপনার নাম *
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        className="w-full p-1 border rounded-lg border-gray-300 px-3 focus:ring-blue-500"
                        placeholder="আপনার পূর্ণ নাম লিখুন"
                    />
                    {errors.name && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.name}
                        </p>
                    )}
                </div>

                {/* Phone */}
                <div>
                    <label className="block  font-medium text-gray-700 mb-1">
                        ফোন নম্বর *
                    </label>
                    <input
                        type="text"
                        name="phone"
                        value={data.phone}
                        onChange={(e) => setData("phone", e.target.value)}
                        className="w-full p-1 border px-3 rounded-lg border-gray-300 focus:ring-blue-500"
                        placeholder="আপনার সচল ফোন নম্বর লিখুন"
                    />
                    {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.phone}
                        </p>
                    )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ঠিকানা *
                    </label>
                    <textarea
                        value={data.address}
                        onChange={(e) => setData("address", e.target.value)}
                        className="w-full border p-1 rounded-lg border-gray-300 focus:ring-blue-500"
                        rows="1"
                        name="address"
                        placeholder="বাসার নম্বর/গ্রাম, রোড নম্বর/ইউনিয়ন,থানা, জেলা"
                    />
                    {errors.address && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.address}
                        </p>
                    )}
                </div>

                {/* DELIVERY AREA RADIO BUTTONS */}
                <div className="md:col-span-2 mt-1 sm:mt-4">
                    <label className="block  font-bold text-gray-700 mb-3">
                        ডেলিভারি এরিয়া সিলেক্ট করুন *
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {/* Inside Dhaka */}
                        <label
                            className={`flex items-center p-1 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                data.delivery_area === "inside_dhaka"
                                    ? "border-green-600 bg-green-50"
                                    : "border-gray-200 hover:border-green-300"
                            }`}
                        >
                            <input
                                type="radio"
                                name="delivery_area"
                                value="inside_dhaka"
                                checked={data.delivery_area === "inside_dhaka"}
                                onChange={(e) =>
                                    setData("delivery_area", e.target.value)
                                }
                                className="sm:w-5 sm:h-5 w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                            />
                            <div className=" ml-2 sm:ml-3">
                                <span className="block font-bold text-gray-900">
                                    ঢাকার ভিতরে
                                </span>
                            </div>
                        </label>

                        {/* Outside Dhaka */}
                        <label
                            className={`flex items-center sm:p-4 p-1 border-2 rounded-xl cursor-pointer transition-all ${
                                data.delivery_area === "outside_dhaka"
                                    ? "border-green-600 bg-green-50"
                                    : "border-gray-200 hover:border-green-300"
                            }`}
                        >
                            <input
                                type="radio"
                                name="delivery_area"
                                value="outside_dhaka"
                                checked={data.delivery_area === "outside_dhaka"}
                                onChange={(e) =>
                                    setData("delivery_area", e.target.value)
                                }
                                className="sm:w-5 sm:h-5 w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                            />
                            <div className="ml-3">
                                <span className="block font-bold text-gray-900">
                                    ঢাকার বাইরে
                                </span>
                            </div>
                        </label>
                    </div>

                    {/* Delivery Fee Notice (Displayed below radios) */}
                    {/* {data.delivery_area && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
                            <span className="text-blue-800 font-medium">
                                ডেলিভারি চার্জ:
                            </span>
                            <span className="text-xl font-bold text-blue-900">
                                TK {deliveryFee}
                            </span>
                        </div>
                    )}
                    {errors.delivery_area && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.delivery_area}
                        </p>
                    )} */}
                </div>
            </div>
        </div>
    );
}
