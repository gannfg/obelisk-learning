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
      title: "Welcome to Superteam Study! 🎉",
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
      title: `You received a message`,
      message: `${senderName}: ${messagePreview}`,
      link: `/messages/${conversationId}`,
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
 * Create a project submitted notification
 */
export async function notifyProjectSubmitted(
  userId: string,
  missionId: string,
  missionTitle: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "project",
      title: "Project Submitted! ✅",
      message: `Your project for "${missionTitle}" has been submitted and is now under review.`,
      link: `/missions/${missionId}`,
      metadata: {
        mission_id: missionId,
        mission_title: missionTitle,
      },
    },
    authSupabase
  );
}

/**
 * Create a project reviewed notification
 */
export async function notifyProjectReviewed(
  userId: string,
  missionId: string,
  missionTitle: string,
  status: "approved" | "changes_requested",
  reviewerName: string,
  feedbackSummary: string | null,
  authSupabase: SupabaseClient
): Promise<void> {
  const statusMessage =
    status === "approved"
      ? "Your project has been approved! Great work! 🎉"
      : "Your project needs some changes. Please review the feedback.";

  await createNotification(
    {
      userId,
      type: "project",
      title: status === "approved" ? "Project Approved! 🎉" : "Project Review Complete",
      message: `${reviewerName} reviewed your project for "${missionTitle}". ${statusMessage} ${feedbackSummary ? `Feedback: ${feedbackSummary}` : ""}`,
      link: `/missions/${missionId}`,
      metadata: {
        mission_id: missionId,
        mission_title: missionTitle,
        status,
        reviewer_name: reviewerName,
        feedback_summary: feedbackSummary,
      },
    },
    authSupabase
  );
}

/**
 * Create a level up notification
 */
export async function notifyLevelUp(
  userId: string,
  newLevel: number,
  totalXP: number,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "achievement",
      title: `Level Up! 🎉 Level ${newLevel}`,
      message: `Congratulations! You've reached Level ${newLevel} with ${totalXP.toLocaleString()} XP! Keep up the great work!`,
      link: "/achievements",
      metadata: {
        level: newLevel,
        total_xp: totalXP,
      },
    },
    authSupabase
  );
}

/**
 * Create an XP milestone notification
 */
export async function notifyXPMilestone(
  userId: string,
  milestoneXP: number,
  totalXP: number,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "achievement",
      title: `XP Milestone Reached! 🏆`,
      message: `Amazing! You've reached ${milestoneXP.toLocaleString()} XP! You now have ${totalXP.toLocaleString()} total XP.`,
      link: "/achievements",
      metadata: {
        milestone_xp: milestoneXP,
        total_xp: totalXP,
      },
    },
    authSupabase
  );
}

/**
 * Create a course enrollment notification
 */
export async function notifyCourseEnrollment(
  userId: string,
  courseId: string,
  courseTitle: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "course",
      title: "Course Enrolled! 📚",
      message: `You've successfully enrolled in "${courseTitle}". Start learning now!`,
      link: `/academy/courses/${courseId}`,
      metadata: {
        course_id: courseId,
        course_title: courseTitle,
      },
    },
    authSupabase
  );
}

/**
 * Create a class enrollment notification
 */
export async function notifyClassEnrollment(
  userId: string,
  classId: string,
  className: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "class",
      title: "Class Enrolled! 🎓",
      message: `You've successfully enrolled in "${className}". Welcome to the class!`,
      link: `/class/${classId}`,
      metadata: {
        class_id: classId,
        class_name: className,
      },
    },
    authSupabase
  );
}

/**
 * Create a mission completion notification
 */
export async function notifyMissionCompletion(
  userId: string,
  missionId: string,
  missionTitle: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "achievement",
      title: "Mission Completed! ✅",
      message: `Congratulations! You've completed the mission "${missionTitle}". Great work!`,
      link: `/missions/${missionId}`,
      metadata: {
        mission_id: missionId,
        mission_title: missionTitle,
      },
    },
    authSupabase
  );
}

/**
 * Create a mission approved notification (when submission is approved)
 */
export async function notifyMissionApproved(
  userId: string,
  missionId: string,
  missionTitle: string,
  authSupabase: SupabaseClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type: "achievement",
      title: "Mission Approved! 🎉",
      message: `Your submission for "${missionTitle}" has been approved! Mission completed successfully!`,
      link: `/missions/${missionId}`,
      metadata: {
        mission_id: missionId,
        mission_title: missionTitle,
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

