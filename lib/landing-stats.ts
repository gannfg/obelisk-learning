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
    
    if (!learningSupabase || !authSupabase) {
      console.error("Supabase clients not configured.");
      return {
        learnersEmpowered: 0,
        missionsCompleted: 0,
        workshopsHosted: 0,
        projectsBuilt: 0,
        grantsAwarded: 0,
      };
    }

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
    
    if (!learningSupabase || !authSupabase) {
      console.error("Supabase clients not configured.");
      return [];
    }

    const achievements: RecentAchievement[] = [];

    // Fetch recent badges
    // Use a minimal select to avoid 400 errors if the FK name differs; Supabase will follow badge_id FK automatically
    const badgesRes = await learningSupabase
      .from("user_badges")
      .select("user_id, badge_id, earned_at, badges(name)")
      .order("earned_at", { ascending: false })
      .limit(limit);

    // Collect all user IDs to batch fetch
    const userIds = new Set<string>();
    if (badgesRes.data) {
      badgesRes.data.forEach((userBadge: any) => {
        if (userBadge.user_id) userIds.add(userBadge.user_id);
      });
    }

    // Batch fetch all users at once
    let usersMap = new Map<string, { username?: string | null; email?: string; image_url?: string | null }>();
    if (userIds.size > 0) {
      const userIdsArray = Array.from(userIds);
      const { data: usersData, error: usersError } = await authSupabase
        .from("users")
        .select("id, username, email, image_url")
        .in("id", userIdsArray);
      
      if (usersError) {
        console.error("Error batch fetching users for achievements:", usersError);
      }
      
      if (usersData) {
        usersData.forEach((user: any) => {
          usersMap.set(user.id, {
            username: user.username,
            email: user.email,
            image_url: user.image_url,
          });
        });
        
        // Log if some users weren't found
        const foundUserIds = new Set(usersData.map((u: any) => u.id));
        const missingUserIds = userIdsArray.filter(id => !foundUserIds.has(id));
        if (missingUserIds.length > 0) {
          console.warn(`Users not found in users table (may need profile sync):`, missingUserIds);
        }
      }
    }

    if (badgesRes.data) {
      for (const userBadge of badgesRes.data) {
        const badge = (userBadge as any).badges;
        if (badge) {
          const userData = usersMap.get(userBadge.user_id);
          // Try to get username, fallback to email prefix, fallback to user ID prefix
          let userName = "User";
          if (userData) {
            userName = userData.username || userData.email?.split("@")[0] || userBadge.user_id.substring(0, 8);
          } else {
            // User not found in users table - use ID prefix as fallback
            userName = userBadge.user_id.substring(0, 8);
          }
          
          achievements.push({
            userId: userBadge.user_id,
            userName,
            userAvatar: userData?.image_url || undefined,
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
      .select("*, missions!mission_progress_mission_id_fkey(title)")
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(limit);

    // Collect user IDs from mission progress (add to existing set)
    if (missionProgressRes.data) {
      missionProgressRes.data.forEach((progress: any) => {
        if (progress.user_id) userIds.add(progress.user_id);
      });
    }

    // Batch fetch all users at once (including new IDs from missions)
    if (userIds.size > 0 && userIds.size > usersMap.size) {
      const userIdsArray = Array.from(userIds);
      const { data: usersData, error: usersError } = await authSupabase
        .from("users")
        .select("id, username, email, image_url")
        .in("id", userIdsArray);
      
      if (usersError) {
        console.error("Error fetching users for achievements:", usersError);
      }
      
      if (usersData) {
        usersData.forEach((user: any) => {
          usersMap.set(user.id, {
            username: user.username,
            email: user.email,
            image_url: user.image_url,
          });
        });
      }
    }

    if (missionProgressRes.data) {
      for (const progress of missionProgressRes.data) {
        const mission = (progress as any).missions;
        if (mission) {
          const userData = usersMap.get(progress.user_id);
          // Try to get username, fallback to email prefix, fallback to user ID prefix
          let userName = "User";
          if (userData) {
            userName = userData.username || userData.email?.split("@")[0] || progress.user_id.substring(0, 8);
          } else {
            // User not found in users table - use ID prefix as fallback
            userName = progress.user_id.substring(0, 8);
          }
          
          achievements.push({
            userId: progress.user_id,
            userName,
            userAvatar: userData?.image_url || undefined,
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
    
    if (!learningSupabase || !authSupabase) {
      console.error("Supabase clients not configured.");
      return [];
    }

    const activities: RecentActivity[] = [];

    // Fetch recent project submissions
    const submissionsRes = await learningSupabase
      .from("mission_submissions")
      .select("*, missions!mission_submissions_mission_id_fkey(title)")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Collect all user IDs to batch fetch
    const userIds = new Set<string>();
    if (submissionsRes.data) {
      submissionsRes.data.forEach((submission: any) => {
        if (submission.user_id) userIds.add(submission.user_id);
      });
    }

    // Batch fetch all users at once
    let usersMap = new Map<string, { username?: string | null; email?: string; image_url?: string | null }>();
    if (userIds.size > 0) {
      const userIdsArray = Array.from(userIds);
      const { data: usersData, error: usersError } = await authSupabase
        .from("users")
        .select("id, username, email, image_url")
        .in("id", userIdsArray);
      
      if (usersError) {
        console.error("Error batch fetching users for activity:", usersError);
      }
      
      if (usersData) {
        usersData.forEach((user: any) => {
          usersMap.set(user.id, {
            username: user.username,
            email: user.email,
            image_url: user.image_url,
          });
        });
        
        // Log if some users weren't found
        const foundUserIds = new Set(usersData.map((u: any) => u.id));
        const missingUserIds = userIdsArray.filter(id => !foundUserIds.has(id));
        if (missingUserIds.length > 0) {
          console.warn(`Users not found in users table (may need profile sync):`, missingUserIds);
        }
      }
    }

    if (submissionsRes.data) {
      for (const submission of submissionsRes.data) {
        const mission = (submission as any).missions;
        if (mission) {
          const userData = usersMap.get(submission.user_id);
          // Try to get username, fallback to email prefix, fallback to user ID prefix
          let userName = "User";
          if (userData) {
            userName = userData.username || userData.email?.split("@")[0] || submission.user_id.substring(0, 8);
          } else {
            // User not found in users table - use ID prefix as fallback
            userName = submission.user_id.substring(0, 8);
          }
          
          activities.push({
            userId: submission.user_id,
            userName,
            userAvatar: userData?.image_url || undefined,
            action: `submitted project for "${mission.title}"`,
            timestamp: new Date(submission.created_at),
          });
        }
      }
    }

    // Fetch recent mission completions
    const missionProgressRes = await learningSupabase
      .from("mission_progress")
      .select("*, missions!mission_progress_mission_id_fkey(title)")
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(limit);

    // Collect user IDs from mission progress
    if (missionProgressRes.data) {
      missionProgressRes.data.forEach((progress: any) => {
        if (progress.user_id) userIds.add(progress.user_id);
      });
    }

    // Fetch recent badges for activity
    const badgesRes = await learningSupabase
      .from("user_badges")
      .select("user_id, badge_id, earned_at, badges(name)")
      .order("earned_at", { ascending: false })
      .limit(limit);

    // Collect user IDs from badges
    if (badgesRes.data) {
      badgesRes.data.forEach((userBadge: any) => {
        if (userBadge.user_id) userIds.add(userBadge.user_id);
      });
    }

    // Batch fetch all users at once (if we have new IDs)
    if (userIds.size > 0) {
      const userIdsArray = Array.from(userIds);
      const { data: usersData } = await authSupabase
        .from("users")
        .select("id, username, email, image_url")
        .in("id", userIdsArray);
      
      if (usersData) {
        usersData.forEach((user: any) => {
          usersMap.set(user.id, {
            username: user.username,
            email: user.email,
            image_url: user.image_url,
          });
        });
      }
    }

    // Process mission completions
    if (missionProgressRes.data) {
      for (const progress of missionProgressRes.data) {
        const mission = (progress as any).missions;
        if (mission) {
          const userData = usersMap.get(progress.user_id);
          // Try to get username, fallback to email prefix, fallback to user ID prefix
          let userName = "User";
          if (userData) {
            userName = userData.username || userData.email?.split("@")[0] || progress.user_id.substring(0, 8);
          } else {
            // User not found in users table - use ID prefix as fallback
            userName = progress.user_id.substring(0, 8);
          }
          
          activities.push({
            userId: progress.user_id,
            userName,
            userAvatar: userData?.image_url || undefined,
            action: `completed mission "${mission.title}"`,
            timestamp: new Date(progress.completed_at),
          });
        }
      }
    }

    // Process badges
    if (badgesRes.data) {
      for (const userBadge of badgesRes.data) {
        const badge = (userBadge as any).badges;
        if (badge) {
          const userData = usersMap.get(userBadge.user_id);
          // Try to get username, fallback to email prefix, fallback to user ID prefix
          let userName = "User";
          if (userData) {
            userName = userData.username || userData.email?.split("@")[0] || userBadge.user_id.substring(0, 8);
          } else {
            // User not found in users table - use ID prefix as fallback
            userName = userBadge.user_id.substring(0, 8);
          }
          
          activities.push({
            userId: userBadge.user_id,
            userName,
            userAvatar: userData?.image_url || undefined,
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

