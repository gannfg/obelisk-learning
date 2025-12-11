/**
 * Classroom Notification Helpers
 * Functions to send notifications for classroom events
 */

import { createNotification } from "@/lib/notifications";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getClassEnrollments } from "@/lib/classes";

/**
 * Notify all enrolled students in a class
 */
export async function notifyClassStudents(
  classId: string,
  type: "class" | "assignment" | "feedback",
  title: string,
  message: string,
  link: string,
  metadata: Record<string, any> = {},
  learningSupabase: SupabaseClient,
  authSupabase: SupabaseClient
): Promise<number> {
  try {
    // Get all enrolled students
    const enrollments = await getClassEnrollments(classId, learningSupabase);
    const activeEnrollments = enrollments.filter((e) => e.status === "active");

    let count = 0;
    for (const enrollment of activeEnrollments) {
      const notification = await createNotification(
        {
          userId: enrollment.userId,
          type,
          title,
          message,
          link,
          metadata: {
            class_id: classId,
            ...metadata,
          },
        },
        authSupabase
      );

      if (notification) {
        count++;
      }
    }

    return count;
  } catch (error) {
    console.error("Error notifying class students:", error);
    return 0;
  }
}

/**
 * Notify about new announcement
 */
export async function notifyNewAnnouncement(
  classId: string,
  classTitle: string,
  announcementTitle: string,
  announcementContent: string,
  moduleId?: string,
  learningSupabase: SupabaseClient,
  authSupabase: SupabaseClient
): Promise<number> {
  return notifyClassStudents(
    classId,
    "class",
    `${classTitle}: ${announcementTitle}`,
    announcementContent.substring(0, 200) + (announcementContent.length > 200 ? "..." : ""),
    `/class/${classId}?tab=announcements`,
    {
      announcement_title: announcementTitle,
      module_id: moduleId,
    },
    learningSupabase,
    authSupabase
  );
}

/**
 * Notify about new assignment
 */
export async function notifyNewAssignment(
  classId: string,
  classTitle: string,
  assignmentTitle: string,
  dueDate: Date,
  moduleTitle?: string,
  learningSupabase: SupabaseClient,
  authSupabase: SupabaseClient
): Promise<number> {
  const dueDateStr = dueDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return notifyClassStudents(
    classId,
    "assignment",
    `New Assignment: ${assignmentTitle}`,
    `A new assignment has been posted for ${classTitle}${moduleTitle ? ` (${moduleTitle})` : ""}. Due: ${dueDateStr}`,
    `/class/${classId}?tab=assignments`,
    {
      assignment_title: assignmentTitle,
      due_date: dueDate.toISOString(),
    },
    learningSupabase,
    authSupabase
  );
}

/**
 * Notify student about assignment graded
 */
export async function notifyAssignmentGraded(
  userId: string,
  classId: string,
  assignmentTitle: string,
  grade?: number,
  status: "approved" | "changes_requested" | "reviewed" = "reviewed",
  authSupabase: SupabaseClient
): Promise<boolean> {
  let title = "Assignment Graded";
  let message = "";

  if (status === "approved") {
    title = "Assignment Approved! ✅";
    message = `Your assignment "${assignmentTitle}" has been approved!`;
    if (grade !== undefined) {
      message += ` Grade: ${grade}/100`;
    }
  } else if (status === "changes_requested") {
    title = "Changes Requested";
    message = `Your instructor has requested changes to your assignment "${assignmentTitle}".`;
  } else {
    message = `Your assignment "${assignmentTitle}" has been reviewed.`;
  }

  const notification = await createNotification(
    {
      userId,
      type: "feedback",
      title,
      message,
      link: `/class/${classId}?tab=assignments`,
      metadata: {
        class_id: classId,
        assignment_title: assignmentTitle,
        grade,
        status,
      },
    },
    authSupabase
  );

  return notification !== null;
}

/**
 * Notify about module released
 */
export async function notifyModuleReleased(
  classId: string,
  classTitle: string,
  moduleTitle: string,
  weekNumber: number,
  learningSupabase: SupabaseClient,
  authSupabase: SupabaseClient
): Promise<number> {
  return notifyClassStudents(
    classId,
    "class",
    `New Module Available: Week ${weekNumber}`,
    `Week ${weekNumber} of ${classTitle} is now available! Module: ${moduleTitle}`,
    `/class/${classId}?tab=modules`,
    {
      module_title: moduleTitle,
      week_number: weekNumber,
    },
    learningSupabase,
    authSupabase
  );
}

/**
 * Notify about weekly class reminder
 */
export async function notifyWeeklyReminder(
  classId: string,
  classTitle: string,
  moduleTitle: string,
  weekNumber: number,
  startDate: Date,
  learningSupabase: SupabaseClient,
  authSupabase: SupabaseClient
): Promise<number> {
  const startDateStr = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return notifyClassStudents(
    classId,
    "class",
    `Weekly Class Reminder: Week ${weekNumber}`,
    `Week ${weekNumber} of ${classTitle} starts soon! Module: ${moduleTitle}. Starts: ${startDateStr}`,
    `/class/${classId}?tab=modules`,
    {
      module_title: moduleTitle,
      week_number: weekNumber,
      start_date: startDate.toISOString(),
    },
    learningSupabase,
    authSupabase
  );
}

/**
 * Notify about assignment reminder (due soon)
 */
export async function notifyAssignmentReminder(
  userId: string,
  classId: string,
  assignmentTitle: string,
  dueDate: Date,
  hoursUntilDue: number,
  authSupabase: SupabaseClient
): Promise<boolean> {
  let timeText = "";
  if (hoursUntilDue < 24) {
    timeText = "less than a day";
  } else if (hoursUntilDue < 36) {
    timeText = "about a day";
  } else {
    timeText = "2 days";
  }

  const notification = await createNotification(
    {
      userId,
      type: "assignment",
      title: `Assignment Reminder: ${assignmentTitle}`,
      message: `Assignment "${assignmentTitle}" is due in ${timeText}. Don't forget to submit!`,
      link: `/class/${classId}?tab=assignments`,
      metadata: {
        class_id: classId,
        assignment_title: assignmentTitle,
        due_date: dueDate.toISOString(),
        hours_until_due: hoursUntilDue,
      },
    },
    authSupabase
  );

  return notification !== null;
}

