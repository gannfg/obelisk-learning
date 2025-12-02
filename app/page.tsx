import Link from "next/link";
import Image from "next/image";
import { Target, BookOpen } from "lucide-react";

/**
 * Simple Landing Page
 * 2 clickable boxes: Missions & Courses
 * DeMentor character (half body, floating) below
 */
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight"
            style={{ color: 'var(--foreground)' }}
          >
            Your Vision, Our Expertise
            <br className="hidden sm:block" />
            <span className="block sm:inline mt-2 sm:mt-0">— Let's Build Together</span>
          </h1>
          <p 
            className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-0 sm:mb-2 leading-relaxed opacity-70"
            style={{ color: 'var(--foreground)' }}
          >
            We're here to help you master the skills you need for your next big project. Whether it's software development, web design, or building something entirely new—we'll craft a platform that elevates your vision to something truly remarkable.
          </p>
        </div>
      </section>

      {/* Main Content - 2 Boxes */}
      <section className="flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            {/* Missions Box */}
            <Link
              href="/missions"
              className="group relative block max-w-sm sm:max-w-md w-full mx-auto rounded-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105"
            >
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src="/mission_button.png"
                  alt="Missions"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </Link>

            {/* Academy Box */}
            <Link
              href="/academy"
              className="group relative block max-w-sm sm:max-w-md w-full mx-auto rounded-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105"
            >
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src="/academy_button.png"
                  alt="Academy"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* DeMentor Character Section */}
      <section className="container mx-auto px-0 sm:px-0 pb-0 sm:pb-4">
        <div className="max-w-6xl mx-auto flex justify-center items-end">
          <Link
            href="/instructors"
            className="relative w-full cursor-pointer group"
          >
            {/* Show upper body of the character (head + shoulders + chest), large across the screen */}
            <div className="relative w-full h-[35vh] sm:h-[40vh] md:h-[45vh] overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src="/dementor.png"
                  alt="DeMentor - Your AI Mentor"
                  fill
                  className="object-cover object-top animate-dementor-float transition-transform duration-300 group-hover:scale-110 scale-[1.2] translate-y-1 sm:translate-y-2 md:translate-y-3"
                  priority
                />
              </div>
              {/* Bottom fade-out */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
