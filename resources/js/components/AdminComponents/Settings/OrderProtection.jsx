import React from "react";
import { router, useForm, usePage } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import { FiShield, FiTrash2 } from "react-icons/fi";

const Toggle = ({ value, onChange, disabled }) => (
    <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors disabled:opacity-50 ${value ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-600"}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : ""}`} />
    </button>
);

const input =
    "w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500";

function Row({ title, help, children }) {
    return (
        <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 dark:border-slate-700/60 last:border-0">
            <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800 dark:text-gray-100">{title}</div>
                {help && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xl">{help}</p>}
            </div>
            {children}
        </div>
    );
}

/** Website settings > Order Protection: block duplicate orders by phone / IP, with an on/off switch. */
export default function OrderProtection({ data }) {
    const { errors } = usePage().props;
    const s = data.settings;
    const form = useForm({ enabled: s.enabled, block_phone: s.block_phone, block_ip: s.block_ip, ip_limit: s.ip_limit, window_hours: s.window_hours });
    const block = useForm({ type: "phone", value: "", reason: "" });
    const off = !form.data.enabled;

    const save = (e) => {
        e.preventDefault();
        form.put("/admin/settings/order-protection", { preserveScroll: true });
    };

    const addBlock = (e) => {
        e.preventDefault();
        block.post("/admin/settings/order-protection/blocked", {
            preserveScroll: true,
            onSuccess: () => block.reset("value", "reason"),
        });
    };

    return (
        <div className="space-y-6">
            {!data.ready && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
                    Run <code className="font-mono">php artisan migrate</code> to enable saving these settings. Until then the original rule (block a phone number that already has an active order) stays in effect.
                </div>
            )}

            <form onSubmit={save} className="bg-white dark:bg-[#1F2937] rounded-xl shadow border border-gray-200 dark:border-[#374151] p-5">
                <div className="flex items-center gap-2 mb-1">
                    <FiShield className="text-blue-600" size={20} />
                    <h2 className="text-sm sm:text-xl font-semibold font-poppins text-slate-800 dark:text-gray-200">Duplicate order protection</h2>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Applies to the website checkout and to landing page order forms.</p>

                <Row title="Protection enabled" help="Master switch. When off, no order is blocked - not even by the block list below.">
                    <Toggle value={form.data.enabled} onChange={(v) => form.setData("enabled", v)} />
                </Row>

                <Row title="Block by phone number" help="Reject an order when the same phone number already has an active order (not yet delivered, cancelled or returned).">
                    <Toggle disabled={off} value={form.data.block_phone} onChange={(v) => form.setData("block_phone", v)} />
                </Row>

                <Row title="Block by IP address" help="Reject an order when the same IP address has already placed the limit below within the time window. Leave off if many of your customers share a connection (offices, mobile networks).">
                    <Toggle disabled={off} value={form.data.block_ip} onChange={(v) => form.setData("block_ip", v)} />
                </Row>

                {form.data.block_ip && !off && (
                    <div className="grid sm:grid-cols-2 gap-4 py-4 border-b border-gray-100 dark:border-slate-700/60">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Max orders per IP</label>
                            <input type="number" min="1" max="100" className={input} value={form.data.ip_limit} onChange={(e) => form.setData("ip_limit", e.target.value)} />
                            {form.errors.ip_limit && <p className="text-xs text-red-600 mt-1">{form.errors.ip_limit}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Within (hours)</label>
                            <input type="number" min="1" max="720" className={input} value={form.data.window_hours} onChange={(e) => form.setData("window_hours", e.target.value)} />
                            {form.errors.window_hours && <p className="text-xs text-red-600 mt-1">{form.errors.window_hours}</p>}
                        </div>
                    </div>
                )}

                <div className="pt-4">
                    <button disabled={form.processing || !data.ready} className="px-5 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60">
                        {form.processing ? "Saving..." : "Save settings"}
                    </button>
                </div>
            </form>

            <div className="bg-white dark:bg-[#1F2937] rounded-xl shadow border border-gray-200 dark:border-[#374151] p-5">
                <h2 className="text-sm sm:text-xl font-semibold font-poppins text-slate-800 dark:text-gray-200 mb-1">Block list</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Numbers and IP addresses listed here can never place an order while protection is enabled.</p>

                <form onSubmit={addBlock} className="grid sm:grid-cols-[130px_1fr_1fr_auto] gap-2 mb-2">
                    <select className={input} value={block.data.type} onChange={(e) => block.setData("type", e.target.value)}>
                        <option value="phone">Phone number</option>
                        <option value="ip">IP address</option>
                    </select>
                    <input className={input} value={block.data.value} onChange={(e) => block.setData("value", e.target.value)} placeholder={block.data.type === "phone" ? "01XXXXXXXXX" : "203.0.113.7 or 203.0.113.0/24"} />
                    <input className={input} value={block.data.reason} onChange={(e) => block.setData("reason", e.target.value)} placeholder="Reason (optional)" />
                    <button disabled={block.processing || !block.data.value || !data.ready} className="px-5 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60">Block</button>
                </form>
                {(errors.value || block.errors.value) && <p className="text-xs text-red-600 mb-2">{errors.value || block.errors.value}</p>}

                <div className="mt-3 divide-y divide-gray-100 dark:divide-slate-700/60 border-t border-gray-100 dark:border-slate-700/60">
                    {data.blocked.map((b) => (
                        <div key={b.id} className="flex items-center gap-3 py-2.5 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${b.type === "ip" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"}`}>{b.type === "ip" ? "IP" : "Phone"}</span>
                            <span className="font-mono text-slate-800 dark:text-gray-100">{b.value}</span>
                            <span className="text-gray-500 dark:text-gray-400 truncate flex-1">{b.reason}</span>
                            <span className="text-xs text-gray-400 hidden sm:block">{new Date(b.created_at).toLocaleDateString()}</span>
                            <button
                                title="Remove from block list"
                                className="p-1.5 text-gray-400 hover:text-red-600"
                                onClick={() => confirm(`Unblock ${b.value}?`) && router.delete(`/admin/settings/order-protection/blocked/${b.id}`, { preserveScroll: true, onSuccess: () => toast.success("Unblocked") })}
                            >
                                <FiTrash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {!data.blocked.length && <p className="py-6 text-center text-sm text-gray-400">Nothing blocked yet.</p>}
                </div>
            </div>
        </div>
    );
}
