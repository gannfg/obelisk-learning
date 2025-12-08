"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Trophy, Activity, Users, Target, BookOpen, FolderKanban, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  getImpactStats,
  getRecentAchievements,
  getRecentActivity,
  type ImpactStats,
  type RecentAchievement,
  type RecentActivity,
} from "@/lib/landing-stats";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ago`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

export function LandingSidebar() {
  const [impactStats, setImpactStats] = useState<ImpactStats | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [stats, achievements, activities] = await Promise.all([
          getImpactStats(),
          getRecentAchievements(5),
          getRecentActivity(5),
        ]);

        setImpactStats(stats);
        setRecentAchievements(achievements);
        setRecentActivities(activities);
      } catch (error) {
        console.error("Error loading landing page data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <aside className="w-full lg:w-80 space-y-6">
      {/* Impact Overview */}
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-5 tracking-tight">Impact Overview</h3>
        <div className="space-y-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : impactStats ? (
            <>
              <div className="space-y-1">
                <p className="text-2xl font-bold leading-tight tracking-tight">
                  {formatNumber(impactStats.learnersEmpowered)}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">Learners Empowered</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold leading-tight tracking-tight">
                  {formatNumber(impactStats.missionsCompleted)}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">Missions Completed</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold leading-tight tracking-tight">
                  {formatNumber(impactStats.workshopsHosted)}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">Workshops Hosted</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold leading-tight tracking-tight">
                  {formatNumber(impactStats.projectsBuilt)}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">Projects Built</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold leading-tight tracking-tight">
                  {formatNumber(impactStats.grantsAwarded)}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">Grants Awarded</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No data available</p>
          )}
        </div>
      </Card>

      {/* How Superteam Study Works */}
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-5 flex items-center gap-2 tracking-tight">
          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
          <span>How Superteam Study Works</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium leading-snug">Create your Profile</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Join Superteam Study and set your learning goals
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium leading-snug">Learn & Complete Missions</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Take classes, attend workshops, and finish missions
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium leading-snug">Build Projects & Earn Recognition</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Submit real work, earn XP, badges, and qualify for grants
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Achievements */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold flex items-center gap-2 tracking-tight">
            <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Recent Achievements</span>
          </h3>
          <Link
            href="/leaderboard"
            className="text-xs text-primary hover:underline font-medium whitespace-nowrap"
          >
            Leaderboard →
          </Link>
        </div>
        <div className="space-y-3.5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : recentAchievements.length > 0 ? (
            recentAchievements.map((achievement, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {achievement.type === "badge" && <Award className="h-3.5 w-3.5 text-primary" />}
                  {achievement.type === "course" && <BookOpen className="h-3.5 w-3.5 text-primary" />}
                  {achievement.type === "mission" && <Target className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium text-foreground">{achievement.userName}</span>{" "}
                    <span className="text-muted-foreground">{achievement.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {formatTimeAgo(achievement.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-2">No recent achievements</p>
          )}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold flex items-center gap-2 tracking-tight">
            <Activity className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Recent Activity</span>
          </h3>
          <Link
            href="/activity"
            className="text-xs text-primary hover:underline font-medium whitespace-nowrap"
          >
            View All →
          </Link>
        </div>
        <div className="space-y-3.5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium text-foreground">{activity.userName}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-2">No recent activity</p>
          )}
        </div>
      </Card>
    </aside>
  );
}

