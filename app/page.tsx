import Link from "next/link";
import { Target, BookOpen, Users, Sparkles, ArrowRight, User, Zap, Wallet } from "lucide-react";
import { AdCarousel } from "@/components/ad-carousel";

/**
 * Homepage with grid layout similar to Superteam Earn
 * Layout: 2x2 grid with Academy (large left), Mission (bottom right), How it works (top right)
 */
export default function Home() {
  // Advertisement slides - easily add more here
  const adSlides = [
    {
      id: "mentors",
      title: "Mentors",
      description: "Meet your guides",
      ctaText: "Explore Mentors",
      href: "/instructors",
      icon: <Users className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-primary" />,
    },
    {
      id: "dementor",
      title: "DeMentor AI",
      description: "Your AI-powered coding mentor",
      ctaText: "Chat Now",
      href: "/mentor-chat",
      icon: <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-primary" />,
    },
    // Add more slides here as needed
    // {
    //   id: "workshops",
    //   title: "Workshops",
    //   description: "Join live learning sessions",
    //   ctaText: "Browse Workshops",
    //   href: "/workshops",
    //   icon: <Calendar className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-primary" />,
    // },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Grid Layout Section */}
      <section className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Left Column Container */}
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
              {/* Top Left - Advertisement Carousel */}
              <AdCarousel slides={adSlides} autoPlayInterval={5000} />

              {/* Bottom Left - Academy (Large) */}
              <Link
                href="/academy"
                className="group relative block p-8 sm:p-12 md:p-16 lg:p-20 rounded-2xl border-2 border-border bg-muted/50 hover:bg-muted/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex-1 min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px] flex items-center justify-center"
              >
                <div className="text-center">
                  <BookOpen className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 mx-auto mb-6 text-primary group-hover:scale-110 transition-transform" />
                  <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4">Academy</h2>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
                    Structured courses, lessons, and projects
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-primary group-hover:gap-3 transition-all">
                    <span className="text-sm sm:text-base">Explore Academy</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Right Column Container */}
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
              {/* Top Right - How It Works */}
              <div className="relative p-6 sm:p-8 md:p-10 rounded-2xl border-2 border-border bg-muted/50 min-h-[200px] sm:min-h-[250px] md:min-h-[280px]">
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                    HOW IT WORKS
                  </h2>
                </div>

                {/* Vertical Steps List with Connecting Line */}
                <div className="relative">
                  {/* Connecting Line */}
                  <div className="absolute left-4 sm:left-5 top-0 bottom-0 w-0.5 bg-border hidden sm:block" />

                  <div className="space-y-4 sm:space-y-6">
                    {/* Step 1 */}
                    <div className="relative flex items-start gap-3 sm:gap-4">
                      {/* Icon Circle */}
                      <div className="relative z-10 flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-0.5 sm:pt-1">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1">
                          Start Learning
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Enroll in courses or pick a mission to begin your journey
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative flex items-start gap-3 sm:gap-4">
                      {/* Icon Circle */}
                      <div className="relative z-10 flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                        <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-0.5 sm:pt-1">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1">
                          Build Projects
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Complete hands-on missions and collaborate with teams
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative flex items-start gap-3 sm:gap-4">
                      {/* Icon Circle */}
                      <div className="relative z-10 flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                        <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-0.5 sm:pt-1">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1">
                          Earn Rewards
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Unlock badges, gain XP, and track your progress
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Right - Mission */}
              <Link
                href="/missions"
                className="group relative block p-8 sm:p-12 md:p-16 rounded-2xl border-2 border-border bg-muted/50 hover:bg-muted/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex-1 min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px] flex items-center justify-center"
              >
                <div className="text-center">
                  <Target className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 mx-auto mb-6 text-primary group-hover:scale-110 transition-transform" />
                  <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4">Mission</h2>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
                    Hands-on coding challenges
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-primary group-hover:gap-3 transition-all">
                    <span className="text-sm sm:text-base">Start Mission</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Workshops Section - Placeholder for when friend finishes */}
      {/* Uncomment when workshops are ready */}
      {/* 
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Upcoming Workshops
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Join live sessions and learn from experts
            </p>
          </div>
          <div className="text-center">
            <Button asChild size="lg">
              <Link href="/workshops">Browse Workshops</Link>
            </Button>
          </div>
        </div>
      </section>
      */}
    </div>
  );
}
