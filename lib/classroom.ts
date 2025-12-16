/**
 * Classroom System - Data Access Layer
 * Handles week-based attendance, module content, assignments, and announcements
 * 
 * NOTE: This file can be used in both client and server components.
 * When used in client components, pass createLearningClient() from lib/supabase/learning-client
 * When used in server components, pass createLearningServerClient() from lib/supabase/server
 */

import { createLearningClient } from "@/lib/supabase/learning-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getClassAnnouncements as getClassAnnouncementsFromClasses } from "@/lib/classes";

export interface WeekAttendance {
  id: string;
  classId: string;
  userId: string;
  weekNumber: number;
  checkedInAt: Date;
  method: "qr" | "manual";
  checkedInBy?: string;
}

export interface ModuleContent {
  type: "markdown" | "html" | "json";
  data: string;
}

function ensureSupabaseClient(
  supabaseClient?: SupabaseClient<any>
): SupabaseClient<any> {
  if (supabaseClient) {
    return supabaseClient;
  }
  const client = createLearningClient();
  if (!client) {
    throw new Error("Supabase client not configured.");
  }
  return client;
}

/**
 * Get week-based attendance for a user in a class
 */
export async function getWeekAttendance(
  classId: string,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<WeekAttendance[]> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_attendance")
      .select("*")
      .eq("class_id", classId)
      .eq("user_id", userId)
      .order("week_number", { ascending: true });

    if (error) {
      console.error("Error fetching week attendance:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      classId: item.class_id,
      userId: item.user_id,
      weekNumber: item.week_number,
      checkedInAt: new Date(item.checked_in_at),
      method: item.method,
      checkedInBy: item.checked_in_by,
    }));
  } catch (error) {
    console.error("Error in getWeekAttendance:", error);
    return [];
  }
}

/**
 * Get all attendance for a class (instructor view)
 */
export async function getClassWeekAttendance(
  classId: string,
  weekNumber?: number,
  supabaseClient?: SupabaseClient<any>
): Promise<WeekAttendance[]> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    let query = supabase
      .from("class_attendance")
      .select("*")
      .eq("class_id", classId)
      .order("week_number", { ascending: true })
      .order("checked_in_at", { ascending: false });

    if (weekNumber !== undefined) {
      query = query.eq("week_number", weekNumber);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching class attendance:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      classId: item.class_id,
      userId: item.user_id,
      weekNumber: item.week_number,
      checkedInAt: new Date(item.checked_in_at),
      method: item.method,
      checkedInBy: item.checked_in_by,
    }));
  } catch (error) {
    console.error("Error in getClassWeekAttendance:", error);
    return [];
  }
}

/**
 * Mark attendance for a week
 */
export async function markWeekAttendance(
  classId: string,
  userId: string,
  weekNumber: number,
  method: "qr" | "manual" | "auto" = "manual",
  checkedBy?: string,
  supabaseClient?: SupabaseClient<any>
): Promise<WeekAttendance | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_attendance")
      .upsert(
        {
          class_id: classId,
          user_id: userId,
          week_number: weekNumber,
          method,
          checked_in_by: checkedBy || userId,
        },
        {
          onConflict: "class_id,user_id,week_number",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error marking attendance:", error);
      return null;
    }

    return {
      id: data.id,
      classId: data.class_id,
      userId: data.user_id,
      weekNumber: data.week_number,
      checkedInAt: new Date(data.checked_in_at),
      method: data.method,
      checkedInBy: data.checked_in_by,
    };
  } catch (error) {
    console.error("Error in markWeekAttendance:", error);
    return null;
  }
}

/**
 * Get announcements for a class (re-export from classes)
 */
export async function getClassAnnouncements(
  classId: string,
  supabaseClient?: SupabaseClient<any>
) {
  return getClassAnnouncementsFromClasses(classId, supabaseClient);
}

/**
 * Get assignments for a class (all modules)
 */
export async function getClassAssignments(
  classId: string,
  supabaseClient?: SupabaseClient<any>
) {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_assignments")
      .select("*")
      .eq("class_id", classId)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching assignments:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      moduleId: item.module_id,
      classId: item.class_id,
      title: item.title,
      description: item.description,
      instructions: item.instructions,
      dueDate: new Date(item.due_date),
      submissionType: item.submission_type,
      maxFileSize: item.max_file_size,
      allowedFileTypes: item.allowed_file_types,
      lockAfterDeadline: item.lock_after_deadline,
      xpReward: item.xp_reward,
      createdBy: item.created_by,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error) {
    console.error("Error in getClassAssignments:", error);
    return [];
  }
}

/**
 * Get user's submission for an assignment
 */
export async function getUserSubmission(
  assignmentId: string,
  userId: string,
  supabaseClient?: SupabaseClient<any>
) {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No submission found
        return null;
      }
      console.error("Error fetching submission:", error);
      return null;
    }

    return {
      id: data.id,
      assignmentId: data.assignment_id,
      userId: data.user_id,
      classId: data.class_id,
      submissionContent: data.submission_content,
      submissionUrl: data.submission_url,
      submissionFileUrl: data.submission_file_url,
      gitUrl: data.git_url,
      repoDirectory: data.repo_directory,
      status: data.status,
      isLate: data.is_late,
      grade: data.grade,
      feedback: data.feedback,
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      submittedAt: new Date(data.submitted_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error("Error in getUserSubmission:", error);
    return null;
  }
}

