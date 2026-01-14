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
import type { ModuleProgress, ClassProgress, AttendanceStats } from "@/types/classes";

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

    const attendance: WeekAttendance = {
      id: data.id,
      classId: data.class_id,
      userId: data.user_id,
      weekNumber: data.week_number,
      checkedInAt: new Date(data.checked_in_at),
      method: data.method,
      checkedInBy: data.checked_in_by,
    };

    // Check if class is completed and award badges
    // Import awardClassBadges dynamically to avoid circular dependencies
    try {
      const { awardClassBadges } = await import("@/lib/classes");
      await awardClassBadges(classId, userId, supabase);
      
      // Check if progress is 100% and mark enrollment as completed
      await checkAndMarkClassCompletion(classId, userId, supabase);
    } catch (badgeError) {
      // Don't fail attendance marking if badge awarding fails
      console.error("Error awarding badges:", badgeError);
    }

    return attendance;
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
    
    // Get authenticated user from auth Supabase (learning Supabase might not have auth session)
    // For RLS policies, we need to ensure the user_id matches auth.uid()
    // Since learning Supabase references auth.users, we need to verify the user exists
    let effectiveUserId = userId;
    
    // Try to get auth user from learning Supabase (if it has auth configured)
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authUser && authUser.id !== userId) {
        console.warn("userId parameter doesn't match authenticated user. Using authenticated user ID.");
        effectiveUserId = authUser.id;
      } else if (!authUser && authError) {
        // If learning Supabase doesn't have auth, we'll use the provided userId
        // This assumes the RLS policies are configured to work with the provided userId
        console.warn("Could not get auth user from learning Supabase:", authError);
      }
    } catch (authErr) {
      // Learning Supabase might not have auth configured - that's okay
      // We'll use the provided userId and assume RLS is configured correctly
      console.warn("Auth check failed (this may be normal if learning Supabase doesn't have auth):", authErr);
    }
    
    // Check if assignment exists and get due date
    const { data: assignment, error: assignmentError } = await supabase
      .from("class_assignments")
      .select("due_date, class_id")
      .eq("id", assignmentId)
      .single();

    if (assignmentError) {
      console.error("Error fetching assignment:", {
        error: assignmentError,
        code: assignmentError.code,
        message: assignmentError.message,
        details: assignmentError.details,
        hint: assignmentError.hint,
      });
      throw new Error(`Assignment not found: ${assignmentError.message || assignmentError.code}`);
    }
    
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Verify class_id matches (safety check)
    if (assignment.class_id !== classId) {
      throw new Error("Assignment does not belong to the specified class");
    }

    // Determine if submission is late
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const isLate = now > dueDate;
    const status = isLate ? "late" : "submitted";

    // Try to find existing submission first
    // Use effectiveUserId to ensure RLS policies work
    const { data: existing, error: existingError } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("user_id", effectiveUserId)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("Error checking existing submission:", {
        error: existingError,
        code: existingError.code,
        message: existingError.message,
      });
      throw new Error(`Failed to check existing submission: ${existingError.message}`);
    }

    let result;
    if (existing) {
      // Update existing submission - preserve grade and feedback if they exist
      const updateData: any = {
        status: status,
        is_late: isLate,
        updated_at: now.toISOString(),
      };

      // Update submission content based on type (only update if provided)
      if (submission.content !== undefined) {
        updateData.submission_content = submission.content;
      }
      if (submission.url !== undefined) {
        updateData.submission_url = submission.url;
      }
      if (submission.fileUrl !== undefined) {
        updateData.submission_file_url = submission.fileUrl;
      }
      if (submission.gitUrl !== undefined) {
        updateData.git_url = submission.gitUrl;
        if (submission.repoDirectory !== undefined) {
          updateData.repo_directory = submission.repoDirectory;
        }
      }

      // Don't overwrite grade, feedback, reviewed_by, reviewed_at if they exist
      // These are set by instructors

      const { data, error } = await supabase
        .from("assignment_submissions")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating assignment submission:", {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          updateData,
        });
        throw new Error(error.message || `Failed to update submission: ${error.code || "Unknown error"}`);
      }
      result = data;
    } else {
      // Insert new submission - use effectiveUserId for RLS
      const submissionData: any = {
        assignment_id: assignmentId,
        user_id: effectiveUserId, // Use effectiveUserId for RLS policies
        class_id: classId,
        status: status,
        is_late: isLate,
        submitted_at: now.toISOString(),
      };

      // Add submission content based on type
      if (submission.content) {
        submissionData.submission_content = submission.content;
      }
      if (submission.url) {
        submissionData.submission_url = submission.url;
      }
      if (submission.fileUrl) {
        submissionData.submission_file_url = submission.fileUrl;
      }
      if (submission.gitUrl) {
        submissionData.git_url = submission.gitUrl;
        if (submission.repoDirectory) {
          submissionData.repo_directory = submission.repoDirectory;
        }
      }

      const { data, error } = await supabase
        .from("assignment_submissions")
        .insert(submissionData)
        .select()
        .single();

      if (error) {
        const errorDetails = {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          submissionData: {
            ...submissionData,
            // Don't log full file URLs or content
            submission_file_url: submissionData.submission_file_url ? "[FILE_URL]" : undefined,
            submission_content: submissionData.submission_content ? "[CONTENT]" : undefined,
          },
          assignmentId,
          userId: effectiveUserId,
          classId,
        };
        console.error("Error inserting assignment submission:", errorDetails);
        throw new Error(error.message || `Failed to create submission: ${error.code || "Unknown error"}`);
      }
      result = data;
    }

    if (!result) {
      throw new Error("Submission failed: No data returned");
    }

    return {
      id: result.id,
      assignmentId: result.assignment_id,
      userId: result.user_id,
      classId: result.class_id,
      submissionContent: result.submission_content,
      submissionUrl: result.submission_url,
      submissionFileUrl: result.submission_file_url,
      gitUrl: result.git_url,
      repoDirectory: result.repo_directory,
      status: result.status,
      isLate: result.is_late,
      grade: result.grade,
      feedback: result.feedback,
      reviewedBy: result.reviewed_by,
      reviewedAt: result.reviewed_at ? new Date(result.reviewed_at) : undefined,
      submittedAt: new Date(result.submitted_at),
      updatedAt: new Date(result.updated_at),
    };
  } catch (error: any) {
    // Log comprehensive error information
    const errorInfo: any = {
      message: error?.message || "Unknown error",
      name: error?.name,
      stack: error?.stack,
      assignmentId,
      userId,
      classId,
    };
    
    // If it's a Supabase error, include its properties
    if (error?.code) errorInfo.code = error.code;
    if (error?.details) errorInfo.details = error.details;
    if (error?.hint) errorInfo.hint = error.hint;
    
    // Try to stringify the error object
    try {
      errorInfo.errorString = JSON.stringify(error, Object.getOwnPropertyNames(error));
    } catch {
      errorInfo.errorString = String(error);
    }
    
    console.error("Error in submitAssignment:", errorInfo);
    throw error; // Re-throw to let the caller handle it
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

    // Check if class is completed after grading (only if status is approved)
    if (data && status === "approved") {
      try {
        await checkAndMarkClassCompletion(data.class_id, data.user_id, supabase);
      } catch (completionError) {
        // Don't fail grading if completion check fails
        console.error("Error checking class completion:", completionError);
      }
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

/**
 * Get detailed progress for a specific module
 */
export async function getModuleProgress(
  classId: string,
  userId: string,
  moduleId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<ModuleProgress | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    
    // Get module info
    const { data: module, error: moduleError } = await supabase
      .from("class_modules")
      .select("id, week_number")
      .eq("id", moduleId)
      .eq("class_id", classId)
      .single();

    if (moduleError || !module) {
      console.error("Error fetching module:", moduleError);
      return null;
    }

    // Check attendance for this week
    const { data: attendance } = await supabase
      .from("class_attendance")
      .select("id, checked_in_at")
      .eq("class_id", classId)
      .eq("user_id", userId)
      .eq("week_number", module.week_number)
      .maybeSingle();

    const hasAttendance = !!attendance;

    // Get assignments for this module
    const { data: assignments } = await supabase
      .from("class_assignments")
      .select("id")
      .eq("module_id", moduleId);

    const assignmentIds = (assignments || []).map((a: any) => a.id);
    
    // Get submission status for each assignment
    const assignmentRequirements: Array<{ assignmentId: string; completed: boolean }> = [];
    let completedAssignments = 0;

    if (assignmentIds.length > 0) {
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("assignment_id, status")
        .eq("user_id", userId)
        .in("assignment_id", assignmentIds);

      const submissionMap = new Map(
        (submissions || []).map((s: any) => [s.assignment_id, s.status])
      );

      for (const assignmentId of assignmentIds) {
        const status = submissionMap.get(assignmentId);
        const completed = status === "approved" || status === "reviewed" || status === "submitted" || status === "late";
        assignmentRequirements.push({ assignmentId, completed });
        if (completed) completedAssignments++;
      }
    }

    // Calculate progress percentage
    const totalRequirements = 1 + assignmentIds.length; // attendance + assignments
    const completedRequirements = (hasAttendance ? 1 : 0) + completedAssignments;
    const progress = totalRequirements > 0 
      ? Math.round((completedRequirements / totalRequirements) * 100)
      : (hasAttendance ? 100 : 0);

    const isCompleted = hasAttendance && assignmentRequirements.every(a => a.completed);

    return {
      moduleId,
      completed: isCompleted,
      progress,
      requirements: {
        attendance: hasAttendance,
        assignments: assignmentRequirements,
      },
      completedAt: isCompleted && attendance ? new Date(attendance.checked_in_at) : undefined,
    };
  } catch (error) {
    console.error("Error in getModuleProgress:", error);
    return null;
  }
}

/**
 * Get overall class progress with detailed breakdown
 */
export async function getOverallClassProgress(
  classId: string,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassProgress | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    
    // Get all modules
    const { data: modules, count: totalModules } = await supabase
      .from("class_modules")
      .select("id, week_number", { count: "exact" })
      .eq("class_id", classId);

    if (!modules) {
      return null;
    }

    // Get all attendance records
    const { data: attendance, count: attendanceCount } = await supabase
      .from("class_attendance")
      .select("week_number", { count: "exact" })
      .eq("class_id", classId)
      .eq("user_id", userId);

    const attendedWeeks = new Set((attendance || []).map((a: any) => a.week_number));
    
    // Get all assignments with their module_id
    const { data: assignments } = await supabase
      .from("class_assignments")
      .select("id, module_id")
      .eq("class_id", classId);

    const assignmentIds = (assignments || []).map((a: any) => a.id);
    const totalAssignments = assignmentIds.length;

    // Get submitted assignments
    let completedAssignments = 0;
    let completedAssignmentSet = new Set<string>();
    if (assignmentIds.length > 0) {
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("assignment_id, status")
        .eq("user_id", userId)
        .in("assignment_id", assignmentIds);

      const completed = (submissions || [])
        .filter((s: any) => 
          s.status === "approved" || 
          s.status === "reviewed" || 
          s.status === "submitted" || 
          s.status === "late"
        );
      completedAssignmentSet = new Set(completed.map((s: any) => s.assignment_id));
      completedAssignments = completedAssignmentSet.size;
    }

    // Calculate truly completed modules (attendance + all assignments in module completed)
    let completedModules = 0;
    for (const module of modules) {
      const hasAttendance = attendedWeeks.has(module.week_number);
      if (!hasAttendance) continue;
      
      // Get assignments for this module
      const moduleAssignments = (assignments || []).filter((a: any) => a.module_id === module.id);
      
      // If module has no assignments, it's complete with just attendance
      if (moduleAssignments.length === 0) {
        completedModules++;
        continue;
      }
      
      // Check if all assignments in this module are completed
      const allAssignmentsCompleted = moduleAssignments.every((a: any) => 
        completedAssignmentSet.has(a.id)
      );
      
      if (allAssignmentsCompleted) {
        completedModules++;
      }
    }

    // Calculate percentages
    const totalModulesCount = totalModules || 0;
    const modulePercentage = totalModulesCount > 0 
      ? Math.round((completedModules / totalModulesCount) * 100)
      : 0;
    
    const assignmentPercentage = totalAssignments > 0
      ? Math.round((completedAssignments / totalAssignments) * 100)
      : 0;

    const attendancePercentage = totalModulesCount > 0
      ? Math.round((attendedWeeks.size / totalModulesCount) * 100)
      : 0;

    // Calculate overall progress (weighted average: modules 40%, assignments 40%, attendance 20%)
    const overall = Math.round(
      (modulePercentage * 0.4) + 
      (assignmentPercentage * 0.4) + 
      (attendancePercentage * 0.2)
    );

    return {
      overall,
      modules: {
        completed: completedModules,
        total: totalModulesCount,
        percentage: modulePercentage,
      },
      assignments: {
        completed: completedAssignments,
        total: totalAssignments,
        percentage: assignmentPercentage,
      },
      attendance: {
        attended: attendedWeeks.size,
        total: totalModulesCount,
        percentage: attendancePercentage,
      },
    };
  } catch (error) {
    console.error("Error in getOverallClassProgress:", error);
    return null;
  }
}

