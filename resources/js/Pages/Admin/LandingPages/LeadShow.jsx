import React from "react";
import { Link, router } from "@inertiajs/react";
import { ArrowLeft, Trash2 } from "lucide-react";
import LandingLayout, { Badge, Card, btn, field, fmt } from "@/components/AdminComponents/Landing/LandingLayout";

const Row = ({ k, v }) => (
    <div className="flex gap-3 py-2 border-b border-slate-100 dark:border-slate-800/70 last:border-0 text-sm">
        <div className="w-40 shrink-0 text-slate-400">{k}</div>
        <div className="flex-1 text-slate-800 dark:text-slate-100 break-words">{v || <span className="text-slate-300 dark:text-slate-600">-</span>}</div>
    </div>
);

export default function LeadShow({ lead, statuses = [] }) {
    return (
        <LandingLayout
            title={lead.name || lead.email || `Lead #${lead.id}`}
            actions={
                <>
                    <Link href="/admin/landing-pages/leads" className={btn.outline}><ArrowLeft size={15} /> All leads</Link>
                    <button className={btn.danger} onClick={() => confirm("Delete this lead permanently?") && router.delete(`/admin/landing-pages/leads/${lead.id}`)}><Trash2 size={15} /> Delete</button>
                </>
            }
        >
            <div className="grid lg:grid-cols-3 gap-5">
                <Card className="p-5 lg:col-span-2">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Submitted data</h3>
                    {lead.data?.length ? lead.data.map((d) => <Row key={d.name} k={d.label} v={d.value} />) : <p className="text-sm text-slate-400">No form data stored.</p>}
                </Card>
                <div className="space-y-5">
                    <Card className="p-5">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Status</h3>
                        <select className={field} value={lead.status} onChange={(e) => router.patch(`/admin/landing-pages/leads/${lead.id}`, { status: e.target.value }, { preserveScroll: true })}>
                            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="mt-3"><Badge value={lead.status} /></div>
                    </Card>
                    <Card className="p-5">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Attribution</h3>
                        <Row k="Received" v={fmt(lead.created_at)} />
                        <Row k="Landing page" v={lead.landing_page ? <Link className="text-blue-600 hover:underline" href={`/admin/landing-pages/${lead.landing_page.id}/builder`}>{lead.landing_page.title}</Link> : null} />
                        <Row k="Source" v={lead.source} />
                        {Object.entries(lead.utm || {}).map(([k, v]) => <Row key={k} k={k} v={v} />)}
                        <Row k="Referrer" v={lead.referrer} />
                        <Row k="Landing URL" v={lead.landing_url} />
                        <Row k="Browser" v={lead.user_agent} />
                    </Card>
                </div>
            </div>
        </LandingLayout>
    );
}
