import React from "react";
import { CheckCircle, CreditCard, Smartphone } from "lucide-react";

export default function PaymentMethod({ data, setData }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold font-poppins text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    3
                </span>
                Payment Method
            </h2>

            <div className="space-y-4">
                {/* Cash on Delivery */}
                <label
                    className={`relative border-2 rounded-xl p-2 cursor-pointer transition-all flex items-center gap-4 ${
                        data.payment_method === "cod"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                    }`}
                >
                    <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={data.payment_method === "cod"}
                        onChange={() => setData("payment_method", "cod")}
                        className="text-blue-600 focus:ring-blue-500 w-5 h-5"
                    />
                    <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <CheckCircle size={24} />
                    </div>
                    <div className="flex-1">
                        <span className="block font-bold text-gray-900">
                            Cash on Delivery
                        </span>
                        <span className="text-sm text-gray-500">
                            Pay when you receive the product
                        </span>
                    </div>
                </label>

                {/* Stripe */}
                <label
                    className={`relative border-2 rounded-xl p-2 cursor-pointer transition-all flex items-center gap-4 ${
                        data.payment_method === "stripe"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                    }`}
                >
                    <input
                        type="radio"
                        name="payment_method"
                        value="stripe"
                        checked={data.payment_method === "stripe"}
                        onChange={() => setData("payment_method", "stripe")}
                        className="text-blue-600 focus:ring-blue-500 w-5 h-5"
                    />
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                        <CreditCard size={24} />
                    </div>
                    <div className="flex-1">
                        <span className="block font-bold text-gray-900">
                            Credit / Debit Card (Stripe)
                        </span>
                        <span className="text-sm text-gray-500">
                            Secure online payment
                        </span>
                    </div>
                </label>

                {/* bKash */}
                <label
                    className={`relative border-2 rounded-xl p-2 cursor-pointer transition-all flex items-center gap-4 ${
                        data.payment_method === "bkash"
                            ? "border-pink-500 bg-pink-50"
                            : "border-gray-200 hover:border-pink-300"
                    }`}
                >
                    <input
                        type="radio"
                        name="payment_method"
                        value="bkash"
                        checked={data.payment_method === "bkash"}
                        onChange={() => setData("payment_method", "bkash")}
                        className="text-pink-600 focus:ring-pink-500 w-5 h-5"
                    />
                    <div className="p-2 bg-pink-100 rounded-full text-pink-600">
                        <Smartphone size={24} />
                    </div>
                    <div className="flex-1">
                        <span className="block font-bold text-gray-900">
                            bKash
                        </span>
                        <span className="text-sm text-gray-500">
                            Pay securely with your bKash account
                        </span>
                    </div>
                </label>
            </div>
        </div>
    );
}
