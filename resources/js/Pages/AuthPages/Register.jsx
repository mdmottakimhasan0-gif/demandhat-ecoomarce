import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import { useForm as userForm } from "@inertiajs/react";
import CustomerLayout from "../../Layouts/CustomerLayouts/CustomerLayout";

function Register() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, errors, processing } = userForm({
        name: "",
        address: "",
        phone: "",
        email: "",
        password: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/register/store", {
            onSuccess: () => {
                setData({
                    name: "",
                    address: "",
                    phone: "",
                    email: "",
                    password: "",
                });
                alert("Registration Successful!");
            },
        });
    };

    return (
        <div className="w-full flex items-center justify-center p-4 lg:p-8">
            <div className="max-w-[1200px] mx-auto border border-gray-200 bg-white rounded-2xl shadow-xl overflow-hidden grid lg:grid-cols-2">
                {/* Left Side - Image Section */}
                <div className="relative bg-[#0a0a18] bg-gradient-to-br from-[#0a0a18] via-[#1e1b4b] to-[#2e1065] p-10 flex flex-col justify-center items-center text-center max-md:order-1">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    <h2 className="text-white text-3xl font-poppins font-bold mb-4 relative z-10">
                        Join Unity Haven
                    </h2>
                    <p className="text-indigo-200 font-poppins text-sm mb-8 relative z-10 max-w-xs mx-auto">
                        Create your account to start your journey with us.
                    </p>

                    <div className="relative z-10 w-full max-w-xs lg:max-w-sm transform hover:scale-105 transition-transform duration-500">
                        <img
                            src="https://readymadeui.com/signin-image.webp"
                            className="w-full h-auto object-contain drop-shadow-2xl"
                            alt="register-image"
                        />
                    </div>
                </div>

                {/* Right Side - Form Section */}
                <div className="w-full p-5 lg:p-8 bg-white">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-8">
                            <h1 className="text-slate-900 font-poppins text-3xl font-bold">
                                Create Account
                            </h1>
                        </div>

                        <div className="space-y-5">
                            {/* Name */}
                            <div>
                                <label className="text-slate-700 text-sm font-semibold mb-2 block">
                                    Full Name
                                </label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    className="w-full text-sm text-slate-900 bg-white px-4 py-3 rounded-lg border border-slate-300 focus:border-[#059669] focus:ring-2 focus:ring-[#D1FAE5] outline-none transition-all duration-200"
                                    placeholder="Enter your full name"
                                />
                                {errors.name && (
                                    <div className="text-red-500 text-xs mt-1 font-medium ml-1">
                                        {errors.name}
                                    </div>
                                )}
                            </div>

                            {/* Address */}
                            <div>
                                <label className="text-slate-700 text-sm font-semibold mb-2 block">
                                    Delivery Address
                                </label>
                                <input
                                    name="address"
                                    type="text"
                                    required
                                    value={data.address}
                                    onChange={(e) =>
                                        setData("address", e.target.value)
                                    }
                                    className="w-full text-sm text-slate-900 bg-white px-4 py-3 rounded-lg border border-slate-300 focus:border-[#059669] focus:ring-2 focus:ring-[#D1FAE5] outline-none transition-all duration-200"
                                    placeholder="House, Road, Area, City"
                                />
                                {errors.address && (
                                    <div className="text-red-500 text-xs mt-1 font-medium ml-1">
                                        {errors.address}
                                    </div>
                                )}
                            </div>

                            {/* Grid for Phone and Email */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Phone */}
                                <div>
                                    <label className="text-slate-700 text-sm font-semibold mb-2 block">
                                        Phone Number
                                    </label>
                                    <input
                                        name="phone"
                                        type="tel"
                                        required
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData("phone", e.target.value)
                                        }
                                        pattern="^(013|014|015|016|017|018|019)[0-9]{8}$"
                                        className="w-full text-sm text-slate-900 bg-white px-4 py-3 rounded-lg border border-slate-300 focus:border-[#059669] focus:ring-2 focus:ring-[#D1FAE5] outline-none transition-all duration-200"
                                        placeholder="01XXXXXXXXX"
                                    />
                                    {errors.phone && (
                                        <div className="text-red-500 text-xs mt-1 font-medium ml-1">
                                            {errors.phone}
                                        </div>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="text-slate-700 text-sm font-semibold mb-2 block">
                                        Email Address
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        value={data.email}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                        className="w-full text-sm text-slate-900 bg-white px-4 py-3 rounded-lg border border-slate-300 focus:border-[#059669] focus:ring-2 focus:ring-[#D1FAE5] outline-none transition-all duration-200"
                                        placeholder="you@example.com"
                                    />
                                    {errors.email && (
                                        <div className="text-red-500 text-xs mt-1 font-medium ml-1">
                                            {errors.email}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Password with Toggle Logic */}
                            <div>
                                <label className="text-slate-700 text-sm font-semibold mb-2 block">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        required
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        className="w-full text-sm text-slate-900 bg-white px-4 py-3 rounded-lg border border-slate-300 focus:border-[#059669] focus:ring-2 focus:ring-[#D1FAE5] outline-none transition-all duration-200"
                                        placeholder="Choose a strong password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#059669] transition-colors focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-5 h-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-5 h-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="text-red-500 text-xs mt-1 font-medium ml-1">
                                        {errors.password}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 px-4 text-sm font-bold tracking-wide rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg focus:outline-none transition-all duration-300 transform active:scale-[0.98]"
                            >
                                {processing ? "Registering..." : "Sign Up"}
                            </button>
                        </div>

                        {/* <div className="my-6 flex items-center gap-4">
                            <hr className="w-full border-slate-200" />
                            <p className="text-sm text-slate-400 font-medium whitespace-nowrap">
                                or continue with
                            </p>
                            <hr className="w-full border-slate-200" />
                        </div>

                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-3 py-3 px-6 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all duration-200"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Google
                        </button> */}

                        <p className="text-center text-sm text-slate-500 mt-6">
                            Already have an account?{" "}
                            <Link
                                href="#"
                                className="text-[#059669] font-semibold hover:underline"
                            >
                                Log In
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

Register.layout = (page) => <CustomerLayout children={page} title="Register" />;
export default Register;
