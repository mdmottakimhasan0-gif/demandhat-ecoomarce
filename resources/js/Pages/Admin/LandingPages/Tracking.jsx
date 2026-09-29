import React from "react";
import { useForm } from "@inertiajs/react";
import { Check, ShieldCheck } from "lucide-react";
import LandingLayout, { Card, btn, field } from "@/components/AdminComponents/Landing/LandingLayout";

const Toggle = ({ value, onChange }) => (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)} className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : ""}`} />
    </button>
);

const Row = ({ label, help, children }) => (
    <div className="grid sm:grid-cols-[260px_1fr] gap-2 sm:gap-6 py-4 border-b border-slate-100 dark:border-slate-800/70 last:border-0">
        <div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</div>
            {help && <p className="text-xs text-slate-500 mt-0.5">{help}</p>}
        </div>
        <div>{children}</div>
    </div>
);

export default function Tracking({ settings, dispatch, requireConsent }) {
    const { data, setData, put, processing, errors } = useForm({
        enabled: settings.enabled,
        pixel_id: settings.pixel_id || "",
        capi_enabled: settings.capi_enabled,
        test_event_code: settings.test_event_code || "",
        api_version: settings.api_version || "v21.0",
        access_token: "",
        clear_access_token: false,
    });

    return (
        <LandingLayout title="Global tracking">
            <form onSubmit={(e) => { e.preventDefault(); put("/admin/landing-pages/tracking", { preserveScroll: true, onSuccess: () => setData((d) => ({ ...d, access_token: "", clear_access_token: false })) }); }} className="max-w-4xl space-y-5">
                <Card className="px-5">
                    <div className="pt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Meta Pixel (browser)</div>
                    <Row label="Enable global Pixel" help="Pages that use the global Pixel send events here unless they override or disable it."><Toggle value={data.enabled} onChange={(v) => setData("enabled", v)} /></Row>
                    <Row label="Pixel ID" help={settings.env_pixel_id ? "META_DEFAULT_PIXEL_ID is set in .env and is used when this field is empty." : "The public Pixel ID shown in Meta Events Manager."}>
                        <input className={field} value={data.pixel_id} onChange={(e) => setData("pixel_id", e.target.value.replace(/\D/g, ""))} placeholder="123456789012345" />
                        {errors.pixel_id && <p className="text-xs text-red-600 mt-1">{errors.pixel_id}</p>}
                    </Row>
                </Card>

                <Card className="px-5">
                    <div className="pt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Conversions API (server to Meta)</div>
                    <Row label="Enable global Conversions API" help="Master switch. Each page still opts in on its own tracking tab."><Toggle value={data.capi_enabled} onChange={(v) => setData("capi_enabled", v)} /></Row>
                    <Row label="Access token" help="Write-only. Stored encrypted and never sent to any browser.">
                        <div className="flex items-center gap-2">
                            <input type="password" autoComplete="new-password" className={field} value={data.access_token} onChange={(e) => setData((d) => ({ ...d, access_token: e.target.value, clear_access_token: false }))} placeholder={settings.has_access_token && !data.clear_access_token ? "•••••••••••• (saved - type to replace)" : settings.env_access_token ? "Using META_DEFAULT_ACCESS_TOKEN from .env" : "EAAB..."} />
                            {settings.has_access_token && (
                                <button type="button" className={btn.danger} onClick={() => setData((d) => ({ ...d, clear_access_token: !d.clear_access_token, access_token: "" }))}>{data.clear_access_token ? "Will remove" : "Remove"}</button>
                            )}
                        </div>
                        {settings.has_access_token && !data.clear_access_token && (
                            <p className="mt-1.5 text-xs text-green-600 inline-flex items-center gap-1"><ShieldCheck size={13} /> A token is saved and encrypted.</p>
                        )}
                    </Row>
                    <Row label="Test event code" help="Events sent with a code appear in Events Manager &gt; Test events instead of production data.">
                        <input className={field} value={data.test_event_code} onChange={(e) => setData("test_event_code", e.target.value)} placeholder="TEST12345" />
                        {errors.test_event_code && <p className="text-xs text-red-600 mt-1">{errors.test_event_code}</p>}
                    </Row>
                    <Row label="Graph API version">
                        <input className={`${field} w-32`} value={data.api_version} onChange={(e) => setData("api_version", e.target.value)} />
                        {errors.api_version && <p className="text-xs text-red-600 mt-1">{errors.api_version}</p>}
                    </Row>
                </Card>

                <Card className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Environment</div>
                    <div>CAPI delivery: <strong>{dispatch === "queue" ? "queued (needs a queue worker)" : "right after the response is sent"}</strong> <span className="text-slate-400">(LANDING_TRACKING_DISPATCH)</span></div>
                    <div>Consent gating: <strong>{requireConsent ? "on - events wait for window.LandingConsent.grant()" : "off"}</strong> <span className="text-slate-400">(LANDING_REQUIRE_CONSENT)</span></div>
                    <div className="text-xs text-slate-400">Changes here apply to pages when they are next published or their cache expires.</div>
                </Card>

                <button className={btn.primary} disabled={processing}><Check size={15} /> Save tracking settings</button>
            </form>
        </LandingLayout>
    );
}
