import React, { useState, useEffect } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import CustomerLayout from "@/Layouts/CustomerLayouts/CustomerLayout";
import ReactPixel from "react-facebook-pixel";

// Import new sub-components
import ShippingForm from "@/Components/Checkout/ShippingForm";
import { GiCancel } from "react-icons/gi";
import PaymentMethod from "@/Components/Checkout/PaymentMethod";
import OrderSummary from "@/Components/Checkout/OrderSummary";
import { TiWarning } from "react-icons/ti";
import { FaWhatsapp } from "react-icons/fa6";
import { IoMdCall } from "react-icons/io";

const Checkout = ({ cartItems = [], totals = {}, auth, contact, deliveryConfig = {} }) => {
    const [processingId, setProcessingId] = useState(null);
    const [showPopup, setShowPopup] = useState(false); // New state for popup

    // 1. Initialize form
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        name: "",
        email: auth.user?.email || "",
        phone: auth.user?.phone || "",
        address: auth.user?.address || "",
        delivery_area: "outside_dhaka",
        payment_method: "cod",
    });

    const updateQuantity = (id, newQty) => {
        if (newQty < 1) return;
        setProcessingId(id);
        router.patch(
            `/cart/update/${id}`,
            { quantity: newQty },
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const removeItem = (id) => {
        if (!confirm("Are you sure?")) return;
        router.delete(`/cart/remove/${id}`, { preserveScroll: true });
    };

    // 2. Local state for calculation
    const [summary, setSummary] = useState({
        deliveryFee: 0,
        grandTotal: totals.grand_total || 0,
    });

    // 3. Logic: Delivery Fee Calculation
    const calculateDeliveryFee = (area, items) => {
        if (!area || !items || items.length === 0) return 0;

        // 1. If All Products Free Delivery is active globally
        if (deliveryConfig?.all_free) {
            return 0;
        }

        // 2. If a minimum order amount for free delivery is set, check subtotal
        const freeMinAmount = Number(deliveryConfig?.free_min_amount || 0);
        let subTotal = 0;
        if (totals && totals.itemTotal) {
            subTotal =
                typeof totals.itemTotal === "string"
                    ? parseFloat(totals.itemTotal.replace(/[^0-9.-]+/g, ""))
                    : Number(totals.itemTotal);
        }
        if (freeMinAmount > 0 && subTotal >= freeMinAmount) {
            return 0;
        }

        const rates = deliveryConfig?.rates || {
            high: [300, 500],
            medium: [150, 250],
            base: [60, 120],
        };
        const baseRate = rates.base ? rates.base[idx] : (idx === 0 ? 60 : 120);

        // If all items in cart are marked as free shipping
        const isCartAllFree = items.every((item) => item.bussiness_class === "free");
        if (isCartAllFree) {
            return 0;
        }

        return baseRate;
    };

    // 4. Effect: Update totals
    useEffect(() => {
        const fee = calculateDeliveryFee(data.delivery_area, cartItems);
        let subTotal = 0;
        if (totals && totals.itemTotal) {
            subTotal =
                typeof totals.itemTotal === "string"
                    ? parseFloat(totals.itemTotal.replace(/[^0-9.-]+/g, ""))
                    : Number(totals.itemTotal);
        }
        setSummary({
            deliveryFee: fee,
            grandTotal: (subTotal || 0) + fee,
        });
    }, [data.delivery_area, cartItems, totals.itemTotal]);

    // === NEW LOGIC: Listen for pending_order error to show popup ===
    useEffect(() => {
        if (errors.pending_order) {
            setShowPopup(true);
        }
    }, [errors.pending_order]);

    // 5. Effect: Pixel Tracking
    useEffect(() => {
        if (!cartItems || cartItems.length === 0) return;

        const eventId = "checkout_" + Date.now();

        // Client-Side Pixel
        ReactPixel.track(
            "InitiateCheckout",
            {
                currency: "BDT",
                value: totals.grand_total,
                num_items: cartItems.length,
                content_ids: cartItems.map((item) => item.id),
                content_type: "product",
            },
            { eventID: eventId },
        );

        // Server-Side GTM
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({
            event: "begin_checkout",
            event_id: eventId,
            ecommerce: {
                currency: "BDT",
                value: totals.grand_total,
                items: cartItems.map((item, index) => ({
                    item_id: item.id,
                    item_name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    index: index,
                })),
            },
        });
    }, [cartItems, totals.grand_total]);

    // 6. Handle Submit
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.delivery_area) {
            alert("দয়া করে ডেলিভারি এরিয়া সিলেক্ট করুন ");
            return;
        }
        // Clear previous popup errors before new submission
        clearErrors("pending_order");
        post("/checkout", { preserveScroll: true });
    };

    return (
        <>
            <Head title="Checkout" />

            {/* === NEW: Active Order Popup Modal === */}
            {showPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden font-hindSiliguri relative">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowPopup(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                        >
                            <GiCancel size={25} />
                        </button>

                        <div className="p-6 text-center mt-4">
                            <div className="w-16 h-16 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-50">
                                <TiWarning size={35} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                অর্ডার স্থগিত!
                            </h3>
                            <p className="text-gray-700 mb-6 font-medium text-[15px] leading-relaxed">
                                আপনার একটি অর্ডার এখনো সম্পন্ন হয়নি। নতুন আরো
                                অর্ডার করতে নিচের নম্বর গুলোতে কল করুন
                            </p>

                            <div className="flex flex-col gap-3">
                                {/* REPLACE 017XXXXXXXX WITH YOUR ACTUAL CALL NUMBER */}
                                <a
                                    href={contact?.phone ? `tel:${contact.phone}` : "#"}
                                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                                >
                                    <IoMdCall size={25} />
                                    {contact?.phone ? `কল করুন (${contact.phone})` : "কল করুন"}
                                </a>

                                {/* REPLACE 88017XXXXXXXX WITH YOUR ACTUAL WHATSAPP NUMBER (Include Country Code 88) */}
                                <a
                                    href={contact?.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                                >
                                    <FaWhatsapp size={25} />
                                    WhatsApp করুন
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ========================================= */}

            <div className="py-6 mx-auto px-4 max-w-[1200px]">
                <h1 className="text-2xl font-bold mb-8">Checkout</h1>

                {/* Normal Error Banner */}
                {errors.error && (
                    <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 shadow-md animate-bounce">
                        <div className="flex items-center">
                            <svg
                                className="w-6 h-6 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="font-bold">{errors.error}</span>
                        </div>
                        <p className="text-sm font-hindSiliguri mt-1 ml-8">
                            অনুগ্রহ করে কার্ট থেকে পণ্যের পরিমাণ কমিয়ে আবার
                            চেষ্টা করুন অথবা আমাদের কল করুন।
                        </p>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-2/3">
                        <form id="checkout-form" onSubmit={handleSubmit}>
                            <ShippingForm
                                data={data}
                                setData={setData}
                                errors={errors}
                                deliveryFee={summary.deliveryFee}
                                deliveryConfig={deliveryConfig}
                                cartItems={cartItems}
                            />

                            <div className="mt-4 sm:mt-8">
                                <button
                                    type="submit"
                                    disabled={
                                        processing || cartItems.length === 0
                                    }
                                    className="w-full font-hindSiliguri bg-green-600 hover:bg-green-700 text-white font-bold sm:py-4 py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {processing
                                        ? "প্রসেসিং হচ্ছে..."
                                        : "অর্ডার সম্পন্ন করুন"}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="w-full lg:w-1/3">
                        <OrderSummary
                            cartItems={cartItems}
                            totals={totals}
                            summary={summary}
                            data={data}
                            updateQuantity={updateQuantity}
                            removeItem={removeItem}
                            processingId={processingId}
                            deliveryConfig={deliveryConfig}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

Checkout.layout = (page) => <CustomerLayout children={page} />;
export default Checkout;
