import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HeroCarousel({ heroes }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // Your banner images

    // Auto-slide every 5 seconds
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            nextSlide();
        }, 5000);

        return () => clearInterval(interval);
    }, [isPaused, currentSlide]); // Added currentSlide dependency to ensure clean state updates

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + heroes.length) % heroes.length);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % heroes.length);
    };

    // --- Touch / Swipe Logic for Mobile ---
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setIsPaused(true); // Pause auto-scroll while touching
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        setIsPaused(false);
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextSlide();
        } else if (isRightSwipe) {
            prevSlide();
        }
    };

    return (
        <div
            // 1. DYNAMIC PROPORTIONAL HEIGHT:
            // Scales dynamically with width using aspect-[2.5/1] aspect ratio.
            // When banners are uploaded in 2.5:1 ratio (e.g. 1920x768), they render with EXACTLY 0% cropping on all screens!
            className="Hero-Banner relative w-full aspect-[2.5/1] overflow-hidden group select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Images Container */}
            <div className="relative h-full w-full">
                {heroes.map((banner, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                    >
                        {/* 2. RESPONSIVE IMAGE FITTING:
                           - object-cover: Fills the box (best for backgrounds). 
                           - object-center: Keeps the center of the image in view.
                        */}
                        <img
                            src={`/storage/${banner.image}`}
                            alt={`Banner ${index + 1}`}
                            className="w-full h-full object-cover object-center"
                            draggable="false"
                            loading={index === 0 ? "eager" : "lazy"}
                            fetchPriority={index === 0 ? "high" : "auto"}
                            decoding="async"
                        />

                        {/* Gradient Overlay (Adjusted for mobile visibility) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                    </div>
                ))}
            </div>

            {/* Previous Button - Hidden on very small screens, smaller padding on mobile */}
            <button
                onClick={prevSlide}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 hidden sm:flex bg-white/80 backdrop-blur-sm text-gray-800 p-2 sm:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Next Button */}
            <button
                onClick={nextSlide}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 hidden sm:flex bg-white/80 backdrop-blur-sm text-gray-800 p-2 sm:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
                aria-label="Next slide"
            >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Dots Navigation - Smaller on mobile */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {heroes.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`transition-all duration-300 rounded-full ${index === currentSlide ? "w-6 h-2 sm:w-8 sm:h-3 bg-[#059669]" : "w-2 h-2 sm:w-3 sm:h-3 bg-white/60 hover:bg-white"}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Slide Counter - Scaled for mobile */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-poppins font-medium">
                {currentSlide + 1} / {heroes.length}
            </div>
        </div>
    );
}
