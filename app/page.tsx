"use client";

import Link from "next/link";
import { Target, BookOpen, Users, Sparkles, ArrowRight, User, Zap, Wallet, Trophy, FolderKanban, UserPlus, CheckCircle2 } from "lucide-react";
import { AdCarousel } from "@/components/ad-carousel";
import { useEffect, useState } from "react";
import { getAllClasses } from "@/lib/classes";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";
import { getUserBadges } from "@/lib/badges";
import { getAllAds } from "@/lib/ads";
import { getAllProjects, ProjectWithMembers } from "@/lib/projects";
import { getAllTeams, TeamWithDetails } from "@/lib/teams";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAdmin } from "@/lib/hooks/use-admin";
import { Loader2 } from "lucide-react";
import { HorizontalClassCard } from "@/components/horizontal-class-card";
import { HorizontalProjectCard } from "@/components/horizontal-project-card";
import { HorizontalMissionCard } from "@/components/horizontal-mission-card";
import { HorizontalWorkshopCard } from "@/components/horizontal-workshop-card";
import { TeamsTicker } from "@/components/teams-ticker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Class, Mission } from "@/types";
import { Workshop } from "@/types/workshops";
import { getAllWorkshops } from "@/lib/workshops";
import Image from "next/image";

/**
 * Homepage with classes layout
 * Layout: Left column with classes, Right sidebar with How it works and Achievements
 */
