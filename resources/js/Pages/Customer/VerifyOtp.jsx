import React from "react";
import { useForm, Head, usePage, Link } from "@inertiajs/react";
import CustomerLayout from "../../Layouts/CustomerLayouts/CustomerLayout";
import { ShieldCheck, Mail, ArrowLeft, RefreshCcw } from "lucide-react";

function VerifyOtp({ email }) {
    const { errors: pageErrors } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        email: email || "",
        otp: "",
    });

    const allErrors = { ...errors, ...pageErrors };

    const submit = (e) => {
        e.preventDefault();
        post("verify-otp");
    };

    return (
        <div className="min-h-[80vh] flex font-hindSiliguri items-center justify-center bg-gray-50 px-4 py-12">
            <Head title="ইমেইল ভেরিফিকেশন - Unity Haven" />

            <div className="w-full max-w-md">
                {/* Back Button */}
                <Link
                    href="/login"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-[#059669] mb-6 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    লগইন পেজে ফিরে যান
                </Link>

                <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-8 md:p-10">
                    {/* Header Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center relative">
                            <ShieldCheck className="w-10 h-10 text-[#059669]" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full border-4 border-white flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Text Section */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            ইমেইল ভেরিফাই করুন
                        </h2>
                        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                            <Mail size={14} />
                            <p>আমরা একটি ৬-ডিজিটের কোড পাঠিয়েছে:</p>
                        </div>
                        <p className="font-bold text-[#059669] mt-1">{email}</p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">
                                ওটিপি (OTP) কোডটি লিখুন
                            </label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength="6"
                                autoFocus
                                value={data.otp}
                                onChange={(e) => {
                                    const value = e.target.value.replace(
                                        /\D/g,
                                        "",
                                    );
                                    setData("otp", value);
                                }}
                                className={`w-full text-center text-3xl font-hindSiliguri tracking-[0.5em] py-4 border-2 rounded-2xl focus:outline-none transition-all duration-200 ${allErrors.otp ? "border-red-300 bg-red-50 text-red-600 focus:border-red-500" : "border-gray-100 bg-gray-50 focus:border-[#059669] focus:bg-white text-gray-800"}`}
                                placeholder="000000"
                            />

                            {allErrors.otp && (
                                <p className="text-red-500 text-sm mt-3 text-center font-medium">
                                    {allErrors.otp}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing || data.otp.length < 6}
                            className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-green-900/10 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <RefreshCcw
                                        className="animate-spin"
                                        size={20}
                                    />
                                    ভেরিফাই করা হচ্ছে...
                                </>
                            ) : (
                                "ভেরিফাই এবং লগইন"
                            )}
                        </button>
                    </form>

                    {/* Footer Info
                    <div className="mt-10 text-center border-t border-gray-50 pt-6">
                        <p className="text-sm text-gray-500 mb-2">
                            কোডটি পাননি?
                        </p>
                        <button
                            type="button"
                            className="text-sm font-bold text-[#059669] hover:underline transition-all"
                            onClick={() =>
                                toast.success("কোডটি পুনরায় পাঠানো হয়েছে")
                            }
                        >
                            আবার কোড পাঠান
                        </button>
                    </div> */}
                </div>
            </div>
        </div>
    );
}

VerifyOtp.layout = (page) => <CustomerLayout children={page} />;
export default VerifyOtp;
