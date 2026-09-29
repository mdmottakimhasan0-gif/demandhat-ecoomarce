import React from "react";
import { useForm } from "@inertiajs/react";
import toast from "react-hot-toast";

export default function StaffTwoFactor() {
    const { data, setData, post, processing, errors } = useForm({
        code: "",
    });

    const submit = (e) => {
        e.preventDefault();
        // ইউআরএল সরাসরি লিখে দেওয়া হলো যাতে কনফিউশন না থাকে
        post("/staff/verify-2fa", {
            onError: (err) => toast.error(err),
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white shadow-md rounded-lg w-96">
                <h2 className="text-xl font-bold mb-4 text-center">
                    Staff Security Check
                </h2>
                <p className="text-sm text-gray-600 mb-6 text-center">
                    Please ask your manager for the 6-digit code for your
                    account.
                </p>
                <form onSubmit={submit}>
                    <input
                        type="text"
                        value={data.code}
                        onChange={(e) => setData("code", e.target.value)}
                        className="w-full p-3 border rounded text-center text-2xl tracking-widest"
                        placeholder="000000"
                        maxLength="6"
                    />
                    {errors.code && (
                        <div className="text-red-500 text-sm mt-2">
                            {errors.code}
                        </div>
                    )}
                    <button
                        disabled={processing}
                        className="w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                        {processing ? "Verifying..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}
