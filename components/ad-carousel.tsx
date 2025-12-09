"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdSlide {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  icon?: React.ReactNode;
  imageUrl?: string | null;
  bgColor?: string;
}

interface AdCarouselProps {
  slides: AdSlide[];
  autoPlayInterval?: number; // in milliseconds, 0 to disable
}

export function AdCarousel({ slides, autoPlayInterval = 5000 }: AdCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlayInterval > 0 && !isPaused && slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [autoPlayInterval, isPaused, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true); // Pause auto-play when user manually navigates
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsPaused(false), 10000);
  };

  const goToPrevious = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    goToSlide((currentIndex - 1 + slides.length) % slides.length);
  };

  const goToNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    goToSlide((currentIndex + 1) % slides.length);
  };

  if (slides.length === 0) {
    return null;
  }

  const currentSlide = slides[currentIndex];

  return (
    <div
      className="group relative rounded-2xl border-2 border-border bg-muted/50 hover:bg-muted/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl min-h-[200px] sm:min-h-[250px] md:min-h-[280px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image */}
      {currentSlide.imageUrl && (
        <div className="absolute inset-0 z-0">
          <Image
            src={currentSlide.imageUrl}
            alt={currentSlide.title || "Advertisement"}
            fill
            className="object-cover"
            priority={currentIndex === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Remove dark overlay for better image visibility */}
        </div>
      )}

      {/* Slide Content */}
      <Link 
        href={currentSlide.href} 
        className="block h-full"
        target="_blank"
        rel="noopener noreferrer"
      >
        {/* If image exists, show full image. Otherwise show icon/text layout */}
        {currentSlide.imageUrl ? (
          <div className="h-full min-h-[200px] sm:min-h-[250px] md:min-h-[280px] relative">
            {/* Image is already rendered as background above */}
          </div>
        ) : (
          <div className="p-8 sm:p-12 md:p-16 h-full flex flex-col items-center justify-center text-center relative min-h-[200px] sm:min-h-[250px] md:min-h-[280px]">
            <div className="relative z-10">
              {currentSlide.icon && (
                <div className="mb-4 flex justify-center">
                  {currentSlide.icon}
                </div>
              )}
              {currentSlide.title && (
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
                  {currentSlide.title}
                </h2>
              )}
              {currentSlide.description && (
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  {currentSlide.description}
                </p>
              )}
              {currentSlide.ctaText && (
                <div className="inline-flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                  <span className="text-sm sm:text-base">{currentSlide.ctaText}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Link>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToSlide(index);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