/**
 * Check if class progress is 100% and mark enrollment as completed
 */
export async function checkAndMarkClassCompletion(
  classId: string,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<boolean> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    
    // Get overall class progress
    const progress = await getOverallClassProgress(classId, userId, supabase);
    
    if (!progress) {
      return false;
    }
    
    // Check if progress is 100% and all requirements are met
    // For 100% completion, we need:
    // - All modules completed (attendance + all assignments in each module)
    // - All assignments completed (100% assignments) OR no assignments exist
    // - All weeks attended (100% attendance)
    // - Overall progress is 100%
    const hasModules = progress.modules.total > 0;
    const hasAssignments = progress.assignments.total > 0;
    const allModulesComplete = progress.modules.completed === progress.modules.total;
    const allAssignmentsComplete = !hasAssignments || (progress.assignments.completed === progress.assignments.total);
    const allWeeksAttended = progress.attendance.attended === progress.attendance.total;
    
    const isComplete = 
      progress.overall === 100 &&
      hasModules &&
      allModulesComplete &&
      allAssignmentsComplete &&
      allWeeksAttended &&
      progress.attendance.total > 0;
    
    if (!isComplete) {
      return false;
    }
    
    // Check current enrollment status
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("class_enrollments")
      .select("id, status")
      .eq("class_id", classId)
      .eq("user_id", userId)
      .single();
    
    if (enrollmentError) {
      console.error("Error fetching enrollment:", enrollmentError);
      return false;
    }
    
    if (!enrollment) {
      return false;
    }
    
    // Only update if not already completed
    if (enrollment.status === "completed") {
      return true; // Already completed
    }
    
    // Update enrollment status to completed
    const { error: updateError } = await supabase
      .from("class_enrollments")
      .update({ status: "completed" })
      .eq("id", enrollment.id);
    
    if (updateError) {
      console.error("Error updating enrollment status:", updateError);
      return false;
    }
    
    console.log(`Class ${classId} marked as completed for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error in checkAndMarkClassCompletion:", error);
    return false;
  }
}

/**
 * Get attendance statistics including streaks
 */
export async function getAttendanceStats(
  classId: string,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<AttendanceStats | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    
    // Get all modules to determine total weeks
    const { data: modules } = await supabase
      .from("class_modules")
      .select("week_number")
      .eq("class_id", classId)
      .order("week_number", { ascending: true });

    if (!modules || modules.length === 0) {
      return {
        totalWeeks: 0,
        attendedWeeks: 0,
        percentage: 0,
        currentStreak: 0,
        longestStreak: 0,
        perfectAttendance: false,
      };
    }

    const totalWeeks = modules.length;
    const weekNumbers = modules.map((m: any) => m.week_number);

    // Get all attendance records
    const { data: attendance } = await supabase
      .from("class_attendance")
      .select("week_number")
      .eq("class_id", classId)
      .eq("user_id", userId)
      .order("week_number", { ascending: true });

    const attendedWeeksSet = new Set((attendance || []).map((a: any) => a.week_number));
    const attendedWeeks = attendedWeeksSet.size;
    const percentage = totalWeeks > 0 ? Math.round((attendedWeeks / totalWeeks) * 100) : 0;

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Find the highest week number that has attendance
    const maxAttendedWeek = attendance && attendance.length > 0
      ? Math.max(...(attendance as any[]).map((a: any) => a.week_number))
      : 0;

    // Calculate current streak (from highest week backwards)
    for (let week = maxAttendedWeek; week >= Math.min(...weekNumbers); week--) {
      if (attendedWeeksSet.has(week)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (const week of weekNumbers) {
      if (attendedWeeksSet.has(week)) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const perfectAttendance = attendedWeeks === totalWeeks && totalWeeks > 0;

    return {
      totalWeeks,
      attendedWeeks,
      percentage,
      currentStreak,
      longestStreak,
      perfectAttendance,
    };
  } catch (error) {
    console.error("Error in getAttendanceStats:", error);
    return null;
  }
}

