import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import {
    FiMessageSquare,
    FiX,
    FiSend,
    FiPackage,
    FiTruck,
    FiSearch,
    FiPhoneCall,
    FiCheckCircle,
    FiClock,
    FiExternalLink,
    FiMinimize2,
} from "react-icons/fi";
import { FaWhatsapp, FaRobot } from "react-icons/fa";

export default function CustomerChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: "bot",
            type: "text",
            text: "স্বাগতম! 😊\n\nআমি আপনার ভার্চুয়াল শপিং এসিস্ট্যান্ট। আপনি আপনার **অর্ডার ট্র্যাক** করতে পারেন, যেকোনো **পণ্য খুঁজতে** পারেন বা প্রশ্ন জিজ্ঞাসা করতে পারেন।",
            quick_replies: [
                "📦 অর্ডার ট্র্যাক করুন",
                "🚚 ডেলিভারি চার্জ কত?",
                "🔍 সেরা প্রোডাক্ট দেখাও",
                "📞 হোয়াটসঅ্যাপে কথা বলুন",
            ],
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setHasUnread(false);
        }
    }, [messages, isOpen]);

    const handleSend = async (messageText) => {
        const text = (messageText || input).trim();
        if (!text || loading) return;

        const userMsg = {
            id: Date.now(),
            sender: "user",
            type: "text",
            text: text,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // Build recent history for context
            const history = messages
                .slice(-6)
                .map((m) => ({
                    role: m.sender === "user" ? "user" : "model",
                    text: m.text || "",
                }))
                .filter((h) => Boolean(h.text));

            const res = await axios.post("/api/chatbot/customer", {
                message: text,
                history: history,
            });

            const data = res.data;
            const botMsg = {
                id: Date.now() + 1,
                sender: "bot",
                type: data.type || "text",
                text: data.text || "",
                orders: data.orders || [],
                products: data.products || [],
                whatsapp_url: data.whatsapp_url || null,
                quick_replies: data.quick_replies || [],
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: "bot",
                    type: "text",
                    text: "দুঃখিত, সংযোগে সাময়িক সমস্যা হচ্ছে। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন অথবা সরাসরি আমাদের হোয়াটসঅ্যাপে মেসেজ দিন।",
                    quick_replies: ["📞 হোয়াটসঅ্যাপে কথা বলুন"],
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <aside aria-label="Customer AI Assistant" className="fixed bottom-5 right-5 z-50 font-poppins text-gray-800">
            {/* 1. FLOATING CHAT BUTTON */}
            {!isOpen && (
                <div className="relative group">
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center relative focus:outline-none focus:ring-4 focus:ring-emerald-300"
                        title="Chat with us"
                    >
                        <FiMessageSquare className="w-6 h-6 animate-pulse" />
                        {hasUnread && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                            </span>
                        )}
                    </button>

                    {/* Tooltip badge */}
                    <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span>অর্ডার ট্র্যাক বা সাহায্য প্রয়োজন? 💬</span>
                    </div>
                </div>
            )}

            {/* 2. CHATBOT WINDOW */}
            {isOpen && (
                <div className="w-[92vw] sm:w-[380px] h-[540px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white font-bold">
                                    <FaRobot className="w-5 h-5" />
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-emerald-700 rounded-full" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm tracking-wide leading-tight">
                                    AI শপিং এসিস্ট্যান্ট
                                </h4>
                                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                    সর্বদা সক্রিয় (Online)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Minimize"
                            >
                                <FiMinimize2 size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Close"
                            >
                                <FiX size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-xs sm:text-sm">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${
                                    msg.sender === "user" ? "items-end" : "items-start"
                                }`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                                        msg.sender === "user"
                                            ? "bg-emerald-600 text-white rounded-br-none"
                                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                                    }`}
                                >
                                    {/* Text Body with basic markdown line breaks & bold formatting */}
                                    <div className="whitespace-pre-line leading-relaxed">
                                        {msg.text}
                                    </div>

                                    {/* Rich Card: Order Tracking */}
                                    {msg.orders && msg.orders.length > 0 && (
                                        <div className="mt-3 space-y-2.5">
                                            {msg.orders.map((ord) => (
                                                <div
                                                    key={ord.id}
                                                    className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-gray-800 text-xs shadow-xs"
                                                >
                                                    <div className="flex items-center justify-between font-bold mb-1 border-b border-emerald-200/50 pb-1">
                                                        <span>অর্ডার #{ord.id}</span>
                                                        <span className="text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                                            {ord.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-gray-600 space-y-0.5 mt-1.5">
                                                        <p className="flex items-center gap-1">
                                                            <FiClock size={12} /> {ord.date}
                                                        </p>
                                                        <p className="font-semibold text-gray-900">
                                                            মোট: ৳{ord.total}
                                                        </p>
                                                        {ord.courier_name && (
                                                            <p className="text-emerald-700">
                                                                কুরিয়ার: {ord.courier_name} {ord.tracking_code ? `(${ord.tracking_code})` : ""}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {ord.items_summary && (
                                                        <div className="mt-2 text-[11px] bg-white/80 p-2 rounded-lg border border-emerald-100 text-gray-700 whitespace-pre-line">
                                                            {ord.items_summary}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Rich Card: Product Recommendations */}
                                    {msg.products && msg.products.length > 0 && (
                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {msg.products.map((prod) => (
                                                <div
                                                    key={prod.id}
                                                    className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col justify-between shadow-xs hover:border-emerald-500 transition-colors"
                                                >
                                                    {prod.image ? (
                                                        <img
                                                            src={prod.image}
                                                            alt={prod.name}
                                                            className="w-full h-20 object-cover rounded-lg mb-1.5"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mb-1.5">
                                                            <FiPackage size={22} />
                                                        </div>
                                                    )}
                                                    <p className="font-semibold text-gray-900 text-[11px] line-clamp-1">
                                                        {prod.name}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-emerald-600 font-bold text-xs">
                                                            ৳{prod.selling_price}
                                                        </span>
                                                        <Link
                                                            href={prod.url}
                                                            className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-medium hover:bg-emerald-700 transition-colors"
                                                        >
                                                            অর্ডার
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Rich Card: WhatsApp Button */}
                                    {msg.whatsapp_url && (
                                        <div className="mt-2.5">
                                            <a
                                                href={msg.whatsapp_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#1ebd5a] transition-colors shadow-sm"
                                            >
                                                <FaWhatsapp size={15} /> সরাসরি হোয়াটসঅ্যাপে কথা বলুন
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 px-1 mt-0.5">
                                    {msg.time}
                                </span>

                                {/* Quick Reply Chips */}
                                {msg.quick_replies && msg.quick_replies.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                                        {msg.quick_replies.map((chip, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSend(chip)}
                                                className="text-[11px] bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs transition-all active:scale-95"
                                            >
                                                {chip}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <FaRobot size={12} />
                                </div>
                                <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2 flex items-center gap-1 shadow-xs">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer Input */}
                    <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="মেসেজ বা ফোন নম্বর লিখুন..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-xs"
                            title="Send Message"
                        >
                            <FiSend size={15} />
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}
