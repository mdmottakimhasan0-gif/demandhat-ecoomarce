import React from "react";
import { Link } from "@inertiajs/react";
import { Eye } from "lucide-react";

const RelatedProducts = ({ products }) => {
    if (!products || products.length === 0) return null;

    return (
        <div className="mt-16 mb-10">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 whitespace-nowrap">
                    রিলেটেড প্রোডাক্ট
                </h2>
                <div className="h-px w-full bg-gray-200"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.map((item) => {
                    const price = Number(item.price);
                    const disc = item.discount ? Number(item.discount) : 0;
                    const finalPrice = price - price * (disc / 100);

                    return (
                        <div
                            key={item.id}
                            className="bg-white rounded-xl border border-gray-200 overflow-hidden group shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="relative aspect-square overflow-hidden bg-gray-50">
                                {disc > 0 && (
                                    <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                        -{disc}%
                                    </div>
                                )}
                                <img
                                    src={`/storage/${item.image}`}
                                    alt={item.name}
                                    className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Link
                                        href={`/product/${item.id}`}
                                        className="bg-white p-2 rounded-full text-gray-900 hover:bg-green-600 hover:text-white transition-colors"
                                    >
                                        <Eye size={20} />
                                    </Link>
                                </div>
                            </div>
                            <div className="p-3">
                                <Link href={`/product/${item.id}`}>
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 h-10 mb-2 hover:text-green-600">
                                        {item.name}
                                    </h3>
                                </Link>
                                <div className="flex flex-col">
                                    <span className="text-green-600 font-bold text-sm">
                                        TK{" "}
                                        {Math.round(
                                            finalPrice,
                                        ).toLocaleString()}
                                    </span>
                                    {disc > 0 && (
                                        <span className="text-[10px] text-gray-400 line-through">
                                            TK {price.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RelatedProducts;
