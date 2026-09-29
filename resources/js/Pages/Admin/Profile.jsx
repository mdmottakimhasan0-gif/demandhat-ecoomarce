import React, { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayouts/AdminLayout";
import { Head, useForm } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, KeyRound, Mail, MapPin, Phone, ShieldCheck, User } from "lucide-react";

const inputClass =
    "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function Field({ label, icon: Icon, error, children }) {
    return (
        <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {Icon && <Icon size={15} className="text-slate-400" />}
                {label}
            </label>
            {children}
            {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
}

function Card({ title, description, children }) {
    return (
        <section className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
            <div className="p-6">{children}</div>
        </section>
    );
}

function ProfileForm({ profile }) {
    const { data, setData, put, processing, errors, isDirty } = useForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
    });

    const submit = (e) => {
        e.preventDefault();
        put("/admin/profile", {
            preserveScroll: true,
            onSuccess: () => toast.success("Profile updated successfully."),
        });
    };

    return (
        <Card title="Profile details" description="Your name and contact information.">
            <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" icon={User} error={errors.name}>
                    <input className={inputClass} value={data.name} onChange={(e) => setData("name", e.target.value)} required />
                </Field>
                <Field label="Email address" icon={Mail} error={errors.email}>
                    <input type="email" className={inputClass} value={data.email} onChange={(e) => setData("email", e.target.value)} required />
                </Field>
                <Field label="Phone" icon={Phone} error={errors.phone}>
                    <input className={inputClass} value={data.phone} placeholder="01XXXXXXXXX" onChange={(e) => setData("phone", e.target.value)} />
                </Field>
                <Field label="Address" icon={MapPin} error={errors.address}>
                    <input className={inputClass} value={data.address} onChange={(e) => setData("address", e.target.value)} />
                </Field>
                <div className="sm:col-span-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={processing || !isDirty}
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </form>
        </Card>
    );
}

function PasswordForm() {
    const [show, setShow] = useState(false);
    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const submit = (e) => {
        e.preventDefault();
        put("/admin/profile/password", {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                toast.success("Password changed successfully.");
            },
            onError: () => reset("password", "password_confirmation"),
        });
    };

    const type = show ? "text" : "password";

    return (
        <Card title="Change password" description="Use at least 8 characters, with letters and numbers.">
            <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Field label="Current password" icon={KeyRound} error={errors.current_password}>
                        <input type={type} autoComplete="current-password" className={inputClass} value={data.current_password} onChange={(e) => setData("current_password", e.target.value)} required />
                    </Field>
                </div>
                <Field label="New password" icon={KeyRound} error={errors.password}>
                    <input type={type} autoComplete="new-password" className={inputClass} value={data.password} onChange={(e) => setData("password", e.target.value)} required />
                </Field>
                <Field label="Confirm new password" icon={KeyRound}>
                    <input type={type} autoComplete="new-password" className={inputClass} value={data.password_confirmation} onChange={(e) => setData("password_confirmation", e.target.value)} required />
                </Field>
                <div className="sm:col-span-2 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setShow(!show)}
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                        {show ? "Hide passwords" : "Show passwords"}
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-slate-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-900 shadow-sm transition hover:opacity-90 disabled:opacity-50"
                    >
                        {processing ? "Updating..." : "Update password"}
                    </button>
                </div>
            </form>
        </Card>
    );
}

export default function Profile({ profile }) {
    return (
        <>
            <Head title="My Profile" />
            <div className="mx-auto max-w-3xl space-y-6 p-2 lg:p-4 font-poppins antialiased">
                <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#064E3B] to-[#059669] p-6 text-white shadow-md">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-bold ring-2 ring-white/30">
                        {(profile.name || "U").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-semibold">{profile.name}</h1>
                        <p className="truncate text-sm text-emerald-100">{profile.email}</p>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium capitalize">
                            <ShieldCheck size={13} /> {profile.role}
                        </span>
                    </div>
                </div>

                <ProfileForm profile={profile} />
                <PasswordForm />
            </div>
        </>
    );
}

Profile.layout = (page) => <AdminLayout>{page}</AdminLayout>;
