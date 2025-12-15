/**
 * Mission Prerequisites System
 * Functions to check if users have completed prerequisite classes for missions
 */

import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getClassModules, getModuleAssignments } from "@/lib/classes";

/**
 * Check if a user has completed a class
 * A class is considered completed if:
 * 1. User enrollment status is "completed", OR
 * 2. User has completed all assignments in all modules (all submissions are "approved")
 */
export async function isClassCompleted(
  classId: string,
  userId: string,
  learningSupabase?: SupabaseClient<any>
): Promise<boolean> {
  try {
    const supabase = learningSupabase || createLearningClient();
    if (!supabase) {
      console.error("Supabase client not configured.");
      return false;
    }

    // Check if user enrollment status is "completed"
    const { data: enrollment } = await supabase
      .from("class_enrollments")
      .select("status")
      .eq("class_id", classId)
      .eq("user_id", userId)
      .single();

    if (enrollment?.status === "completed") {
      return true;
    }

    // Check if user has completed all assignments
    const modules = await getClassModules(classId, supabase);
    if (modules.length === 0) {
      // If no modules, check if enrollment exists and is active
      return enrollment?.status === "active";
    }

    // Get all assignments for all modules
    const allAssignments: string[] = [];
    for (const module of modules) {
      const assignments = await getModuleAssignments(module.id, supabase);
      allAssignments.push(...assignments.map((a) => a.id));
    }

    if (allAssignments.length === 0) {
      // If no assignments, consider class completed if enrolled
      return !!enrollment;
    }

    // Check if all assignments have approved submissions
    const { data: submissions } = await supabase
      .from("assignment_submissions")
      .select("assignment_id, status")
      .in("assignment_id", allAssignments)
      .eq("user_id", userId)
      .eq("status", "approved");

    if (!submissions) {
      return false;
    }

    // Check if we have approved submissions for all assignments
    const approvedAssignmentIds = new Set(submissions.map((s) => s.assignment_id));
    return allAssignments.every((assignmentId) => approvedAssignmentIds.has(assignmentId));
  } catch (error) {
    console.error("Error checking class completion:", error);
    return false;
  }
}

/**
 * Get prerequisite class IDs for a mission
 */
export async function getMissionPrerequisites(
  missionId: string,
  learningSupabase?: SupabaseClient<any>
): Promise<string[]> {
  try {
    const supabase = learningSupabase || createLearningClient();
    if (!supabase) {
      console.error("Supabase client not configured.");
      return [];
    }

    const { data, error } = await supabase
      .from("mission_prerequisites")
      .select("class_id")
      .eq("mission_id", missionId);

    if (error) {
      // If table doesn't exist, return empty array (graceful degradation)
      if (
        error.code === "42P01" || 
        error.message?.includes("does not exist") ||
        error.message?.includes("Could not find the table") ||
        error.message?.includes("schema cache")
      ) {
        // Silently return empty array - table doesn't exist yet, which is fine
        return [];
      }
      console.error("Error fetching mission prerequisites:", error.message || error);
      return [];
    }

    return (data || []).map((item) => item.class_id);
  } catch (error) {
    console.error("Error in getMissionPrerequisites:", error);
    return [];
  }
}

/**
 * Check if a user can access a mission (has completed all prerequisites)
 */
export async function canAccessMission(
  missionId: string,
  userId: string,
  learningSupabase?: SupabaseClient<any>
): Promise<{ canAccess: boolean; missingClasses: string[] }> {
  try {
    const prerequisiteClassIds = await getMissionPrerequisites(missionId, learningSupabase);

    // If no prerequisites, mission is accessible
    if (prerequisiteClassIds.length === 0) {
      return { canAccess: true, missingClasses: [] };
    }

    // Check completion status for each prerequisite class
    const missingClasses: string[] = [];
    for (const classId of prerequisiteClassIds) {
      const isCompleted = await isClassCompleted(classId, userId, learningSupabase);
      if (!isCompleted) {
        missingClasses.push(classId);
      }
    }

    return {
      canAccess: missingClasses.length === 0,
      missingClasses,
    };
  } catch (error) {
    console.error("Error checking mission access:", error);
    return { canAccess: false, missingClasses: [] };
  }
}

/**
 * Get prerequisite classes with their details (including thumbnails)
 */
export async function getMissionPrerequisitesWithDetails(
  missionId: string,
  learningSupabase?: SupabaseClient<any>
): Promise<Array<{ id: string; title: string; thumbnail?: string }>> {
  try {
    const supabase = learningSupabase || createLearningClient();
    if (!supabase) {
      console.error("Supabase client not configured.");
      return [];
    }

    // First, get the prerequisite class IDs
    const { data: prerequisites, error: prerequisitesError } = await supabase
      .from("mission_prerequisites")
      .select("class_id")
      .eq("mission_id", missionId);

    if (prerequisitesError) {
      // If table doesn't exist, return empty array (graceful degradation)
      if (
        prerequisitesError.code === "42P01" || 
        prerequisitesError.message?.includes("does not exist") ||
        prerequisitesError.message?.includes("Could not find the table") ||
        prerequisitesError.message?.includes("schema cache")
      ) {
        // Silently return empty array - table doesn't exist yet, which is fine
        return [];
      }
      console.error("Error fetching mission prerequisites:", prerequisitesError.message || prerequisitesError);
      return [];
    }

    if (!prerequisites || prerequisites.length === 0) {
      return [];
    }

    // Then, fetch the class details including thumbnails
    const classIds = prerequisites.map((p) => p.class_id);
    const { data: classes, error: classesError } = await supabase
      .from("classes")
      .select("id, title, thumbnail")
      .in("id", classIds);

    if (classesError) {
      console.error("Error fetching class details:", classesError.message || classesError);
      return [];
    }

    return (classes || []).map((classItem) => ({
      id: classItem.id,
      title: classItem.title,
      thumbnail: classItem.thumbnail || undefined,
    }));
  } catch (error) {
    console.error("Error in getMissionPrerequisitesWithDetails:", error);
    return [];
  }
}

