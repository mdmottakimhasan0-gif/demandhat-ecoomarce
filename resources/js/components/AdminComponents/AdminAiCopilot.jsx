import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import {
    FiX,
    FiSend,
    FiKey,
    FiCheck,
    FiExternalLink,
    FiBarChart2,
    FiPlusCircle,
    FiGlobe,
    FiSettings,
    FiHelpCircle,
    FiAlertCircle,
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
            text: "👋 হ্যালো অ্যাডমিন! আমি আপনার **AI Operations Assistant**।\n\nআপনি আমাকে দিয়ে সরাসরি **সেল রিপোর্ট চেক**, **প্রোডাক্ট যোগ**, **ল্যান্ডিং পেজ তৈরি**, কিংবা **মেটা পিক্সেল ও বিজনেস সেটিংস** পরিবর্তন করাতে পারেন।",
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

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
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
            toast.success(res.data.message || "API Key saved!");
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
        <>
            {/* Top Bar Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold shadow-sm hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200"
                title="AI Operations Assistant"
            >
                <Sparkles size={15} className="animate-pulse text-amber-300" />
                <span className="hidden sm:inline">AI Assistant</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-medium">Free</span>
            </button>

            {/* Slide-over Drawer Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[99990] transition-opacity animate-in fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Slide-over Drawer Window */}
            {isOpen && (
                <div className="fixed inset-y-0 right-0 z-[99999] w-full sm:w-[450px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col font-poppins border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                                <FaRobot className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                        Admin AI Copilot
                                    </h3>
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        Active
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Automate Products, Pages, Analytics & Settings
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setShowKeyModal(true)}
                                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                                    statusInfo.has_api_key
                                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                                        : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
                                }`}
                                title="Configure Free Gemini API Key"
                            >
                                <FiKey size={14} />
                                <span className="hidden sm:inline">
                                    {statusInfo.has_api_key ? "API Active" : "Add Free Key"}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
                            >
                                <FiX size={18} />
                            </button>
                        </div>
                    </div>

                    {/* API Key Banner if not set */}
                    {!statusInfo.has_api_key && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-200 dark:border-amber-900/40 p-3 px-4 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                            <div className="flex items-center gap-2">
                                <FiAlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <span>১০০% ফ্রি গুগল AI চালু করতে ১ ক্লিকে ফ্রি Key যোগ করুন।</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowKeyModal(true)}
                                className="font-bold text-amber-700 dark:text-amber-400 underline underline-offset-2 ml-2 hover:text-amber-900"
                            >
                                সেটিংস
                            </button>
                        </div>
                    )}

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 text-xs sm:text-sm">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${
                                    msg.sender === "user" ? "items-end" : "items-start"
                                }`}
                            >
                                <div
                                    className={`max-w-[88%] rounded-2xl p-3.5 shadow-xs ${
                                        msg.sender === "user"
                                            ? "bg-indigo-600 text-white rounded-br-none"
                                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700/60 rounded-bl-none"
                                    }`}
                                >
                                    <div className="whitespace-pre-line leading-relaxed">
                                        {msg.text}
                                    </div>

                                    {/* Action link card (e.g. view product or open landing page builder) */}
                                    {msg.action && (
                                        <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-700">
                                            <Link
                                                href={msg.action.url}
                                                onClick={() => setIsOpen(false)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-all"
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
                                                className="text-[11px] bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full shadow-2xs transition-all active:scale-95"
                                            >
                                                {chip}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                                    <FaRobot size={12} />
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2 flex items-center gap-1 shadow-xs">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer Input */}
                    <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
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
                            placeholder="কমান্ড লিখুন (e.g. আজকের সেল রিপোর্ট বা প্রোডাক্ট যোগ করো)..."
                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
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

            {/* Modal: Free Gemini API Key Settings */}
            {showKeyModal && (
                <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 font-poppins">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <FiKey size={18} />
                                </div>
                                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                                    Google Gemini AI (100% Free)
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowKeyModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 mb-5">
                            <p>
                                গুগল সম্পূর্ণ ফ্রিতে প্রতিদিন <strong>১,৫০০টি রিকোয়েস্ট</strong> ব্যবহারের সুবিধা দেয়। কোনো ক্রেডিট কার্ড বা টাকা লাগে না।
                            </p>
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                                <p className="font-semibold text-slate-700 dark:text-slate-300">
                                    কীভাবে ফ্রি Key পাবেন:
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400">
                                    <li>
                                        <a
                                            href="https://aistudio.google.com/app/apikey"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 underline font-semibold"
                                        >
                                            aistudio.google.com/app/apikey
                                        </a>{" "}
                                        -এ যান।
                                    </li>
                                    <li>"Create API Key" বাটনে ক্লিক করে Key কপি করুন।</li>
                                    <li>নিচের বক্সে পেস্ট করে সেভ করুন।</li>
                                </ol>
                            </div>

                            {statusInfo.masked_key && (
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <FiCheck /> বর্তমান সেভ করা Key: <code>{statusInfo.masked_key}</code>
                                </p>
                            )}

                            <div>
                                <label className="block mb-1.5 font-semibold text-slate-700 dark:text-slate-300">
                                    Gemini API Key:
                                </label>
                                <input
                                    type="text"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder="AIzaSy..."
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setShowKeyModal(false)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
                            >
                                বাতিল
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveKey}
                                disabled={savingKey}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
                            >
                                {savingKey ? "সেভ হচ্ছে..." : "Save Key"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
