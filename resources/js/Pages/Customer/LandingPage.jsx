import React, { useEffect } from "react";
import CustomerLayout from "@/Layouts/CustomerLayouts/CustomerLayout";
import { Head } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";
import CategoriesSection from "../../components/CustomerComponents/CategoriesSection";
import HeroBanner from "../../components/CustomerComponents/HeroBanner";
import Section from "@/components/CustomerComponents/Section";
import ReactPixel from "react-facebook-pixel";
import Marqueee from "@/components/CustomerComponents/Marqueee";

const LandingPage = ({
    products = [],
    categories = [],
    heroes = [],
    sections = [],
}) => {
    useEffect(() => {
        if (!products || products.length === 0) return;
        const contentIds = products.map((p) => p.id);
        ReactPixel.track("ViewContent", {
            content_ids: contentIds,
            content_name: "Landing Page",
            content_type: "product",
        });
    }, [products]);

    // 1. Filter products that belong to the "Offer" category
    // Note: This requires the controller to use ->with('category')
    const offerProducts = products.filter(
        (product) => product.category?.name === "Offer",
    );

    // 2. Find the Offer Category ID for the "View All" link
    const offerCategory = categories.find((cat) => cat.name === "Offer");

    return (
        <>
            <Head title="Demand Bazar" />
            <div className="bg-slate-100">
                <div className="w-full mx-auto">
                    <Toaster />

                    {/* Hero & Marquee */}
                    <HeroBanner heroes={heroes} />
                    <Marqueee />

                    {/* Categories Circle Section */}
                    <CategoriesSection categoriesComing={categories} />

                    {/* EXCLUSIVE OFFER SECTION: Placed specifically at the top */}
                    {offerProducts.length > 0 && (
                        <Section
                            sectionname="আজকের অফার"
                            overrideProducts={offerProducts}
                            catid={offerCategory?.id}
                        />
                    )}

                    {/* DYNAMIC SECTIONS: Loaded from LandingSection table */}
                    {sections.map((section) => (
                        <Section
                            key={section.id}
                            products={products}
                            sectionname={section.category_name}
                            catid={Number(section.category_id)}
                        />
                    ))}

                    {/* Any other static sections like NewArrivals would go here */}
                </div>
            </div>
        </>
    );
};

LandingPage.layout = (page) => <CustomerLayout>{page}</CustomerLayout>;

export default LandingPage;
