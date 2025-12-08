/**
 * Helper functions to create notifications for various events
 * These functions should be called from the application when events occur
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { createNotification, NotificationType } from "@/lib/notifications";

/**
 * Create a welcome notification for a new user
 */
export async function notifyWelcome(
  userId: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "welcome",
      title: "Welcome to Obelisk Learning! 🎉",
      message:
        "Thank you for joining our platform. Start exploring courses, projects, and connect with mentors!",
      link: "/academy",
    },
    authSupabase
  );
}

/**
 * Create a team invitation notification
 */
export async function notifyTeamInvitation(
  invitedUserId: string,
  teamId: string,
  teamName: string,
  inviterName: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId: invitedUserId,
      type: "invitation",
      title: "Team Invitation",
      message: `${inviterName} invited you to join the team "${teamName}"`,
      link: `/academy/teams/${teamId}`,
      metadata: {
        team_id: teamId,
        team_name: teamName,
        inviter_name: inviterName,
      },
    },
    authSupabase
  );
}

/**
 * Create a project invitation notification
 */
export async function notifyProjectInvitation(
  invitedUserId: string,
  projectId: string,
  projectTitle: string,
  inviterName: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId: invitedUserId,
      type: "invitation",
      title: "Project Invitation",
      message: `${inviterName} invited you to join the project "${projectTitle}"`,
      link: `/academy/projects/${projectId}`,
      metadata: {
        project_id: projectId,
        project_title: projectTitle,
        inviter_name: inviterName,
      },
    },
    authSupabase
  );
}

/**
 * Create a course completion notification
 */
export async function notifyCourseCompletion(
  userId: string,
  courseId: string,
  courseTitle: string,
  badgeName: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "course",
      title: "Course Completed! 🎉",
      message: `Congratulations! You completed the course "${courseTitle}" and earned the "${badgeName}" badge!`,
      link: `/academy/courses/${courseId}`,
      metadata: {
        course_id: courseId,
        course_title: courseTitle,
        badge_name: badgeName,
      },
    },
    authSupabase
  );
}

/**
 * Create a badge earned notification
 */
export async function notifyBadgeEarned(
  userId: string,
  courseId: string,
  courseTitle: string,
  badgeName: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "badge",
      title: "Badge Earned! 🏆",
      message: `You earned the "${badgeName}" badge for completing "${courseTitle}"!`,
      link: `/profile`,
      metadata: {
        course_id: courseId,
        course_title: courseTitle,
        badge_name: badgeName,
      },
    },
    authSupabase
  );
}

/**
 * Create a new course notification
 */
export async function notifyNewCourse(
  userId: string,
  courseId: string,
  courseTitle: string,
  courseCategory: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "course",
      title: "New Course Available! 📚",
      message: `A new course "${courseTitle}" in ${courseCategory} is now available!`,
      link: `/academy/courses/${courseId}`,
      metadata: {
        course_id: courseId,
        course_title: courseTitle,
        course_category: courseCategory,
      },
    },
    authSupabase
  );
}

/**
 * Create an assignment notification
 */
export async function notifyNewAssignment(
  userId: string,
  assignmentId: string,
  assignmentTitle: string,
  courseTitle: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "assignment",
      title: "New Assignment",
      message: `A new assignment "${assignmentTitle}" has been added to "${courseTitle}"`,
      link: `/academy/courses/${assignmentId}/assignments`,
      metadata: {
        assignment_id: assignmentId,
        assignment_title: assignmentTitle,
        course_title: courseTitle,
      },
    },
    authSupabase
  );
}

/**
 * Create a submission feedback notification
 */
export async function notifySubmissionFeedback(
  userId: string,
  submissionId: string,
  submissionTitle: string,
  reviewerName: string,
  feedbackSummary: string | null,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "submission",
      title: "Submission Reviewed",
      message: `${reviewerName} reviewed your submission "${submissionTitle}". ${feedbackSummary || "Check it out!"}`,
      link: `/dashboard?tab=submissions`,
      metadata: {
        submission_id: submissionId,
        submission_title: submissionTitle,
        reviewer_name: reviewerName,
        feedback_summary: feedbackSummary,
      },
    },
    authSupabase
  );
}

/**
 * Create a message notification
 */
export async function notifyNewMessage(
  recipientId: string,
  senderId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId: recipientId,
      type: "message",
      title: `New Message from ${senderName}`,
      message: messagePreview,
      link: `/mentor-chat?conversation=${conversationId}`,
      metadata: {
        sender_id: senderId,
        sender_name: senderName,
        conversation_id: conversationId,
      },
    },
    authSupabase
  );
}

/**
 * Create a generic notification
 */
export async function notifyGeneric(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  metadata?: Record<string, any>,
  authSupabase?: SupabaseClient
): Promise<void> {
  if (!authSupabase) {
    console.error("Auth Supabase client is required for notifications");
    return;
  }

  await createNotification(
    {
      userId,
      type,
      title,
      message,
      link,
      metadata,
    },
    authSupabase
  );
}