export default function Home() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loadingWorkshops, setLoadingWorkshops] = useState(true);
  const [badgesCount, setBadgesCount] = useState(0);
  const [xpCount, setXpCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [ads, setAds] = useState<any[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [stepCompletion, setStepCompletion] = useState({
    profile: false,
    learning: false,
    projects: false,
    rewards: false,
  });
  const [loadingSteps, setLoadingSteps] = useState(true);
  
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const learningSupabase = createLearningClient();
  const supabase = createClient();

  // Load classes
  useEffect(() => {
    if (!learningSupabase) {
      setClasses([]);
      setLoadingClasses(false);
      return;
    }
    setLoadingClasses(true);
    // Non-admin users should only see published classes
    getAllClasses({ publishedOnly: !isAdmin }, learningSupabase)
      .then(setClasses)
      .catch((error) => {
        console.error("Error loading classes:", error);
        setClasses([]);
      })
      .finally(() => setLoadingClasses(false));
  }, [learningSupabase, isAdmin]);

  // Load projects
  useEffect(() => {
    if (!supabase) {
      setProjects([]);
      setLoadingProjects(false);
      return;
    }
    setLoadingProjects(true);
    getAllProjects(supabase)
      .then(setProjects)
      .catch((error) => {
        console.error("Error loading projects:", error);
        setProjects([]);
      })
      .finally(() => setLoadingProjects(false));
  }, [supabase]);

  // Load teams
  useEffect(() => {
    if (!supabase) {
      setTeams([]);
      setLoadingTeams(false);
      return;
    }
    setLoadingTeams(true);
    getAllTeams(supabase)
      .then(setTeams)
      .catch((error) => {
        console.error("Error loading teams:", error);
        setTeams([]);
      })
      .finally(() => setLoadingTeams(false));
  }, [supabase]);

  // Load missions with real-time updates
  useEffect(() => {
    if (!learningSupabase) {
      setMissions([]);
      setLoadingMissions(false);
      return;
    }

    const loadMissions = async () => {
      setLoadingMissions(true);
      try {
        const { data: missionsData, error } = await learningSupabase
          .from("missions")
          .select("*")
          .order("order_index", { ascending: true });

        if (error) {
          console.error("Error loading missions:", error);
          setMissions([]);
          return;
        }

        // Normalize Supabase (snake_case) payload into Mission type (camelCase)
        const normalizedMissions: Mission[] =
          (missionsData || []).map((m: any) => ({
            id: m.id,
            lessonId: m.lesson_id ?? undefined,
            title: m.title,
            goal: m.goal,
            description: m.description ?? undefined,
            imageUrl: m.image_url ?? undefined,
            initialFiles: m.initial_files ?? {},
            stackType: m.stack_type,
            difficulty: m.difficulty,
            estimatedTime: m.estimated_time ?? undefined,
            submissionDeadline: m.submission_deadline ? new Date(m.submission_deadline) : undefined,
            orderIndex: m.order_index,
            badgeId: m.badge_id ?? undefined,
          })) || [];

        setMissions(normalizedMissions);
      } catch (error) {
        console.error("Error loading missions:", error);
        setMissions([]);
      } finally {
        setLoadingMissions(false);
      }
    };

    loadMissions();

    // Set up real-time subscription for mission updates
    const channel = learningSupabase
      .channel("missions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "missions",
        },
        (payload) => {
          console.log("Mission update received:", payload);
          // Reload missions when there's a change
          loadMissions();
        }
      )
      .subscribe();

    return () => {
      learningSupabase.removeChannel(channel);
    };
  }, [learningSupabase]);

  // Load workshops
  useEffect(() => {
    if (!learningSupabase) {
      setWorkshops([]);
      setLoadingWorkshops(false);
      return;
    }
    setLoadingWorkshops(true);
    getAllWorkshops({ upcomingOnly: true, limit: 4 }, learningSupabase)
      .then(setWorkshops)
      .catch((error) => {
        console.error("Error loading workshops:", error);
        setWorkshops([]);
      })
      .finally(() => setLoadingWorkshops(false));
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

  // Check step completion status
  useEffect(() => {
    if (!user) {
      setStepCompletion({
        profile: false,
        learning: false,
        projects: false,
        rewards: false,
      });
      setLoadingSteps(false);
      return;
    }

    const checkSteps = async () => {
      setLoadingSteps(true);
      try {
        // Step 1: Check if profile is created (has username or name)
        const { getUserProfile } = await import("@/lib/profile");
        const profile = await getUserProfile(user.id, user.email || undefined, supabase);
        const hasProfile = !!(profile?.username || profile?.first_name || profile?.last_name);

        // Step 2: Check if user has enrolled in any class or course
        let hasLearning = false;
        if (learningSupabase) {
          const { count: classEnrollments } = await learningSupabase
            .from("class_enrollments")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "active");
          
          // Also check for course enrollments if that table exists
          let courseEnrollments = 0;
          try {
            const { count } = await learningSupabase
              .from("enrollments")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id);
            courseEnrollments = count || 0;
          } catch {
            // Table might not exist, ignore
          }
          
          hasLearning = (classEnrollments || 0) > 0 || courseEnrollments > 0;
        }

        // Step 3: Check if user has created or is a member of any project
        let hasProjects = false;
        if (supabase) {
          const { data: projectMembers } = await supabase
            .from("project_members")
            .select("project_id")
            .eq("user_id", user.id)
            .limit(1);
          
          const { data: createdProjects } = await supabase
            .from("projects")
            .select("id")
            .eq("created_by", user.id)
            .limit(1);
          
          hasProjects = !!(projectMembers && projectMembers.length > 0) || !!(createdProjects && createdProjects.length > 0);
        }

        // Step 4: Check if user has earned rewards (badges or XP)
        let hasRewards = false;
        if (learningSupabase) {
          const badges = await getUserBadges(learningSupabase, user.id);
          const { data: userData } = await learningSupabase
            .from("users")
            .select("xp")
            .eq("id", user.id)
            .maybeSingle();
          
          const xp = (userData?.xp as number) || 0;
          hasRewards = badges.length > 0 || xp > 0;
        }

        setStepCompletion({
          profile: hasProfile,
          learning: hasLearning,
          projects: hasProjects,
          rewards: hasRewards,
        });
      } catch (error) {
        console.error("Error checking step completion:", error);
      } finally {
        setLoadingSteps(false);
      }
    };

    checkSteps();
  }, [user, supabase, learningSupabase]);

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
      <section className="container mx-auto px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Courses List */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {/* Top - Advertisement Carousel */}
              {loadingAds ? (
                <div className="flex items-center justify-center py-12 rounded-2xl border-2 border-border bg-muted/50 min-h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : adSlides.length > 0 ? (
                <AdCarousel slides={adSlides} autoPlayInterval={5000} />
              ) : null}

              {/* Achievements Section - Mobile only, below advertisement */}
              <div className="lg:hidden">
                <div className="mb-2">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Achievements</h3>
                </div>
                
                {/* Stats Boxes - Smaller on mobile */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border text-center">
                    <div className="text-lg font-bold mb-0.5">
                      {loadingStats ? "..." : badgesCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Badges</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border text-center">
                    <div className="text-lg font-bold mb-0.5">
                      {loadingStats ? "..." : xpCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground">XP</div>
                  </div>
                </div>

                <Button variant="outline" className="w-full rounded-lg group text-xs py-1.5 h-auto" asChild>
                  <Link href="/achievements" className="flex items-center justify-center gap-2">
                    <span className="opacity-40 group-hover:opacity-80 group-hover:font-bold transition-all">View All</span>
                    <ArrowRight className="h-3 w-3 opacity-40 group-hover:opacity-80 transition-all" />
                  </Link>
                </Button>
              </div>

              {/* Classes */}
              <div className="mb-2">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Classes</h3>
              </div>
              
              {loadingClasses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : classes.length > 0 ? (
                <>
                  <div className="space-y-2 lg:space-y-3 mb-4">
                    {classes.slice(0, 4).map((classItem) => (
                      <HorizontalClassCard key={classItem.id} classItem={classItem} />
                    ))}
                  </div>
                  {classes.length > 4 && (
                    <Button variant="outline" className="w-full rounded-lg group" asChild>
                      <Link href="/academy?tab=classes" className="flex items-center justify-center gap-2">
                        <span className="opacity-40 group-hover:opacity-80 group-hover:font-bold transition-all">View All</span>
                        <ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-80 transition-all" />
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    No classes available yet. Check back soon!
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/academy">Browse Classes</Link>
                  </Button>
                </div>
              )}

              {/* Missions (moved from sidebar) */}
              <div className="mb-2">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Missions</h3>
              </div>
              
              {loadingMissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : missions.length > 0 ? (
                <>
                  <div className="space-y-2 lg:space-y-3 mb-4">
                    {missions.slice(0, 4).map((mission) => (
                      <HorizontalMissionCard key={mission.id} mission={mission} />
                    ))}
                  </div>
                  {missions.length > 4 && (
                    <Button variant="outline" className="w-full rounded-lg group" asChild>
                      <Link href="/missions" className="flex items-center justify-center gap-2">
                        <span className="opacity-40 group-hover:opacity-80 group-hover:font-bold transition-all">View All</span>
                        <ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-80 transition-all" />
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    No missions available yet
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/missions">Browse Missions</Link>
                  </Button>
                </div>
              )}

              {/* Workshops */}
              <div className="mb-2">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Workshops</h3>
              </div>
              
              {loadingWorkshops ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : workshops.length > 0 ? (
                <>
                  <div className="space-y-2 lg:space-y-3 mb-4">
                    {workshops.map((workshop) => (
                      <HorizontalWorkshopCard key={workshop.id} workshop={workshop} />
                    ))}
                  </div>
                  {workshops.length >= 4 && (
                    <Button variant="outline" className="w-full rounded-lg group" asChild>
                      <Link href="/workshops" className="flex items-center justify-center gap-2">
                        <span className="opacity-40 group-hover:opacity-80 group-hover:font-bold transition-all">View All</span>
                        <ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-80 transition-all" />
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    No upcoming workshops yet
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/workshops">Browse Workshops</Link>
                  </Button>
                </div>
              )}

            </div>

            {/* Right Sidebar */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-6">
              {/* Achievements Section - Desktop only (in sidebar) */}
              <div className="hidden lg:block">
                <div className="mb-2">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Achievements</h3>
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

                <Button variant="outline" className="w-full rounded-lg group" asChild>
                  <Link href="/achievements" className="flex items-center justify-center gap-2">
                    <span className="opacity-40 group-hover:opacity-80 group-hover:font-bold transition-all">View All</span>
                    <ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-80 transition-all" />
                  </Link>
                </Button>
              </div>

              {/* HOW IT WORKS Section */}
              <Card className="p-3 sm:p-4 md:p-5 hidden md:block">
                <div className="mb-3 sm:mb-4">
                  <h2 className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                    HOW IT WORKS
                  </h2>
                </div>

                {/* Vertical Steps List with Connecting Line */}
                <div className="relative">
                  {/* Connecting Line (centered on icon circles, stops at last circle) */}
                  <div className="absolute left-[16px] sm:left-[18px] top-[16px] sm:top-[18px] bottom-[16px] sm:bottom-[18px] w-px bg-border hidden sm:block z-0" />

                  <div className="space-y-3 sm:space-y-4">
                    {/* Step 1 - Create your Profile */}
                    <div className="relative flex items-start gap-2 sm:gap-3">
                      {/* Icon Circle */}
                      <div className={`relative z-10 flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center ${
                        stepCompletion.profile 
                          ? "bg-green-500/10 border-green-500" 
                          : "bg-background border-border"
                      }`}>
                        {stepCompletion.profile ? (
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        ) : (
                          <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-0">
                        <h3 className="text-sm sm:text-base font-semibold mb-0.5 text-muted-foreground">
                          Create your Profile
                        </h3>
                        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                          Set up your account and personalize your learning experience
                        </p>
                      </div>
                    </div>

                    {/* Step 2 - Start Learning */}
                    <div className="relative flex items-start gap-2 sm:gap-3">
                      {/* Icon Circle */}
                      <div className={`relative z-10 flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center ${
                        stepCompletion.learning 
                          ? "bg-green-500/10 border-green-500" 
                          : "bg-background border-border"
                      }`}>
                        {stepCompletion.learning ? (
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        ) : (
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-0">
                        <h3 className="text-sm sm:text-base font-semibold mb-0.5 text-muted-foreground">
                          Start Learning
                        </h3>
                        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                          Enroll in courses or pick a mission to begin your journey
                        </p>
                      </div>
                    </div>

                    {/* Step 3 - Build Projects */}
                    <div className="relative flex items-start gap-2 sm:gap-3">
                      {/* Icon Circle */}
                      <div className={`relative z-10 flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center ${
                        stepCompletion.projects 
                          ? "bg-green-500/10 border-green-500" 
                          : "bg-background border-border"
                      }`}>
                        {stepCompletion.projects ? (
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        ) : (
                          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-0">
                        <h3 className="text-sm sm:text-base font-semibold mb-0.5 text-muted-foreground">
                          Build Projects
                        </h3>
                        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                          Complete hands-on missions and collaborate with teams
                        </p>
                      </div>
                    </div>

                    {/* Step 4 - Earn Rewards */}
                    <div className="relative flex items-start gap-2 sm:gap-3">
                      {/* Icon Circle */}
                      <div className={`relative z-10 flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center ${
                        stepCompletion.rewards 
                          ? "bg-green-500/10 border-green-500" 
                          : "bg-background border-border"
                      }`}>
                        {stepCompletion.rewards ? (
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        ) : (
                          <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-0">
                        <h3 className="text-sm sm:text-base font-semibold mb-0.5 text-muted-foreground">
                          Earn Rewards
                        </h3>
                        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                          Unlock badges, gain XP, and track your progress
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Projects (moved from main column) */}
              <div className="mb-2">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Projects</h3>
              </div>
              
              {loadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : projects.length > 0 ? (
                <>
                  <div className="space-y-2 lg:space-y-3 mb-4">
                    {projects.slice(0, 4).map((project) => (
                      <HorizontalProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                  {projects.length > 4 && (
                    <Button variant="outline" className="w-full rounded-lg group" asChild>
                      <Link href="/academy?tab=projects" className="flex items-center justify-center gap-2">
                        <span className="opacity-40 group-hover:opacity-80 group-hover:font-bold transition-all">View All</span>
                        <ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-80 transition-all" />
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    No projects yet
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/academy/projects/new">Create Project</Link>
                  </Button>
                </div>
              )}

              {/* Teams */}
              <div className="mb-2">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Teams</h3>
              </div>
              
              {loadingTeams ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : teams.length > 0 ? (
                <>
                  <div className="mb-4">
                    <TeamsTicker teams={teams.slice(0, 4)} />
                  </div>
                  {teams.length > 4 && (
                    <Button variant="outline" className="w-full rounded-lg group" asChild>
                      <Link href="/academy?tab=teams" className="flex items-center justify-center gap-2">
                        <span className="opacity-40 group-hover:opacity-80 group-hover:font-bold transition-all">View All</span>
                        <ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-80 transition-all" />
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    No teams yet
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/academy/teams/new">Create Team</Link>
                  </Button>
                </div>
              )}
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
