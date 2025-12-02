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
      {/* Main Content - 2 Boxes */}
      <section className="flex-1 container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Missions Box */}
            <Link
              href="/missions"
              className="group relative flex items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-border bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:scale-105 hover:border-primary/50 cursor-pointer"
            >
              <div className="relative w-full aspect-[4/3] rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                <Image
                  src="/mission_symbol.png"
                  alt="Missions"
                  fill
                  className="object-contain p-6 sm:p-8"
                  priority
                />
              </div>
            </Link>

            {/* Academy Box (updated from Courses) */}
            <Link
              href="/academy"
              className="group relative flex items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-border bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:scale-105 hover:border-accent/50 cursor-pointer"
            >
              <div className="relative w-full aspect-[4/3] rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors flex items-center justify-center">
                <Image
                  src="/course_symbol.png"
                  alt="Academy"
                  fill
                  className="object-contain p-6 sm:p-8"
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