/**
 * Submit assignment
 */
export async function submitAssignment(
  assignmentId: string,
  userId: string,
  classId: string,
  submission: {
    content?: string;
    url?: string;
    fileUrl?: string;
    gitUrl?: string;
    repoDirectory?: string;
  },
  supabaseClient?: SupabaseClient<any>
) {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("assignment_submissions")
      .upsert(
        {
          assignment_id: assignmentId,
          user_id: userId,
          class_id: classId,
          submission_content: submission.content,
          submission_url: submission.url,
          submission_file_url: submission.fileUrl,
          git_url: submission.gitUrl,
          repo_directory: submission.repoDirectory,
          status: "submitted",
        },
        {
          onConflict: "assignment_id,user_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error submitting assignment:", error);
      return null;
    }

    return {
      id: data.id,
      assignmentId: data.assignment_id,
      userId: data.user_id,
      classId: data.class_id,
      submissionContent: data.submission_content,
      submissionUrl: data.submission_url,
      submissionFileUrl: data.submission_file_url,
      gitUrl: data.git_url,
      repoDirectory: data.repo_directory,
      status: data.status,
      isLate: data.is_late,
      grade: data.grade,
      feedback: data.feedback,
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      submittedAt: new Date(data.submitted_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error("Error in submitAssignment:", error);
    return null;
  }
}

/**
 * Grade submission (instructor only)
 * Note: Notification is sent automatically via database trigger when grade/feedback is added
 */
export async function gradeSubmission(
  submissionId: string,
  grade: number,
  feedback: string,
  status: "approved" | "changes_requested",
  reviewedBy: string,
  supabaseClient?: SupabaseClient<any>
) {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("assignment_submissions")
      .update({
        grade,
        feedback,
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) {
      console.error("Error grading submission:", error);
      return null;
    }

    return {
      id: data.id,
      assignmentId: data.assignment_id,
      userId: data.user_id,
      classId: data.class_id,
      submissionContent: data.submission_content,
      submissionUrl: data.submission_url,
      submissionFileUrl: data.submission_file_url,
      gitUrl: data.git_url,
      repoDirectory: data.repo_directory,
      status: data.status,
      isLate: data.is_late,
      grade: data.grade,
      feedback: data.feedback,
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      submittedAt: new Date(data.submitted_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error("Error in gradeSubmission:", error);
    return null;
  }
}

/**
 * Get next session time for a class
 */
export async function getNextSession(
  classId: string,
  supabaseClient?: SupabaseClient<any>
) {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    
    // Get upcoming modules
    const { data: modules, error: modulesError } = await supabase
      .from("class_modules")
      .select("*")
      .eq("class_id", classId)
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(1);

    if (modulesError || !modules || modules.length === 0) {
      return null;
    }

    const module = modules[0];
    
    // Get live session for this module
    const { data: session, error: sessionError } = await supabase
      .from("live_sessions")
      .select("*")
      .eq("module_id", module.id)
      .gte("session_date", new Date().toISOString())
      .order("session_date", { ascending: true })
      .limit(1)
      .single();

    if (sessionError || !session) {
      return {
        module,
        session: null,
        meetingLink: module.live_session_link || null,
      };
    }

    return {
      module,
      session: {
        id: session.id,
        moduleId: session.module_id,
        classId: session.class_id,
        title: session.title,
        description: session.description,
        sessionDate: new Date(session.session_date),
        locationType: session.location_type,
        location: session.location,
        meetingLink: session.meeting_link,
      },
      meetingLink: session.meeting_link || module.live_session_link || null,
    };
  } catch (error) {
    console.error("Error in getNextSession:", error);
    return null;
  }
}

/**
 * Get student progress summary
 */
export async function getStudentProgress(
  classId: string,
  userId: string,
  supabaseClient?: SupabaseClient<any>
) {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    
    // Get total modules (all modules are now accessible since we removed locking)
    const { count: totalModules } = await supabase
      .from("class_modules")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classId);

    // All modules are accessible now (locking removed), so unlocked = total
    const unlockedModules = totalModules;

    // Get attendance count
    const { count: attendanceCount } = await supabase
      .from("class_attendance")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("user_id", userId);

    // Get assignments
    const { data: assignments } = await supabase
      .from("class_assignments")
      .select("id")
      .eq("class_id", classId);

    const assignmentIds = assignments?.map((a) => a.id) || [];
    
    // Get submitted assignments
    const { count: submittedCount } = assignmentIds.length > 0
      ? await supabase
          .from("assignment_submissions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .in("assignment_id", assignmentIds)
      : { count: 0 };

    return {
      totalModules: totalModules || 0,
      unlockedModules: unlockedModules || 0,
      attendanceCount: attendanceCount || 0,
      totalAssignments: assignmentIds.length,
      submittedAssignments: submittedCount || 0,
    };
  } catch (error) {
    console.error("Error in getStudentProgress:", error);
    return {
      totalModules: 0,
      unlockedModules: 0,
      attendanceCount: 0,
      totalAssignments: 0,
      submittedAssignments: 0,
    };
  }
}

