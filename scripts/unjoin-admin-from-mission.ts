/**
 * Script to unjoin admin users from a specific mission
 * Usage: This can be run via Supabase SQL Editor or as a one-time script
 */

import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";

async function unjoinAdminFromMission() {
  const learningSupabase = createLearningClient();
  const supabase = createClient();
  
  if (!learningSupabase || !supabase) {
    console.error("Supabase clients not configured");
    return;
  }

  try {
    // 1. Find the mission "Its Solana szn!"
    const { data: missions, error: missionError } = await learningSupabase
      .from("missions")
      .select("id, title")
      .ilike("title", "%solana%szn%");

    if (missionError) {
      console.error("Error finding mission:", missionError);
      return;
    }

    if (!missions || missions.length === 0) {
      console.log("Mission 'Its Solana szn!' not found");
      return;
    }

    const mission = missions[0];
    console.log(`Found mission: ${mission.title} (${mission.id})`);

    // 2. Get all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from("users")
      .select("id")
      .eq("is_admin", true);

    if (adminError) {
      console.error("Error fetching admin users:", adminError);
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log("No admin users found");
      return;
    }

    console.log(`Found ${adminUsers.length} admin user(s)`);

    // 3. Find mission progress records for admin users on this mission
    const adminUserIds = adminUsers.map(u => u.id);
    const { data: progressRecords, error: progressError } = await learningSupabase
      .from("mission_progress")
      .select("id, user_id")
      .eq("mission_id", mission.id)
      .in("user_id", adminUserIds);

    if (progressError) {
      console.error("Error fetching mission progress:", progressError);
      return;
    }

    if (!progressRecords || progressRecords.length === 0) {
      console.log("No admin users found joined to this mission");
      return;
    }

    console.log(`Found ${progressRecords.length} admin user(s) joined to this mission`);

    // 4. Delete mission progress records for admin users
    const progressIds = progressRecords.map(p => p.id);
    const { error: deleteError } = await learningSupabase
      .from("mission_progress")
      .delete()
      .in("id", progressIds);

    if (deleteError) {
      console.error("Error deleting mission progress:", deleteError);
      return;
    }

    console.log(`Successfully unjoined ${progressRecords.length} admin user(s) from mission "${mission.title}"`);

    // 5. Also delete any mission submissions for admin users on this mission
    const { data: submissions, error: submissionsError } = await learningSupabase
      .from("mission_submissions")
      .select("id")
      .eq("mission_id", mission.id)
      .in("user_id", adminUserIds);

    if (submissionsError) {
      console.warn("Error fetching mission submissions:", submissionsError);
    } else if (submissions && submissions.length > 0) {
      const submissionIds = submissions.map(s => s.id);
      const { error: deleteSubmissionsError } = await learningSupabase
        .from("mission_submissions")
        .delete()
        .in("id", submissionIds);

      if (deleteSubmissionsError) {
        console.warn("Error deleting mission submissions:", deleteSubmissionsError);
      } else {
        console.log(`Also deleted ${submissions.length} submission(s) from admin users`);
      }
    }

  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// Run if called directly
if (require.main === module) {
  unjoinAdminFromMission();
}

export { unjoinAdminFromMission };

