import CustomerLayout from "@/Layouts/CustomerLayouts/CustomerLayout";
import { Link, Head } from "@inertiajs/react";

function Categories({ categories = [] }) {
    const sortedCategories = [...categories].sort((a, b) =>
        a.name.localeCompare(b.name),
    );

    // Detect Bangla characters
    const isBangla = (text) => /[\u0980-\u09FF]/.test(text);

    return (
        <div className="min-h-screen bg-[#f0f4ef] py-10">
            <Head title="Categories" />

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="font-poppins text-3xl md:text-4xl font-extrabold text-gray-900">
                        Explore Categories
                    </h1>
                    <p className="mt-2 font-inter text-gray-500 text-sm md:text-base">
                        Browse products by category
                    </p>
                    <div className="mt-4 h-[3px] w-16 bg-[#059669] mx-auto rounded-full" />
                </div>

                {/* Grid */}
                {sortedCategories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {sortedCategories.map((category) => (
                            <Link
                                key={category.id}
                                href={`category/${category.id}`}
                                className="group block"
                            >
                                {/* Card */}
                                <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-1">

                                    {/* ── Background Image or Gradient ── */}
                                    {category.photo ? (
                                        <img
                                            src={`/storage/${category.photo}`}
                                            alt={category.name}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#059669] to-[#065F46]" />
                                    )}

                                    {/* ── Dark scrim so text is always readable ── */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                                    {/* ── Product count badge (top-right) ── */}
                                    <div className="absolute top-2.5 right-2.5 z-10">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide
                                                         bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm">
                                            {category.products_count ?? 0}
                                            <span className="font-normal opacity-80">items</span>
                                        </span>
                                    </div>

                                    {/* ── Glassmorphic bottom panel ── */}
                                    <div className="absolute bottom-0 left-0 right-0 z-10
                                                    px-3 py-3
                                                    bg-white/15 backdrop-blur-md
                                                    border-t border-white/20
                                                    transition-all duration-300
                                                    group-hover:bg-white/25">
                                        <h3
                                            className={`text-white font-semibold text-sm leading-snug line-clamp-2 text-center drop-shadow-sm ${
                                                isBangla(category.name) ? "" : "font-poppins"
                                            }`}
                                            style={isBangla(category.name) ? { fontFamily: "'Hind Siliguri', sans-serif" } : {}}
                                        >
                                            {category.name}
                                        </h3>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#059669]/10 flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-[#059669]/50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                            </svg>
                        </div>
                        <p className="font-poppins text-base text-gray-500">
                            No categories found.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

Categories.layout = (page) => <CustomerLayout children={page} />;
export default Categories;
