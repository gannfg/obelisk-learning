"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Clock, CheckCircle2, Circle, Trophy, Filter, Sparkles, Code2 } from "lucide-react";
import { MissionCardSkeleton } from "@/components/mission-card-skeleton";
import { useAuth } from "@/lib/hooks/use-auth";
import { createLearningClient } from "@/lib/supabase/learning-client";
import type { Mission, MissionProgress } from "@/types";

export default function MissionBoardPage() {
  const { user, loading: authLoading } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, MissionProgress>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");
  const [stackFilter, setStackFilter] = useState<string>("all");

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

      // Fetch progress for authenticated users
      if (user) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <MissionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const stackTypes = Array.from(
    new Set(missions.map((m) => m.stackType).filter((stack) => Boolean(stack)))
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-lg shrink-0">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">Mission Board</h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Choose a mission to start learning. Complete missions to earn badges and unlock new content.
            </p>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-3 mt-4 p-4 bg-muted/50 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm">
              <span className="font-semibold">AI Assistant</span> is ready to help you learn!
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
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
        </div>
      </Card>

      {/* Mission Grid */}
      {missions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-base text-muted-foreground">No missions found. Check back later!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((mission) => {
            const progress = progressMap[mission.id];
            const isCompleted = progress?.completed || false;
            const checklistProgress = progress?.checklistProgress || [];
            const completedItems = checklistProgress.filter((item) => item.completed).length;
            const totalItems = checklistProgress.length;

            return (
              <Link key={mission.id} href={`/missions/${mission.id}`}>
                <Card
                  className={`overflow-hidden h-full transition-all duration-300 ease-out cursor-pointer hover:scale-105 hover:shadow-xl hover:-translate-y-1 ${
                    isCompleted ? "border-green-500/50 bg-green-500/5" : ""
                  }`}
                >
                  {mission.imageUrl && (
                    <div className="relative w-full h-36 mb-4">
                      <Image
                        src={mission.imageUrl}
                        alt={mission.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-start gap-3 mb-4 px-6">
                    <div className={`p-2 rounded-lg shrink-0 ${isCompleted ? "bg-green-500/20" : "bg-primary/10"}`}>
                      <Target className={`h-5 w-5 ${isCompleted ? "text-green-600" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-1 leading-tight">{mission.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {mission.submissionDeadline
                          ? mission.submissionDeadline.toLocaleDateString()
                          : "No submission date"}
                      </span>
                    </div>
                        <span className="px-2 py-0.5 rounded bg-muted text-xs">
                          {mission.difficulty}
                        </span>
                      </div>
                    </div>
                    {isCompleted && (
                      <Trophy className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>

                  <div className="px-6">
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {mission.goal}
                    </p>

                  {totalItems > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {completedItems} / {totalItems}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${(completedItems / totalItems) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                    <div className="flex items-center justify-between px-6 pb-4">
                      <div className="flex items-center gap-2">
                        <Code2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs px-2 py-1 rounded bg-muted font-medium">
                          {mission.stackType}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        {isCompleted ? "Review" : "Start"}
                        <Circle className="h-3 w-3" />
                      </Button>
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

