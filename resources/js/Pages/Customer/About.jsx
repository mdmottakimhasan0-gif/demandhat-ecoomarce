import AdminLayout from "../../Layouts/CustomerLayouts/CustomerLayout";
import React from "react";
import { Head } from "@inertiajs/react";
import { FaShippingFast, FaLeaf, FaUsers } from "react-icons/fa";

function About() {
    return (
        <div className="bg-[#F8FAFC] transition-colors duration-300 font-hindSiliguri">
            <Head title="About Unity Haven" />
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-[#0b0c1e] via-[#1e1b4b] to-[#2e1065] text-white">
                <div className="mx-auto px-6 py-20 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                        ইউনিটি হ্যাভেন{" "}
                        <span className="text-violet-400">সম্পর্কে</span> জানুন
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-lg text-indigo-100">
                        সাশ্রয়ী মূল্যে মানসম্মত নিত্যপ্রয়োজনীয় পণ্য পৌঁছে দিতে
                        আমরা কাজ করছি একটি আধুনিক ও নির্ভরযোগ্য ই-কমার্স প্ল্যাটফর্ম
                        হিসেবে।
                    </p>
                </div>
            </section>

            {/* About Content */}
            <section className="max-w-[1200px] mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">
                            আমরা কারা?
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            ইউনিটি হ্যাভেন (Unity Haven) একটি আধুনিক ই-কমার্স
                            প্লাটফর্ম যা মূলত শিক্ষার্থী, ব্যাচেলর এবং সচেতন
                            ক্রেতাদের কথা মাথায় রেখে তৈরি করা হয়েছে। যারা
                            অতিরিক্ত খরচ না করেই গুণমান বজায় রাখতে চান, আমরা
                            তাদের পাশে আছি। আমরা অত্যন্ত সতর্কতার সাথে
                            প্রতিদিনের প্রয়োজনীয় পণ্য, গ্যাজেট এবং লাইফস্টাইল
                            পণ্যগুলো আপনার বাজেট এবং প্রয়োজন অনুযায়ী সরবরাহ
                            করি।
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            আমাদের লক্ষ্য খুব সহজ: সবার জন্য অনলাইন কেনাকাটা
                            সহজ, নির্ভরযোগ্য এবং সাশ্রয়ী করে তোলা। টেকনাফ থেকে
                            তেতুলিয়া—দেশের প্রতিটি প্রান্তে আমরা পৌঁছে দিচ্ছি
                            ক্যাশ অন ডেলিভারি সুবিধা।
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            যোগাযোগের তথ্য
                        </h3>
                        <ul className="space-y-3 text-gray-600">
                            <li>📞 মোবাইল: +88 01898-385395</li>
                            <li>📧 ইমেইল: info@unityhavenbd.com</li>
                            <li>📍 সেবা দিচ্ছি সারা বাংলাদেশে</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="bg-indigo-50/60 py-16">
                <div className="mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
                        আমাদের মূল লক্ষ্য ও আদর্শ
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
                        <div className="bg-white rounded-xl p-6 shadow-md text-center border border-indigo-100/50">
                            <FaLeaf className="text-4xl mx-auto text-indigo-600 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                মানসম্মত পণ্য
                            </h3>
                            <p className="text-gray-600 text-sm">
                                আমরা বিশ্বাসযোগ্য, টেকসই এবং দরকারি পণ্যের দিকে
                                মনোনিবেশ করি যা গ্রাহকের জীবনে প্রকৃত মূল্য যোগ
                                করে।
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-md text-center border border-indigo-100/50">
                            <FaShippingFast className="text-4xl mx-auto text-indigo-600 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                দ্রুত ডেলিভারি
                            </h3>
                            <p className="text-gray-600 text-sm">
                                বিশ্বস্ত লজিস্টিক পার্টনারদের মাধ্যমে আমরা সারা
                                বাংলাদেশে দ্রুত এবং নির্ভরযোগ্য হোম ডেলিভারি
                                নিশ্চিত করি।
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-md text-center border border-indigo-100/50">
                            <FaUsers className="text-4xl mx-auto text-indigo-600 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                গ্রাহক সন্তুষ্টি
                            </h3>
                            <p className="text-gray-600 text-sm">
                                স্বচ্ছ নীতিমালা এবং আন্তরিক কাস্টমার সাপোর্টের
                                মাধ্যমে আমরা সব সময় গ্রাহকের চাহিদাকে অগ্রাধিকার
                                দিই।
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="mx-auto px-6 py-16 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    স্মার্ট কেনাকাটা, সুন্দর জীবন।
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                    সাশ্রয়ী এবং মানসম্মত অনলাইন কেনাকাটার জন্য ইউনিটি হ্যাভেন (Unity Haven)-এর
                    উপর আস্থা রাখা হাজার হাজার সুখী গ্রাহকদের সাথে আপনিও যোগ
                    দিন।
                </p>
                <a
                    href="/productspage"
                    className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                    পণ্যগুলো দেখুন
                </a>
            </section>
        </div>
    );
}

About.layout = (page) => <AdminLayout children={page} />;
export default About;
