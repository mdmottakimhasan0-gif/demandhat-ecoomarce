import AdminLayout from "@/Layouts/AdminLayouts/AdminLayout";
import React, { useState, useEffect } from "react";
import { Link, useForm, Head } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import { FiTrash2, FiPlus, FiPhone, FiAlertCircle, FiVolume2, FiImage, FiGrid, FiLayers } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { TbCategory } from "react-icons/tb";
import { MdSettings, MdLightMode } from "react-icons/md";
import { BiImage, BiUpload, BiX } from "react-icons/bi";
import MarqueeForm from "@/components/AdminComponents/Settings/MarqueeForm";
import OrderProtection from "@/components/AdminComponents/Settings/OrderProtection";
import { FiShield } from "react-icons/fi";

function Setting({ heroes = [], sections = [], marquee = [], contacts = [], categories = [], orderProtection = null }) {
    const [activeTab, setActiveTab] = useState("hero");

    // Modal States
    const [showHeroModal, setShowHeroModal] = useState(false);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);

    // Live Upload Preview State
    const [imagePreview, setImagePreview] = useState(null);

    // Form Hooks
    const { delete: destroy } = useForm();

    const heroForm = useForm({
        image: null,
    });

    const sectionForm = useForm({
        category_name: "",
        category_id: "",
    });

    const contactForm = useForm({
        phone: "",
        whatsapp: "",
    });

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    // Handle Hero Deletion
    const handleDeleteHero = (e, id) => {
        e.preventDefault();
        if (confirm("Are you sure you want to delete this hero image?")) {
            destroy(`/admin/hero/${id}`, {
                onSuccess: () => {
                    toast.success("Hero image deleted successfully!");
                },
                onError: () => {
                    toast.error("Failed to delete hero image!");
                },
            });
        }
    };

    // Handle Section Deletion
    const handleDeleteSection = (e, id) => {
        e.preventDefault();
        if (confirm("Are you sure you want to delete this landing section?")) {
            destroy(`/admin/sectionDelete/${id}`, {
                onSuccess: () => {
                    toast.success("Section deleted successfully!");
                },
                onError: () => {
                    toast.error("Failed to delete section!");
                },
            });
        }
    };

    // Handle Contact Deletion
    const handleDeleteContact = (e, id) => {
        e.preventDefault();
        if (confirm("Are you sure you want to delete this contact?")) {
            destroy(`/admin/contactDelete/${id}`, {
                onSuccess: () => {
                    toast.success("Contact deleted successfully!");
                },
                onError: () => {
                    toast.error("Failed to delete contact!");
                },
            });
        }
    };

    // Submit Hero Form
    const handleHeroSubmit = (e) => {
        e.preventDefault();
        if (!heroForm.data.image) {
            toast.error("Please select a hero image first!");
            return;
        }

        heroForm.post("/admin/hero/store", {
            forceFormData: true,
            onSuccess: () => {
                heroForm.reset();
                setImagePreview(null);
                setShowHeroModal(false);
                toast.success("Hero banner uploaded successfully!");
            },
            onError: (err) => {
                toast.error(err.image || "Failed to upload hero image.");
            }
        });
    };

    // Submit Section Form
    const handleSectionSubmit = (e) => {
        e.preventDefault();
        if (!sectionForm.data.category_id) {
            toast.error("Please select a category!");
            return;
        }

        sectionForm.post("/admin/section/store", {
            onSuccess: () => {
                sectionForm.reset();
                setShowSectionModal(false);
                toast.success("Landing section configured successfully!");
            },
            onError: (err) => {
                toast.error(err.category_id || err.category_name || "Failed to add section.");
            }
        });
    };

    // Submit Contact Form
    const handleContactSubmit = (e) => {
        e.preventDefault();
        if (!contactForm.data.phone) {
            toast.error("Phone number is required!");
            return;
        }

        contactForm.post("/admin/contactStore", {
            onSuccess: () => {
                contactForm.reset();
                setShowContactModal(false);
                toast.success("Contact channel added successfully!");
            },
            onError: (err) => {
                toast.error(err.phone || err.whatsapp || "Failed to add contact.");
            }
        });
    };

    // File Selector Change Handler
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Client-side image limit under 500KB validation warning
            if (file.size > 500 * 1024) {
                toast.error("File is too large! Maximum limit is 500 KB.");
                return;
            }
            heroForm.setData("image", file);
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
            setImagePreview(URL.createObjectURL(file));
        }
    };

    return (
        <>
            <Head title="Admin Settings" />

            <div className="max-w-6xl mx-auto space-y-6 font-poppins">
                {/* Header card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-white tracking-tight">
                            Portal Customization Workspace
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Configure storefront image banners, categories section flow, contacts, and notification content.
                        </p>
                    </div>
                </div>

                {/* SaaS Tab switcher */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-6 scrollbar-none">
                    <button
                        onClick={() => setActiveTab("hero")}
                        className={`pb-3 text-sm font-medium tracking-tight transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                            activeTab === "hero"
                                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                        <FiImage size={16} /> Hero Banners
                    </button>
                    <button
                        onClick={() => setActiveTab("sections")}
                        className={`pb-3 text-sm font-medium tracking-tight transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                            activeTab === "sections"
                                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                        <FiLayers size={16} /> Landing Sections
                    </button>
                    <button
                        onClick={() => setActiveTab("contacts")}
                        className={`pb-3 text-sm font-medium tracking-tight transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                            activeTab === "contacts"
                                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                        <FiPhone size={16} /> Contact Channels
                    </button>
                    <button
                        onClick={() => setActiveTab("marquee")}
                        className={`pb-3 text-sm font-medium tracking-tight transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                            activeTab === "marquee"
                                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                        <FiVolume2 size={16} /> Announcements
                    </button>
                    <button
                        onClick={() => setActiveTab("protection")}
                        className={`pb-3 text-sm font-medium tracking-tight transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                            activeTab === "protection"
                                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                        <FiShield size={16} /> Order Protection
                    </button>
                </div>

                {/* TAB 5: ORDER PROTECTION */}
                {activeTab === "protection" && orderProtection && <OrderProtection data={orderProtection} />}

                {/* TAB 1: HERO BANNERS */}
                {activeTab === "hero" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white tracking-tight">
                                Storefront Hero Carousel ({heroes.length})
                            </h2>
                            <button
                                onClick={() => setShowHeroModal(true)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all active:scale-95"
                            >
                                <FiPlus size={16} /> Add Carousel Banner
                            </button>
                        </div>

                        {heroes.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-10 text-center shadow-sm">
                                <BiImage className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
                                <h3 className="font-semibold text-slate-700 dark:text-slate-300">No Hero Banners Found</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                                    Upload standard banners under 500KB to display in the main landing carousel page slider.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {heroes.map((hero) => (
                                    <div
                                        key={hero.id}
                                        className="group relative bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                                    >
                                        <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                                            <img
                                                src={`/storage/${hero.image}`}
                                                alt="Hero banner"
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <form onSubmit={(e) => handleDeleteHero(e, hero.id)}>
                                                <button
                                                    type="submit"
                                                    title="Delete Banner"
                                                    className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all active:scale-95"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </form>
                                        </div>
                                        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                            <span className="text-[11px] font-medium text-slate-400">
                                                ID: {hero.id}
                                            </span>
                                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full capitalize">
                                                Active Banner
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: LANDING SECTIONS ORDER */}
                {activeTab === "sections" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                                Landing Page Category Sections Order ({sections.length})
                            </h2>
                            <button
                                onClick={() => setShowSectionModal(true)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all active:scale-95"
                            >
                                <FiPlus size={16} /> Add Landing Section
                            </button>
                        </div>

                        {sections.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-10 text-center shadow-sm">
                                <TbCategory className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
                                <h3 className="font-semibold text-slate-700 dark:text-slate-300">No Category Sections Configured</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                                    Configure which categories show up as section blocks on the main store page layout.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                        <thead className="bg-slate-50 dark:bg-slate-950">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                    Category Name
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                    Category Database ID
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                                            {sections.map((section) => (
                                                <tr key={section.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                        {section.category_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">
                                                            {section.category_id}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                        <form onSubmit={(e) => handleDeleteSection(e, section.id)} className="inline">
                                                            <button
                                                                type="submit"
                                                                title="Delete Section Block"
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 rounded-lg transition-all"
                                                            >
                                                                <FiTrash2 size={16} />
                                                            </button>
                                                        </form>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: CONTACT CHANNELS */}
                {activeTab === "contacts" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                                Store Support Contact Numbers ({contacts.length})
                            </h2>
                            <button
                                onClick={() => setShowContactModal(true)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all active:scale-95"
                            >
                                <FiPlus size={16} /> Add Contact Number
                            </button>
                        </div>

                        {contacts.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-10 text-center shadow-sm">
                                <FiPhone className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
                                <h3 className="font-semibold text-slate-700 dark:text-slate-300">No Contact Channels Configured</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                                    Configure support channels (Phone Calls & WhatsApp links) displayed on public receipts/customer details.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {contacts.map((contact) => (
                                    <div
                                        key={contact.id}
                                        className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
                                    >
                                        <div className="space-y-3">
                                            {/* Phone Field */}
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                                                    <FiPhone size={16} />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Voice Call</span>
                                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{contact.phone || "N/A"}</span>
                                                </div>
                                            </div>

                                            {/* WhatsApp Field */}
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                                    <FaWhatsapp size={16} />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">WhatsApp Chat</span>
                                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{contact.whatsapp || "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <form onSubmit={(e) => handleDeleteContact(e, contact.id)}>
                                            <button
                                                type="submit"
                                                title="Delete Contact"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 rounded-xl transition-all active:scale-95"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: ANNOUNCEMENTS */}
                {activeTab === "marquee" && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white tracking-tight mb-4">
                                Landing Page Announcement Banner
                            </h2>

                            {/* Interactive Announcement Live Preview Bar */}
                            <div className="relative w-full overflow-hidden bg-amber-50 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-900/30 rounded-xl p-3.5 text-amber-800 dark:text-amber-300 mb-6 flex items-center gap-3">
                                <span className="flex-shrink-0 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider select-none">Live Announcement Bar Preview</span>
                                <marquee className="text-xs sm:text-sm font-semibold">{marquee?.content || "Currently no marquee announcements set."}</marquee>
                            </div>

                            <MarqueeForm marquee={marquee} />
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL 1: ADD HERO CAROUSEL BANNER */}
            {showHeroModal && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Add Hero Carousel Banner</h3>
                            <button
                                onClick={() => {
                                    heroForm.reset();
                                    setImagePreview(null);
                                    setShowHeroModal(false);
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <BiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleHeroSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Banner Image <span className="text-yellow-500 font-normal">(under 500 KB limit)</span>
                                </label>

                                {/* Premium Drag and Drop zone */}
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors relative bg-slate-50/50 dark:bg-slate-950/20">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {imagePreview ? (
                                        <div className="space-y-3">
                                            <img
                                                src={imagePreview}
                                                alt="Banner preview"
                                                className="max-h-36 mx-auto rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 object-cover"
                                            />
                                            <p className="text-[10px] text-emerald-600 font-semibold">Ready to upload</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <BiUpload size={32} className="mx-auto text-slate-400 dark:text-slate-600" />
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click to browse banner photo</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Supports JPG, PNG, WEBP (Recommended aspect ratio 16:9)</p>
                                        </div>
                                    )}
                                </div>

                                {heroForm.errors.image && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <FiAlertCircle size={12} /> {heroForm.errors.image}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={heroForm.processing}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {heroForm.processing ? "Uploading Banner..." : "Upload Banner"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: ADD LANDING SECTION */}
            {showSectionModal && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Add Home Section Category</h3>
                            <button
                                onClick={() => {
                                    sectionForm.reset();
                                    setShowSectionModal(false);
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <BiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSectionSubmit} className="p-6 space-y-5">
                            {/* Category Selector Dropdown */}
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Select Product Category
                                </label>
                                <select
                                    value={sectionForm.data.category_id}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        const selectedCat = categories.find(c => c.id.toString() === selectedId);
                                        if (selectedCat) {
                                            sectionForm.setData((data) => ({
                                                ...data,
                                                category_id: selectedId,
                                                category_name: selectedCat.name,
                                            }));
                                        } else {
                                            sectionForm.setData((data) => ({
                                                ...data,
                                                category_id: "",
                                                category_name: "",
                                            }));
                                        }
                                    }}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600 p-3 text-sm"
                                >
                                    <option value="">-- Choose Category --</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name} (ID: {cat.id})
                                        </option>
                                    ))}
                                </select>

                                {sectionForm.errors.category_id && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <FiAlertCircle size={12} /> {sectionForm.errors.category_id}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={sectionForm.processing}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {sectionForm.processing ? "Configuring Section..." : "Save Landing Section"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: ADD SUPPORT CONTACT CHANNEL */}
            {showContactModal && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Add Support Channel</h3>
                            <button
                                onClick={() => {
                                    contactForm.reset();
                                    setShowContactModal(false);
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <BiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleContactSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Support Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={contactForm.data.phone}
                                    onChange={(e) => contactForm.setData("phone", e.target.value)}
                                    placeholder="e.g. +880 1700 000000"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600 p-3 text-sm"
                                />
                                {contactForm.errors.phone && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <FiAlertCircle size={12} /> {contactForm.errors.phone}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    WhatsApp Number (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={contactForm.data.whatsapp}
                                    onChange={(e) => contactForm.setData("whatsapp", e.target.value)}
                                    placeholder="e.g. +880 1700 000000"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600 p-3 text-sm"
                                />
                                {contactForm.errors.whatsapp && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <FiAlertCircle size={12} /> {contactForm.errors.whatsapp}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={contactForm.processing}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {contactForm.processing ? "Saving Contact..." : "Save Contact Channel"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Setting.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Setting;
