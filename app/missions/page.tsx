"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Clock, CheckCircle2, Circle, Trophy, Filter, Sparkles, Code2, Calendar, Users } from "lucide-react";
import { MissionCardSkeleton } from "@/components/mission-card-skeleton";
import { useAuth } from "@/lib/hooks/use-auth";
import { createLearningClient } from "@/lib/supabase/learning-client";
import type { Mission, MissionProgress, MissionSubmission } from "@/types";

export default function MissionBoardPage() {
  const { user, loading: authLoading } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, MissionProgress>>({});
  const [submissionMap, setSubmissionMap] = useState<Record<string, MissionSubmission>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");
  const [stackFilter, setStackFilter] = useState<string>("all");
  const [joinFilter, setJoinFilter] = useState<"all" | "joined" | "not_joined">("all");

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

      if (stackFilter !== "all") {
        query = query.eq("stack_type", stackFilter);
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
          orderIndex: m.order_index,
          badgeId: m.badge_id ?? undefined,
        })) || [];

      setMissions(normalizedMissions);

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
  }, [user, authLoading, filter, stackFilter]);

  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-20 md:pb-8">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="h-8 sm:h-10 bg-muted rounded w-48 sm:w-64 mb-3 sm:mb-4 animate-pulse" />
          <div className="h-5 sm:h-6 bg-muted rounded w-full max-w-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <MissionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const stackTypes = Array.from(
    new Set(missions.map((m) => m.stackType).filter((stack): stack is NonNullable<typeof stack> => Boolean(stack)))
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">Mission Board</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Choose a mission to start learning. Complete missions to earn badges and unlock new content.
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-2 mt-3 p-3 bg-muted/50 rounded-lg">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm">
              <span className="font-semibold">AI Assistant</span> is ready to help you learn!
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">Difficulty:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["all", "beginner", "intermediate", "advanced"].map((level) => (
                <Button
                  key={level}
                  variant={filter === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(level as typeof filter)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm font-medium whitespace-nowrap">Stack:</span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={stackFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStackFilter("all")}
              >
                All
              </Button>
              {stackTypes.map((stack) => (
                <Button
                  key={stack}
                  variant={stackFilter === stack ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStackFilter(stack)}
                >
                  {stack}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm font-medium whitespace-nowrap">Joined:</span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={joinFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setJoinFilter("all")}
              >
                All
              </Button>
              <Button
                variant={joinFilter === "joined" ? "default" : "outline"}
                size="sm"
                onClick={() => setJoinFilter("joined")}
              >
                Joined
              </Button>
              <Button
                variant={joinFilter === "not_joined" ? "default" : "outline"}
                size="sm"
                onClick={() => setJoinFilter("not_joined")}
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

            return (
              <Link key={mission.id} href={`/missions/${mission.id}`} className="block w-full group aspect-square">
                <Card
                  className={`overflow-hidden h-full transition-all duration-200 ease-out cursor-pointer hover:scale-[1.02] hover:shadow-lg ${
                    progressPercentage === 100
                      ? "border-green-500/50 bg-green-500/5"
                      : status === "changes_requested"
                      ? "border-amber-400/60 bg-amber-50"
                      : isJoined
                      ? "border-blue-500/30 bg-blue-500/5"
                      : ""
                  }`}
                >
                  <div className="p-4 sm:p-5">
                    {/* Top Section - Icon and Title */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* Small Icon/Image on Left */}
                      <div className="flex-shrink-0">
                        {mission.imageUrl ? (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                            <Image
                              src={mission.imageUrl}
                              alt={mission.title}
                              fill
                              sizes="48px"
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Target className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>

                      {/* Title and Level */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold mb-1 leading-tight">
                          {mission.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium capitalize ${
                            mission.difficulty === "beginner"
                              ? "text-green-600 dark:text-green-400"
                              : mission.difficulty === "intermediate"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-purple-600 dark:text-purple-400"
                          }`}>
                            {mission.difficulty} level
                          </span>
                          {isJoined && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                              Joined
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Statistics Row */}
                    <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                      {mission.estimatedTime && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{mission.estimatedTime}</span>
                        </div>
                      )}
                      {mission.submissionDeadline && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{mission.submissionDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{Math.floor(Math.random() * 100) + 10}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

