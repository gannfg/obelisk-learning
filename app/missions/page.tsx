"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Clock, CheckCircle2, Circle, Trophy, Filter, Sparkles, Calendar, Users, ArrowRight, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { MissionCardSkeleton } from "@/components/mission-card-skeleton";
import { useAuth } from "@/lib/hooks/use-auth";
import { createLearningClient } from "@/lib/supabase/learning-client";
import type { Mission, MissionProgress, MissionSubmission } from "@/types";
import { getMissionPrerequisites, canAccessMission, getMissionPrerequisitesWithDetails } from "@/lib/mission-prerequisites";

export default function MissionBoardPage() {
  const { user, loading: authLoading } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, MissionProgress>>({});
  const [submissionMap, setSubmissionMap] = useState<Record<string, MissionSubmission>>({});
  const [joinCounts, setJoinCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");
  const [joinFilter, setJoinFilter] = useState<"all" | "joined" | "not_joined">("all");
  const [featuredMissions, setFeaturedMissions] = useState<Mission[]>([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [missionAccessMap, setMissionAccessMap] = useState<Record<string, { canAccess: boolean; missingClasses: string[] }>>({});
  const [prerequisiteDetailsMap, setPrerequisiteDetailsMap] = useState<Record<string, Array<{ id: string; title: string; thumbnail?: string }>>>({});

  useEffect(() => {
    if (authLoading) return;

    async function loadMissions() {
      const supabase = createLearningClient();
      if (!supabase) {
        console.error("Supabase client not configured.");
        setLoading(false);
        return;
      }

      // Fetch all missions
      let query = supabase.from("missions").select("*").order("order_index");

      if (filter !== "all") {
        query = query.eq("difficulty", filter);
      }

      const { data: missionsData, error } = await query;

      if (error) {
        console.error("Error loading missions:", error);
        setLoading(false);
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
          endDate: m.end_date ? new Date(m.end_date) : undefined,
          orderIndex: m.order_index,
          badgeId: m.badge_id ?? undefined,
        })) || [];

      setMissions(normalizedMissions);

      // Fetch prerequisites and check access for each mission
      if (user) {
        const accessMap: Record<string, { canAccess: boolean; missingClasses: string[] }> = {};
        const detailsMap: Record<string, Array<{ id: string; title: string; thumbnail?: string }>> = {};

        await Promise.all(
          normalizedMissions.map(async (mission) => {
            // Get prerequisite details
            const prerequisites = await getMissionPrerequisitesWithDetails(mission.id, supabase);
            detailsMap[mission.id] = prerequisites;

            // Check if user can access this mission
            const access = await canAccessMission(mission.id, user.id, supabase);
            accessMap[mission.id] = access;
          })
        );

        setPrerequisiteDetailsMap(detailsMap);
        setMissionAccessMap(accessMap);
      } else {
        // For non-authenticated users, check prerequisites but mark all as locked if they have prerequisites
        const detailsMap: Record<string, Array<{ id: string; title: string; thumbnail?: string }>> = {};
        const accessMap: Record<string, { canAccess: boolean; missingClasses: string[] }> = {};

        await Promise.all(
          normalizedMissions.map(async (mission) => {
            const prerequisites = await getMissionPrerequisitesWithDetails(mission.id, supabase);
            detailsMap[mission.id] = prerequisites;
            // If mission has prerequisites, non-authenticated users can't access
            accessMap[mission.id] = {
              canAccess: prerequisites.length === 0,
              missingClasses: prerequisites.map(p => p.id),
            };
          })
        );

        setPrerequisiteDetailsMap(detailsMap);
        setMissionAccessMap(accessMap);
      }

      // Randomly pick 4 missions for featured hero card
      if (normalizedMissions.length > 0) {
        const shuffled = [...normalizedMissions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(4, shuffled.length));
        setFeaturedMissions(selected);
        setCurrentFeaturedIndex(0);
      }

      // Fetch join counts for all missions
      const missionIds = normalizedMissions.map(m => m.id);
      if (missionIds.length > 0) {
        const { data: joinCountData } = await supabase
          .from("mission_progress")
          .select("mission_id")
          .in("mission_id", missionIds);

        if (joinCountData) {
          const counts: Record<string, number> = {};
          joinCountData.forEach((item) => {
            counts[item.mission_id] = (counts[item.mission_id] || 0) + 1;
          });
          setJoinCounts(counts);
        }
      }

      // Fetch progress and submissions for authenticated users
      if (user) {
        // Fetch mission progress
        const { data: progressData } = await supabase
          .from("mission_progress")
          .select("*")
          .eq("user_id", user.id);

        if (progressData) {
          const progressMap: Record<string, MissionProgress> = {};
          progressData.forEach((p) => {
            progressMap[p.mission_id] = p as MissionProgress;
          });
          setProgressMap(progressMap);
        }

        // Fetch mission submissions
        const { data: submissionData } = await supabase
          .from("mission_submissions")
          .select("*")
          .eq("user_id", user.id);

        if (submissionData) {
          const submissionMap: Record<string, MissionSubmission> = {};
          submissionData.forEach((s) => {
            const mapped: MissionSubmission = {
              id: s.id,
              userId: s.user_id,
              missionId: s.mission_id,
              gitUrl: s.git_url,
              websiteUrl: s.website_url ?? undefined,
              pitchDeckUrl: s.pitch_deck_url ?? undefined,
              status: s.status,
              feedback: s.feedback ?? undefined,
              reviewerId: s.reviewer_id ?? undefined,
              reviewedAt: s.reviewed_at ? new Date(s.reviewed_at) : undefined,
              createdAt: new Date(s.created_at),
              updatedAt: new Date(s.updated_at),
            };
            submissionMap[s.mission_id] = mapped;
          });
          setSubmissionMap(submissionMap);
        }
      }

      setLoading(false);
    }

    loadMissions();
  }, [user, authLoading, filter]);

  // Auto-rotate between featured missions
  useEffect(() => {
    if (featuredMissions.length < 2) return;

    const interval = setInterval(() => {
      setCurrentFeaturedIndex((prev) => (prev + 1) % featuredMissions.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [featuredMissions.length]);

  // Manual navigation functions
  const goToPrevious = () => {
    if (featuredMissions.length < 2) return;
    setCurrentFeaturedIndex((prev) => (prev - 1 + featuredMissions.length) % featuredMissions.length);
  };

  const goToNext = () => {
    if (featuredMissions.length < 2) return;
    setCurrentFeaturedIndex((prev) => (prev + 1) % featuredMissions.length);
  };

  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Hero Card Skeleton */}
        <div className="mb-6">
          <Card className="overflow-hidden border">
            <div className="flex flex-col md:flex-row gap-4 p-6 md:p-8">
              <div className="flex-1 min-h-[200px] flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                  <div className="flex gap-4 mt-4">
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-1.5 w-6 bg-muted rounded-full animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="w-full md:w-48 h-48 bg-muted rounded-lg animate-pulse flex-shrink-0" />
            </div>
          </Card>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <MissionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Get current featured mission from rotation
  const featuredMission = featuredMissions.length > 0 ? featuredMissions[currentFeaturedIndex] : null;
  const featuredProgress = featuredMission ? progressMap[featuredMission.id] : null;
  const featuredSubmission = featuredMission ? submissionMap[featuredMission.id] : null;
  const featuredIsJoined = featuredMission ? !!featuredProgress : false;

  // Calculate days remaining for featured mission
  const getDaysRemaining = (mission: Mission | null) => {
    if (!mission) return null;
    const deadlineDate = mission.endDate || mission.submissionDeadline;
    if (!deadlineDate) return null;
    const now = new Date();
    const deadline = new Date(deadlineDate);
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const featuredDaysRemaining = getDaysRemaining(featuredMission);

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Hero Mission Card */}
      {featuredMission && (
        <Link href={`/missions/${featuredMission.id}`} className="block mb-6 group">
          <Card className="overflow-visible border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative">
            {/* Background Image */}
            <div 
              className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/superteam_color.svg)' }}
            />
            
            {/* Left Navigation Button - Only visible on hover */}
            {featuredMissions.length >= 2 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
                aria-label="Previous mission"
              >
                <ChevronLeft className="h-5 w-5 text-black" />
              </button>
            )}

            {/* Right Navigation Button - Only visible on hover */}
            {featuredMissions.length >= 2 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
                aria-label="Next mission"
              >
                <ChevronRight className="h-5 w-5 text-black" />
              </button>
            )}

            <div className="relative z-10 flex flex-col md:flex-row gap-4 p-6 md:p-8">
              {/* Left Side - Mission Info */}
              <div className="flex-1 flex flex-col justify-between min-h-[200px]">
                <div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-white">
                    {featuredMission.title}
                  </h2>
                  
                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-base md:text-lg text-white">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-5 w-5 text-white" />
                      <span>{joinCounts[featuredMission.id] || 0} joined</span>
                    </div>
                    {featuredDaysRemaining !== null && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-5 w-5 text-white" />
                        <span>
                          {featuredDaysRemaining < 0
                            ? "Closed"
                            : featuredDaysRemaining === 0
                            ? "Due today"
                            : `Due in ${featuredDaysRemaining} day${featuredDaysRemaining !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center gap-2 mt-4">
                  {featuredMissions.length > 1 && (
                    <div className="flex items-center gap-2">
                      {featuredMissions.slice(0, 4).map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentFeaturedIndex(i);
                          }}
                          className={`h-1.5 rounded-full transition-all ${
                            i === currentFeaturedIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
                          }`}
                          aria-label={`Go to mission ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Mission Image (Square) */}
              <div className="relative w-full md:w-64 h-64 md:h-64 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {featuredMission.imageUrl ? (
                  <Image
                    src={featuredMission.imageUrl}
                    alt={featuredMission.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 256px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Target className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Filters */}
      <Card className="p-2 sm:p-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Difficulty:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["all", "beginner", "intermediate", "advanced"].map((level) => (
                <Button
                  key={level}
                  variant={filter === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(level as typeof filter)}
                  className="text-xs h-7 px-2.5"
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Joined:</span>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={joinFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setJoinFilter("all")}
                className="text-xs h-7 px-2.5"
              >
                All
              </Button>
              <Button
                variant={joinFilter === "joined" ? "default" : "outline"}
                size="sm"
                onClick={() => setJoinFilter("joined")}
                className="text-xs h-7 px-2.5"
              >
                Joined
              </Button>
              <Button
                variant={joinFilter === "not_joined" ? "default" : "outline"}
                size="sm"
                onClick={() => setJoinFilter("not_joined")}
                className="text-xs h-7 px-2.5"
              >
                Not Joined
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Mission Grid */}
      {missions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-base text-muted-foreground">No missions found. Check back later!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {missions
            .filter((mission) => {
              const progress = progressMap[mission.id];
              const isJoined = !!progress;
              if (joinFilter === "joined") return isJoined;
              if (joinFilter === "not_joined") return !isJoined;
              return true;
            })
            .map((mission) => {
            const progress = progressMap[mission.id];
            const submission = submissionMap[mission.id];
            const isJoined = !!progress;
            const access = missionAccessMap[mission.id] || { canAccess: true, missingClasses: [] };
            const isLocked = !access.canAccess;
            const prerequisiteDetails = prerequisiteDetailsMap[mission.id] || [];
            
            // Calculate progress percentage based on submission status
            let progressPercentage = 0;
            let statusText = "Not Joined";
            
            if (isJoined) {
              if (!submission) {
                progressPercentage = 0;
                statusText = "Joined";
              } else {
            switch (submission.status) {
              case "submitted":
                progressPercentage = 50;
                statusText = "Submitted";
                break;
              case "under_review":
                progressPercentage = 75;
                statusText = "Under Review";
                break;
              case "changes_requested":
                progressPercentage = 75;
                statusText = "Changes Requested";
                break;
              case "approved":
                progressPercentage = 100;
                statusText = "Approved";
                break;
              default:
                progressPercentage = 0;
                statusText = "Joined";
            }
              }
            }

            const status = submission?.status;

            const cardContent = (
              <Card
                className={`overflow-hidden transition-all duration-200 ease-out cursor-pointer hover:scale-[1.02] hover:shadow-lg ${
                  progressPercentage === 100
                    ? "border-green-500/50 bg-green-500/5"
                    : status === "changes_requested"
                    ? "border-amber-400/60 bg-amber-50"
                    : isJoined
                    ? "border-blue-500/30 bg-blue-500/5"
                    : ""
                }`}
              >
                  <div className="p-4">
                    {/* Top Section - Icon and Title */}
                    <div className="flex items-start gap-2 mb-2">
                      {/* Small Icon/Image on Left */}
                      <div className="flex-shrink-0">
                        {mission.imageUrl ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                            <Image
                              src={mission.imageUrl}
                              alt={mission.title}
                              fill
                              sizes="64px"
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Target className="h-8 w-8 text-primary" />
                          </div>
                        )}
                      </div>

                      {/* Title and Level */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-bold mb-0.5 leading-tight line-clamp-2">
                          {mission.title}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-medium capitalize ${
                            mission.difficulty === "beginner"
                              ? "text-green-600 dark:text-green-400"
                              : mission.difficulty === "intermediate"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-purple-600 dark:text-purple-400"
                          }`}>
                            {mission.difficulty} level
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Statistics Row */}
                    <div className="space-y-1 mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {mission.submissionDeadline && (
                          <div className="flex items-center gap-0.5">
                            <Clock className="h-4 w-4" />
                            <span>{mission.submissionDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-0.5">
                          <Users className="h-4 w-4" />
                          <span>{joinCounts[mission.id] || 0}</span>
                        </div>
                      </div>
                      
                      {/* Days Remaining to Join */}
                      {(mission.endDate || mission.submissionDeadline) && (() => {
                        const deadlineDate = mission.endDate || mission.submissionDeadline;
                        if (!deadlineDate) return null;
                        
                        const now = new Date();
                        const deadline = new Date(deadlineDate);
                        const diffTime = deadline.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays < 0) {
                          return (
                            <div className="text-xs text-muted-foreground">
                              <span className="text-red-600 dark:text-red-400">Closed</span>
                            </div>
                          );
                        } else if (diffDays === 0) {
                          return (
                            <div className="text-xs text-muted-foreground">
                              <span className="text-amber-600 dark:text-amber-400">Due today</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-xs text-muted-foreground">
                              <span>Due in {diffDays} day{diffDays !== 1 ? 's' : ''}</span>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-1.5">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            progressPercentage === 100 
                              ? "bg-green-500" 
                              : status === "changes_requested"
                              ? "bg-amber-500"
                              : progressPercentage >= 50 
                              ? "bg-blue-500" 
                              : "bg-primary"
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Completion Status */}
                    <div className={`text-xs font-medium ${
                      progressPercentage === 100
                        ? "text-green-600 dark:text-green-400"
                        : status === "changes_requested"
                        ? "text-amber-600 dark:text-amber-500"
                        : progressPercentage >= 50
                        ? "text-blue-600 dark:text-blue-400"
                        : isJoined
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground"
                    }`}>
                      {statusText}: {progressPercentage}%
                    </div>
                  </div>
                </Card>
            );

            return (
              <Link key={mission.id} href={`/missions/${mission.id}`} className="block w-full group">
                {cardContent}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

