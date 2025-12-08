/**
 * Functions to fetch statistics and activity data for the landing page sidebar
 */

import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";

export interface ImpactStats {
  learnersEmpowered: number;
  missionsCompleted: number;
  workshopsHosted: number;
  projectsBuilt: number;
  grantsAwarded: number;
}

export interface RecentAchievement {
  userId: string;
  userName: string;
  userAvatar?: string;
  type: "badge" | "course" | "mission";
  title: string;
  timestamp: Date;
}

export interface RecentActivity {
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  timestamp: Date;
}

/**
 * Fetch impact overview statistics
 */
export async function getImpactStats(): Promise<ImpactStats> {
  try {
    const learningSupabase = createLearningClient();
    const authSupabase = createClient();

    // Get total learners (users who have any progress)
    const [missionProgressRes, courseProgressRes, projectsRes, usersRes] = await Promise.all([
      // Count unique users who completed missions
      learningSupabase
        .from("mission_progress")
        .select("user_id")
        .eq("completed", true),
      
      // Count unique users who have course progress
      learningSupabase
        .from("course_progress")
        .select("user_id"),
      
      // Count projects
      learningSupabase
        .from("projects")
        .select("id", { count: "exact", head: true }),
      
      // Count total users (from auth Supabase)
      authSupabase
        .from("users")
        .select("id", { count: "exact", head: true }),
    ]);

    // Get unique learners (users with any activity)
    const missionUserIds = new Set(
      (missionProgressRes.data || []).map((p: any) => p.user_id)
    );
    const courseUserIds = new Set(
      (courseProgressRes.data || []).map((p: any) => p.user_id)
    );
    const allLearnerIds = new Set([...missionUserIds, ...courseUserIds]);
    const learnersEmpowered = allLearnerIds.size || usersRes.count || 0;

    // Count completed missions
    const missionsCompletedRes = await learningSupabase
      .from("mission_progress")
      .select("id", { count: "exact", head: true })
      .eq("completed", true);
    const missionsCompleted = missionsCompletedRes.count || 0;

    // Workshops hosted
    const { count: workshopsCount, error: workshopsError } = await learningSupabase
      .from("workshops")
      .select("*", { count: "exact", head: true });

    const workshopsHosted = workshopsCount || 0;
    if (workshopsError) console.error("Error fetching workshops count:", workshopsError);

    // Projects built
    const projectsBuilt = projectsRes.count || 0;

    // Grants awarded (placeholder - no grants table yet)
    const grantsAwarded = 0;

    return {
      learnersEmpowered,
      missionsCompleted,
      workshopsHosted,
      projectsBuilt,
      grantsAwarded,
    };
  } catch (error) {
    console.error("Error fetching impact stats:", error);
    return {
      learnersEmpowered: 0,
      missionsCompleted: 0,
      workshopsHosted: 0,
      projectsBuilt: 0,
      grantsAwarded: 0,
    };
  }
}

/**
 * Fetch recent achievements (badges, courses, missions)
 */
export async function getRecentAchievements(limit: number = 5): Promise<RecentAchievement[]> {
  try {
    const learningSupabase = createLearningClient();
    const authSupabase = createClient();

    const achievements: RecentAchievement[] = [];

    // Fetch recent badges
    const badgesRes = await learningSupabase
      .from("user_badges")
      .select("*, badges(*)")
      .order("earned_at", { ascending: false })
      .limit(limit);

    if (badgesRes.data) {
      for (const userBadge of badgesRes.data) {
        const badge = (userBadge as any).badges;
        if (badge) {
          // Get user email from auth Supabase
          const { data: userData } = await authSupabase
            .from("users")
            .select("email")
            .eq("id", userBadge.user_id)
            .single();
          
          achievements.push({
            userId: userBadge.user_id,
            userName: userData?.email?.split("@")[0] || "User",
            type: "badge",
            title: `earned badge: ${badge.name}`,
            timestamp: new Date(userBadge.earned_at),
          });
        }
      }
    }

    // Fetch recent course progress (users actively learning)
    // Note: Full course completion detection would require checking all lessons
    // For now, we'll show recent course activity
    const courseProgressRes = await learningSupabase
      .from("course_progress")
      .select("*, courses(title)")
      .order("updated_at", { ascending: false })
      .limit(limit);

    // For achievements, we'll focus on badges and missions which have clear completion status
    // Course completions can be added later with proper completion detection logic

    // Fetch recent mission completions
    const missionProgressRes = await learningSupabase
      .from("mission_progress")
      .select("*, users!mission_progress_user_id_fkey(email), missions(title)")
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(limit);

    if (missionProgressRes.data) {
      for (const progress of missionProgressRes.data) {
        const mission = (progress as any).missions;
        if (mission) {
          // Get user email from auth Supabase
          const { data: userData } = await authSupabase
            .from("users")
            .select("email")
            .eq("id", progress.user_id)
            .single();
          
          achievements.push({
            userId: progress.user_id,
            userName: userData?.email?.split("@")[0] || "User",
            type: "mission",
            title: `completed mission: ${mission.title}`,
            timestamp: new Date(progress.completed_at),
          });
        }
      }
    }

    // Sort by timestamp and return top N
    return achievements
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent achievements:", error);
    return [];
  }
}

/**
 * Fetch recent activity (submissions, completions, badges)
 */
export async function getRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
  try {
    const learningSupabase = createLearningClient();
    const authSupabase = createClient();

    const activities: RecentActivity[] = [];

    // Fetch recent project submissions
    const submissionsRes = await learningSupabase
      .from("mission_submissions")
      .select("*, missions(title)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (submissionsRes.data) {
      for (const submission of submissionsRes.data) {
        const mission = (submission as any).missions;
        if (mission) {
          // Get user email from auth Supabase
          const { data: userData } = await authSupabase
            .from("users")
            .select("email")
            .eq("id", submission.user_id)
            .single();
          
          activities.push({
            userId: submission.user_id,
            userName: userData?.email?.split("@")[0] || "User",
            action: `submitted project for "${mission.title}"`,
            timestamp: new Date(submission.created_at),
          });
        }
      }
    }

    // Fetch recent mission completions
    const missionProgressRes = await learningSupabase
      .from("mission_progress")
      .select("*, users!mission_progress_user_id_fkey(email), missions(title)")
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(limit);

    if (missionProgressRes.data) {
      for (const progress of missionProgressRes.data) {
        const mission = (progress as any).missions;
        if (mission) {
          // Get user email from auth Supabase
          const { data: userData } = await authSupabase
            .from("users")
            .select("email")
            .eq("id", progress.user_id)
            .single();
          
          activities.push({
            userId: progress.user_id,
            userName: userData?.email?.split("@")[0] || "User",
            action: `completed mission "${mission.title}"`,
            timestamp: new Date(progress.completed_at),
          });
        }
      }
    }

    // Fetch recent badges for activity
    const badgesRes = await learningSupabase
      .from("user_badges")
      .select("*, badges(name)")
      .order("earned_at", { ascending: false })
      .limit(limit);

    if (badgesRes.data) {
      for (const userBadge of badgesRes.data) {
        const badge = (userBadge as any).badges;
        if (badge) {
          // Get user email from auth Supabase
          const { data: userData } = await authSupabase
            .from("users")
            .select("email")
            .eq("id", userBadge.user_id)
            .single();
          
          activities.push({
            userId: userBadge.user_id,
            userName: userData?.email?.split("@")[0] || "User",
            action: `earned badge "${badge.name}"`,
            timestamp: new Date(userBadge.earned_at),
          });
        }
      }
    }

    // Sort by timestamp and return top N
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}

