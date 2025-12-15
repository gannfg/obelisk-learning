"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { getUserBadges, type Badge } from "@/lib/badges";
import { getProgressToNextLevel } from "@/lib/xp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Award, Target, TrendingUp, Calendar, BookOpen, Users, Code, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Badge as UIBadge } from "@/components/ui/badge";

interface AchievementStats {
  totalXP: number;
  level: number;
  badgesCount: number;
  workshopsAttended: number;
  coursesCompleted: number;
  missionsCompleted: number;
}

interface BadgeCategory {
  workshop: Badge[];
  course: Badge[];
  mission: Badge[];
  other: Badge[];
}

export default function AchievementsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AchievementStats>({
    totalXP: 0,
    level: 1,
    badgesCount: 0,
    workshopsAttended: 0,
    coursesCompleted: 0,
    missionsCompleted: 0,
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [badgeCategories, setBadgeCategories] = useState<BadgeCategory>({
    workshop: [],
    course: [],
    mission: [],
    other: [],
  });
  const [recentAchievements, setRecentAchievements] = useState<Badge[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadAchievements();
  }, [user, authLoading]);

  const loadAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const authSupabase = createClient();
      const learningSupabase = createLearningClient();

      if (!authSupabase || !learningSupabase) {
        console.error("Supabase clients not available");
        return;
      }

      // Load badges
      const userBadges = await getUserBadges(learningSupabase, user.id);
      setBadges(userBadges);

      // Categorize badges
      const categories: BadgeCategory = {
        workshop: [],
        course: [],
        mission: [],
        other: [],
      };

      userBadges.forEach((badge) => {
        const name = badge.badge_name.toLowerCase();
        if (name.includes("workshop")) {
          categories.workshop.push(badge);
        } else if (name.includes("mastery") || name.includes("course")) {
          categories.course.push(badge);
        } else if (name.includes("mission")) {
          categories.mission.push(badge);
        } else {
          categories.other.push(badge);
        }
      });

      setBadgeCategories(categories);
      setRecentAchievements(userBadges.slice(0, 10));

      // Load XP from database
      const { data: userData } = await authSupabase
        .from("users")
        .select("xp")
        .eq("id", user.id)
        .single();

      const totalXP = (userData?.xp as number) || 0;
      const progress = getProgressToNextLevel(totalXP);

      // Load workshop attendance count
      const { count: workshopsCount } = await learningSupabase
        .from("workshop_attendance")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Load courses completed (courses with all lessons completed)
      // This is a simplified check - you might want to enhance this
      const { count: coursesCount } = await learningSupabase
        .from("badges")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .like("badge_name", "%Mastery%");

      // Load missions completed
      const { count: missionsCount } = await learningSupabase
        .from("mission_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);

      setStats({
        totalXP,
        level: progress.level,
        badgesCount: userBadges.length,
        workshopsAttended: workshopsCount || 0,
        coursesCompleted: coursesCount || 0,
        missionsCompleted: missionsCount || 0,
      });
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const progress = getProgressToNextLevel(stats.totalXP);

  // Get title based on level
  const getLevelTitle = (level: number): string => {
    if (level >= 1 && level <= 5) return "Beginner";
    if (level >= 6 && level <= 10) return "Intermediate";
    if (level >= 11 && level <= 15) return "Advanced";
    if (level >= 16 && level <= 20) return "Expert";
    if (level >= 21 && level <= 25) return "Master";
    if (level >= 26 && level <= 30) return "Grand Master";
    if (level >= 31 && level <= 40) return "Elite";
    if (level >= 41 && level <= 50) return "Legendary";
    if (level >= 51 && level <= 75) return "Mythic";
    return "Transcendent";
  };

  const levelTitle = getLevelTitle(progress.level);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Please sign in to view your achievements</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Achievements</h1>
        <p className="text-muted-foreground">Track your progress and celebrate your accomplishments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* XP & Level Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Level & XP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold">Level {progress.level}</div>
                  <p className="text-lg font-semibold text-purple-500 dark:text-purple-400 mt-1">{levelTitle}</p>
                  <p className="text-muted-foreground mt-1">Total XP: {stats.totalXP.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold">{progress.currentInLevel}</div>
                  <p className="text-sm text-muted-foreground">/ {progress.neededForNext} XP to next level</p>
                </div>
              </div>
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 transition-all duration-500"
                  style={{ width: `${Math.max(5, progress.progress * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Badges Earned</p>
                    <p className="text-2xl font-bold">{stats.badgesCount}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Workshops Attended</p>
                    <p className="text-2xl font-bold">{stats.workshopsAttended}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Courses Completed</p>
                    <p className="text-2xl font-bold">{stats.coursesCompleted}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Missions Completed</p>
                    <p className="text-2xl font-bold">{stats.missionsCompleted}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Achievements */}
          {recentAchievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAchievements.slice(0, 5).map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{badge.badge_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Earned {format(new Date(badge.earned_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Milestone Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Workshop Milestones */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Workshop Enthusiast</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.workshopsAttended} / 5 workshops
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (stats.workshopsAttended / 5) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Workshop Master</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.workshopsAttended} / 10 workshops
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (stats.workshopsAttended / 10) * 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-6">
          {badges.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No badges earned yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Complete courses, attend workshops, and finish missions to earn badges!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Workshop Badges */}
              {badgeCategories.workshop.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      Workshop Badges ({badgeCategories.workshop.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {badgeCategories.workshop.map((badge) => (
                        <div
                          key={badge.id}
                          className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <Trophy className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold">{badge.badge_name}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(badge.earned_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Course Badges */}
              {badgeCategories.course.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-500" />
                      Course Badges ({badgeCategories.course.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {badgeCategories.course.map((badge) => (
                        <div
                          key={badge.id}
                          className="p-4 rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <Award className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold">{badge.badge_name}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(badge.earned_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mission Badges */}
              {badgeCategories.mission.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-500" />
                      Mission Badges ({badgeCategories.mission.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {badgeCategories.mission.map((badge) => (
                        <div
                          key={badge.id}
                          className="p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                              <Code className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold">{badge.badge_name}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(badge.earned_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Other Badges */}
              {badgeCategories.other.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Other Badges ({badgeCategories.other.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {badgeCategories.other.map((badge) => (
                        <div
                          key={badge.id}
                          className="p-4 rounded-lg border bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                              <Star className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold">{badge.badge_name}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(badge.earned_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          {badges.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No achievements yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start learning to build your achievement timeline!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Achievement Timeline
                </CardTitle>
                <CardDescription>Your achievements in chronological order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {badges
                    .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
                    .map((badge, index) => (
                      <div key={badge.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                            <Trophy className="h-5 w-5 text-white" />
                          </div>
                          {index < badges.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{badge.badge_name}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(badge.earned_at), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                            <UIBadge variant="secondary">
                              {format(new Date(badge.earned_at), "MMM yyyy")}
                            </UIBadge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

