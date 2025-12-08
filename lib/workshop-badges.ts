/**
 * Workshop Badge Integration
 * Awards badges for workshop attendance
 */

import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/notifications";

/**
 * Award workshop attendance badge
 */
export async function awardWorkshopBadge(
  userId: string,
  workshopId: string,
  workshopTitle: string,
  authSupabase: any
): Promise<boolean> {
  try {
    const learningSupabase = createLearningClient();

    // Check if badge already exists, create if not
    let { data: existingBadge } = await learningSupabase
      .from("badges")
      .select("id")
      .eq("name", "Workshop Attendee")
      .maybeSingle();

    let badgeId: string;

    if (existingBadge) {
      badgeId = existingBadge.id;
    } else {
      // Create badge if it doesn't exist
      const { data: newBadge, error: createError } = await learningSupabase
        .from("badges")
        .insert({
          name: "Workshop Attendee",
          description: "Attended a workshop",
          color: "#8B5CF6", // Purple
        })
        .select()
        .single();

      if (createError || !newBadge) {
        console.error("Error creating badge:", createError);
        return false;
      }

      badgeId = newBadge.id;
    }

    // Award badge to user
    const { error: awardError } = await learningSupabase
      .from("user_badges")
      .insert({
        user_id: userId,
        badge_id: badgeId,
        mission_id: null, // Workshop badges aren't tied to missions
      });

    if (awardError) {
      // Ignore duplicate badge errors
      if (awardError.code !== "23505") {
        console.error("Error awarding badge:", awardError);
        return false;
      }
    }

    // Send notification
    try {
      await createNotification(
        {
          userId,
          type: "badge",
          title: "Badge Earned! 🏆",
          message: `You earned the "Workshop Attendee" badge for attending "${workshopTitle}"!`,
          link: "/profile",
          metadata: {
            badge_name: "Workshop Attendee",
            workshop_id: workshopId,
            workshop_title: workshopTitle,
          },
        },
        authSupabase
      );
    } catch (notifError) {
      console.error("Error sending badge notification:", notifError);
      // Don't fail badge award if notification fails
    }

    return true;
  } catch (error) {
    console.error("Error in awardWorkshopBadge:", error);
    return false;
  }
}

/**
 * Check and award special badges based on attendance milestones
 */
export async function checkWorkshopMilestones(
  userId: string,
  authSupabase: any
): Promise<void> {
  try {
    const learningSupabase = createLearningClient();

    // Count total workshops attended
    const { count } = await learningSupabase
      .from("workshop_attendance")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const totalAttended = count || 0;

    // Award "Workshop Enthusiast" badge for 5+ workshops
    if (totalAttended >= 5) {
      const { data: badge } = await learningSupabase
        .from("badges")
        .select("id")
        .eq("name", "Workshop Enthusiast")
        .single();

      if (badge) {
        try {
          await learningSupabase.from("user_badges").insert({
            user_id: userId,
            badge_id: badge.id,
            mission_id: null,
          });

          await createNotification(
            {
              userId,
              type: "badge",
              title: "Badge Earned! 🏆",
              message: `You earned the "Workshop Enthusiast" badge for attending 5+ workshops!`,
              link: "/profile",
              metadata: {
                badge_name: "Workshop Enthusiast",
                milestone: "5_workshops",
              },
            },
            authSupabase
          );
        } catch {
          // Ignore duplicate errors
        }
      }
    }

    // Award "Workshop Master" badge for 10+ workshops
    if (totalAttended >= 10) {
      const { data: badge } = await learningSupabase
        .from("badges")
        .select("id")
        .eq("name", "Workshop Master")
        .single();

      if (badge) {
        try {
          await learningSupabase.from("user_badges").insert({
            user_id: userId,
            badge_id: badge.id,
            mission_id: null,
          });

          await createNotification(
            {
              userId,
              type: "badge",
              title: "Badge Earned! 🏆",
              message: `You earned the "Workshop Master" badge for attending 10+ workshops!`,
              link: "/profile",
              metadata: {
                badge_name: "Workshop Master",
                milestone: "10_workshops",
              },
            },
            authSupabase
          );
        } catch {
          // Ignore duplicate errors
        }
      }
    }
  } catch (error) {
    console.error("Error checking workshop milestones:", error);
  }
}


