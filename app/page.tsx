"use client";

import Link from "next/link";
import { Target, BookOpen, Users, Sparkles, ArrowRight, User, Zap, Wallet, Trophy } from "lucide-react";
import { AdCarousel } from "@/components/ad-carousel";
import { useEffect, useState } from "react";
import { getAllCourses, CourseWithModules } from "@/lib/courses";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { getUserBadges } from "@/lib/badges";
import { getAllAds } from "@/lib/ads";
import { useAuth } from "@/lib/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { HorizontalCourseCard } from "@/components/horizontal-course-card";
import { Card } from "@/components/ui/card";

/**
 * Homepage with courses layout
 * Layout: Left column with courses, Right sidebar with How it works and Achievements
 */
export default function Home() {
  const [courses, setCourses] = useState<CourseWithModules[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [badgesCount, setBadgesCount] = useState(0);
  const [xpCount, setXpCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [ads, setAds] = useState<any[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  
  const { user } = useAuth();
  const learningSupabase = createLearningClient();

  // Load courses
  useEffect(() => {
    if (!learningSupabase) {
      setCourses([]);
      setLoadingCourses(false);
      return;
    }
    setLoadingCourses(true);
    getAllCourses(learningSupabase)
      .then(setCourses)
      .catch((error) => {
        console.error("Error loading courses:", error);
        setCourses([]);
      })
      .finally(() => setLoadingCourses(false));
  }, [learningSupabase]);

  // Load advertisements
  useEffect(() => {
    if (!learningSupabase) {
      setAds([]);
      setLoadingAds(false);
      return;
    }
    setLoadingAds(true);
    getAllAds(learningSupabase)
      .then((fetchedAds) => {
        // Transform database ads to carousel format
        // getAllAds already filters for ads with image and href
        const transformedAds = fetchedAds.map((ad) => ({
          id: ad.id,
          title: "", // Not used, just for compatibility
          description: "", // Not used, just for compatibility
          ctaText: "", // Not used, just for compatibility
          href: ad.href,
          imageUrl: ad.image_url,
        }));
        setAds(transformedAds);
        console.log("Loaded ads from database:", transformedAds.length);
      })
      .catch((error) => {
        console.error("Error loading ads:", error);
        setAds([]);
      })
      .finally(() => setLoadingAds(false));
  }, [learningSupabase]);

  // Load user stats (badges and XP)
  useEffect(() => {
    if (!user || !learningSupabase) {
      setLoadingStats(false);
      return;
    }
    
    const loadStats = async () => {
      try {
        // Get badges count
        const badges = await getUserBadges(learningSupabase, user.id);
        setBadgesCount(badges.length);
        
        // Get XP from user profile
        const { data: userData } = await learningSupabase
          .from("users")
          .select("xp")
          .eq("id", user.id)
          .single();
        
        setXpCount((userData?.xp as number) || 0);
      } catch (error) {
        console.error("Error loading user stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };
    
    loadStats();
  }, [user, learningSupabase]);

  // Fallback ads if database is empty
  const fallbackAds = [
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
  ];

  // Use database ads if available, otherwise use fallback
  const adSlides = ads.length > 0 ? ads : fallbackAds;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content Section */}
      <section className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
            {/* Left Column - Courses List */}
            <div className="space-y-6">
              {/* Top - Advertisement Carousel */}
              {loadingAds ? (
                <div className="flex items-center justify-center py-12 rounded-2xl border-2 border-border bg-muted/50 min-h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : adSlides.length > 0 ? (
                <AdCarousel slides={adSlides} autoPlayInterval={5000} />
              ) : null}

              {/* Courses List */}
              {loadingCourses ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <HorizontalCourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <div className="py-8 sm:py-12 text-center">
                  <p className="text-base sm:text-lg text-muted-foreground">
                    No courses available yet. Check back soon!
                  </p>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* HOW IT WORKS Section */}
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
                    HOW IT WORKS
                  </h2>
                </div>

                {/* Vertical Steps List with Connecting Line */}
                <div className="relative">
                  {/* Connecting Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border hidden sm:block" />

                  <div className="space-y-4 sm:space-y-6">
                    {/* Step 1 */}
                    <div className="relative flex items-start gap-3 sm:gap-4">
                      {/* Icon Circle */}
                      <div className="relative z-10 flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-0.5 sm:pt-1">
                        <h3 className="text-base sm:text-lg font-bold mb-1">
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
                        <h3 className="text-base sm:text-lg font-bold mb-1">
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
                        <h3 className="text-base sm:text-lg font-bold mb-1">
                          Earn Rewards
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Unlock badges, gain XP, and track your progress
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Achievements Section */}
              <Card className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Achievements</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Track your progress and unlock badges
                </p>
                
                {/* Stats Boxes */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <div className="text-2xl font-bold mb-1">
                      {loadingStats ? "..." : badgesCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Badges</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <div className="text-2xl font-bold mb-1">
                      {loadingStats ? "..." : xpCount}
                    </div>
                    <div className="text-xs text-muted-foreground">XP</div>
                  </div>
                </div>

                <Link
                  href="/achievements"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <span>View All</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Card>

              {/* Mission Link */}
              <Link
                href="/missions"
                className="group relative block p-6 sm:p-8 rounded-2xl border-2 border-border bg-muted/50 hover:bg-muted/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex items-center justify-center"
              >
                <div className="text-center">
                  <Target className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Mission</h2>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-3">
                    Hands-on coding challenges
                  </p>
                  <div className="flex items-center justify-center gap-2 text-primary group-hover:gap-3 transition-all">
                    <span className="text-xs sm:text-sm">Start Mission</span>
                    <ArrowRight className="h-4 w-4" />
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
