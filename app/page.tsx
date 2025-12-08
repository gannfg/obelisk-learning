import Link from "next/link";
import Image from "next/image";
import { LandingSidebar } from "@/components/landing-sidebar";

/**
 * Landing Page with Left Panel (current content) and Right Panel (sidebar)
 */
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Layout: Left Panel + Right Sidebar */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12">
          {/* Left Panel - Current Landing Page Content */}
          <div className="flex flex-col space-y-8">
            {/* Hero Section */}
            <section className="text-center lg:text-left">
              <div className="max-w-4xl">
                <h1 
                  className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight"
                  style={{ color: 'var(--foreground)' }}
                >
                  Your Vision, Our Expertise
                  <br className="hidden sm:block" />
                  <span className="block sm:inline mt-2 sm:mt-0">— Let's Build Together</span>
                </h1>
                <p 
                  className="text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed opacity-70"
                  style={{ color: 'var(--foreground)' }}
                >
                  We're here to help you master the skills you need for your next big project. Whether it's software development, web design, or building something entirely new—we'll craft a platform that elevates your vision to something truly remarkable.
                </p>
              </div>
            </section>

            {/* Main Content - 2 Boxes */}
            <section className="flex-1">
              <div className="max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {/* Missions Box */}
                  <Link
                    href="/missions"
                    className="group relative block w-full rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-2xl"
                  >
                    <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-background to-muted">
                      <Image
                        src="/mission.png"
                        alt="Missions"
                        fill
                        className="object-contain p-8 transition-transform duration-300 group-hover:scale-105"
                        priority
                      />
                    </div>
                  </Link>

                  {/* Academy Box */}
                  <Link
                    href="/academy"
                    className="group relative block w-full rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-2xl"
                  >
                    <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-background to-muted">
                      <Image
                        src="/academy.png"
                        alt="Academy"
                        fill
                        className="object-contain p-8 transition-transform duration-300 group-hover:scale-105"
                        priority
                      />
                    </div>
                  </Link>
                </div>
              </div>
            </section>

            {/* DeMentor Character Section */}
            <section className="pb-0 sm:pb-4">
              <div className="max-w-6xl flex justify-center items-end">
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
                    
                    {/* Floating Bubble Text */}
                    <div className="absolute top-[35%] sm:top-[30%] md:top-[25%] left-1/2 -translate-x-1/2 sm:left-[65%] sm:-translate-x-0 animate-bubble-float z-10 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2">
                      <div className="relative">
                        {/* Blurry transparent container */}
                        <div className="backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/20 rounded-2xl px-6 py-3 shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:bg-white/30 dark:group-hover:bg-black/30">
                          <p className="text-sm sm:text-base md:text-lg font-semibold whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
                            Meet the DeMentor
                          </p>
                        </div>
                        {/* Speech bubble tail */}
                        <div className="absolute -bottom-2 left-8 w-4 h-4 backdrop-blur-md bg-white/20 dark:bg-black/20 border-l border-b border-white/30 dark:border-white/20 rotate-45 transform origin-center transition-all duration-300 group-hover:bg-white/30 dark:group-hover:bg-black/30"></div>
                      </div>
                    </div>
                    
                    {/* Bottom fade-out */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
                  </div>
                </Link>
              </div>
            </section>
          </div>

          {/* Right Panel - Sidebar */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <LandingSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
