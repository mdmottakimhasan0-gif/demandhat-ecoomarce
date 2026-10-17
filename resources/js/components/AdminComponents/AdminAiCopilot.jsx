import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import {
    FiX,
    FiSend,
    FiKey,
    FiExternalLink,
    FiMinimize2,
    FiAlertCircle,
    FiMessageSquare,
} from "react-icons/fi";
import { Sparkles } from "lucide-react";
import { FaRobot } from "react-icons/fa";
import toast from "react-hot-toast";

export default function AdminAiCopilot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: "bot",
            text: "👋 হ্যালো অ্যাডমিন! আমি আপনার **AI Operations Assistant**।\n\nআপনি আমাকে দিয়ে সরাসরি **সেল রিপোর্ট চেক**, **প্রোডাক্ট যোগ**, **ল্যান্ডিং পেজ তৈরি**, কিংবা **মেটা পিক্সেল ও সেটিংস** নিয়ন্ত্রণ করতে পারেন।",
            quick_replies: [
                "📊 আজকের সেল রিপোর্ট",
                "📦 নতুন প্রোডাক্ট যোগ",
                "🚀 ল্যান্ডিং পেজ তৈরি",
                "⚙️ মেটা পিক্সেল চেক",
            ],
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusInfo, setStatusInfo] = useState({ has_api_key: false, masked_key: null });
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState("");
    const [savingKey, setSavingKey] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const handleOpenTrigger = () => {
            setIsOpen(true);
        };
        window.addEventListener("open-admin-ai-copilot", handleOpenTrigger);
        return () => window.removeEventListener("open-admin-ai-copilot", handleOpenTrigger);
    }, []);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setHasUnread(false);
            fetchStatus();
        }
    }, [isOpen, messages]);

    const fetchStatus = async () => {
        try {
            const res = await axios.get("/admin/ai-assistant/status");
            setStatusInfo(res.data);
        } catch (e) {
            // ignore
        }
    };

    const handleSaveKey = async () => {
        setSavingKey(true);
        try {
            const res = await axios.post("/admin/ai-assistant/save-key", {
                api_key: apiKeyInput,
            });
            toast.success(res.data.message || "API Key saved successfully!");
            setShowKeyModal(false);
            setApiKeyInput("");
            fetchStatus();
        } catch (e) {
            toast.error("Failed to save API key.");
        } finally {
            setSavingKey(false);
        }
    };

    const handleSend = async (messageText) => {
        const text = (messageText || input).trim();
        if (!text || loading) return;

        const userMsg = {
            id: Date.now(),
            sender: "user",
            text: text,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const history = messages
                .slice(-6)
                .map((m) => ({
                    role: m.sender === "user" ? "user" : "model",
                    text: m.text || "",
                }))
                .filter((h) => Boolean(h.text));

            const res = await axios.post("/admin/ai-assistant/chat", {
                message: text,
                history: history,
            });

            const data = res.data;
            const botMsg = {
                id: Date.now() + 1,
                sender: "bot",
                text: data.text || "",
                action: data.action || null,
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
                    text: "দুঃখিত, কমান্ড এক্সিকিউট করতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <aside aria-label="Admin AI Copilot" className="fixed bottom-5 right-5 z-[99999] font-poppins text-slate-800 dark:text-slate-100">
            {/* 1. FLOATING CHAT BUTTON */}
            {!isOpen && (
                <div className="relative group">
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-xl hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center relative focus:outline-none focus:ring-4 focus:ring-indigo-300"
                        title="Open Admin AI Copilot"
                    >
                        <Sparkles className="w-6 h-6 animate-pulse text-amber-300" />
                        {hasUnread && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                            </span>
                        )}
                    </button>

                    {/* Tooltip badge */}
                    <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span>Admin AI Copilot ⚡</span>
                    </div>
                </div>
            )}

            {/* 2. CHATBOT WINDOW (Self-contained, identical to Customer Chatbot) */}
            {isOpen && (
                <div className="w-[92vw] sm:w-[410px] h-[550px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-3.5 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white font-bold">
                                    <FaRobot className="w-5 h-5" />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-indigo-700 rounded-full" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm tracking-wide leading-tight flex items-center gap-1.5">
                                    Admin AI Copilot
                                    <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-normal">Free</span>
                                </h4>
                                <p className="text-[11px] text-indigo-100 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                    অপারেশন ও অটোমেশন
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setShowKeyModal(true)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                                    statusInfo.has_api_key
                                        ? "text-emerald-200 bg-emerald-900/40 hover:bg-emerald-900/60"
                                        : "text-amber-200 bg-amber-900/40 hover:bg-amber-900/60"
                                }`}
                                title="Configure Free Gemini Key"
                            >
                                <FiKey size={12} />
                                <span>{statusInfo.has_api_key ? "API Active" : "Add Key"}</span>
                            </button>
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
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 dark:bg-slate-950/70 text-xs sm:text-sm">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${
                                    msg.sender === "user" ? "items-end" : "items-start"
                                }`}
                            >
                                <div
                                    className={`max-w-[86%] rounded-2xl p-3 shadow-xs ${
                                        msg.sender === "user"
                                            ? "bg-indigo-600 text-white rounded-br-none"
                                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none"
                                    }`}
                                >
                                    {/* Text Body */}
                                    <div className="whitespace-pre-line leading-relaxed">
                                        {msg.text}
                                    </div>

                                    {/* Action link card */}
                                    {msg.action && (
                                        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <Link
                                                href={msg.action.url}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-all"
                                            >
                                                <span>{msg.action.label}</span>
                                                <FiExternalLink size={12} />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-slate-400 px-1 mt-0.5">
                                    {msg.time}
                                </span>

                                {/* Quick Reply Chips */}
                                {msg.quick_replies && msg.quick_replies.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[92%]">
                                        {msg.quick_replies.map((chip, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSend(chip)}
                                                className="text-[11px] bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 px-2.5 py-1 rounded-full shadow-2xs transition-all active:scale-95"
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
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                                    <FaRobot size={12} />
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 flex items-center gap-1 shadow-xs">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer Input */}
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
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
                            placeholder="কমান্ড লিখুন (e.g. আজকের সেল রিপোর্ট)..."
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-all"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-xs"
                            title="Send Command"
                        >
                            <FiSend size={15} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal: Gemini Free API Key Settings */}
            {showKeyModal && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 font-poppins">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                                    <FiKey size={16} />
                                </div>
                                <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                                    Google Gemini AI Key (100% Free)
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowKeyModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        <div className="py-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                            <p>
                                গুগল জেমিনি ১.৫ ফ্ল্যাশ সম্পূর্ণ <strong>ফ্রি (Free of cost)</strong>। কোনো ক্রেডিট কার্ড লাগে না।
                            </p>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                <p className="font-semibold text-indigo-900 dark:text-indigo-300 mb-1">
                                    কীভাবে ফ্রি Key পাবেন:
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                                    <li>
                                        <a
                                            href="https://aistudio.google.com/app/apikey"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 dark:text-indigo-400 underline font-medium"
                                        >
                                            aistudio.google.com/app/apikey
                                        </a>{" "}
                                        -এ যান।
                                    </li>
                                    <li>আপনার জিমেইল দিয়ে সাইন ইন করুন।</li>
                                    <li>"Create API Key" বাটনে ক্লিক করে Key কপি করে নিন।</li>
                                </ol>
                            </div>

                            {statusInfo.has_api_key && (
                                <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    বর্তমান Key: <code className="bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">{statusInfo.masked_key}</code>
                                </p>
                            )}

                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                                    Gemini API Key পেস্ট করুন:
                                </label>
                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder="AIzaSy..."
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => setShowKeyModal(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300"
                            >
                                বন্ধ করুন
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveKey}
                                disabled={savingKey || !apiKeyInput.trim()}
                                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors"
                            >
                                {savingKey ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
