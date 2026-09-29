import React from "react";
import { ShoppingCart, ShoppingBag } from "lucide-react";
import { FiPhoneCall } from "react-icons/fi";
import { BsWhatsapp } from "react-icons/bs";

const ProductActions = ({ product, loading, onAddToCart, contact }) => {
    // Shared button styling
    const btnClass =
        "w-full py-3 flex font-hindSiliguri shadow-sm items-center px-4 gap-3 justify-center rounded-lg text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5";

    // Helper function to clean WhatsApp number (removes spaces, +, dashes for the wa.me link)
    const formatWhatsAppNumber = (number) => {
        if (!number) return "";
        return number.replace(/\D/g, "");
    };

    return (
        <div className="space-y-3">
            {/* DYNAMIC CONTACT BUTTONS */}
            {contact && (
                <>
                    {/* PHONE BUTTON */}
                    {contact.phone && (
                        <a
                            href={`tel:${contact.phone}`}
                            className={`${btnClass} bg-[#2563EB] hover:bg-[#1D4ED8]`}
                        >
                            <FiPhoneCall size={22} />
                            <span className="font-semibold text-lg">
                                কল করুন : {contact.phone}
                            </span>
                        </a>
                    )}

                    {/* WHATSAPP BUTTON */}
                    {contact.whatsapp && (
                        <a
                            href={`https://wa.me/${formatWhatsAppNumber(contact.whatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${btnClass} bg-[#20bd5b] hover:bg-[#199648]`}
                        >
                            <BsWhatsapp size={22} />
                            <span className="font-semibold text-lg">
                                হোয়াটসঅ্যাপ : {contact.whatsapp}
                            </span>
                        </a>
                    )}
                </>
            )}

            {/* ADD TO CART BUTTON */}
            <button
                onClick={() => onAddToCart(false)}
                disabled={product.stock <= 0 || loading}
                className={`${btnClass} ${product.stock > 0 ? "bg-[#c607c6] hover:bg-[#800080] font-bold" : "bg-gray-300 font-bold cursor-not-allowed text-gray-500"}`}
            >
                <ShoppingCart size={22} />
                <span className="text-lg">
                    {loading ? "যোগ করা হচ্ছে..." : "কার্টে যোগ করুন"}
                </span>
            </button>

            {/* ORDER NOW BUTTON */}
            <button
                onClick={() => onAddToCart(true)}
                disabled={product.stock <= 0 || loading}
                className={`${btnClass} font-bold ${product.stock > 0 ? "bg-green-600 hover:bg-green-700" : "bg-gray-200 cursor-not-allowed text-gray-400"}`}
            >
                <ShoppingBag size={22} />
                <span className="text-lg">
                    {loading ? "লোডিং হচ্ছে..." : "অর্ডার করুন"}
                </span>
            </button>
        </div>
    );
};

export default ProductActions;
