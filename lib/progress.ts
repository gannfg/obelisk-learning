import { SupabaseClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notifications";

/**
 * Get all completed lesson IDs for a user in a course
 */
export async function getCompletedLessons(
  supabaseClient: SupabaseClient<any>,
  userId: string,
  courseId: string
): Promise<Set<string>> {
  try {
    const { data, error } = await supabaseClient
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("completed", true);

    if (error) {
      console.error("Error fetching completed lessons:", error);
      return new Set();
    }

    return new Set(data?.map((item) => item.lesson_id) || []);
  } catch (error) {
    console.error("Unexpected error fetching completed lessons:", error);
    return new Set();
  }
}

/**
 * Check if a course is completed (all lessons done)
 */
export async function isCourseCompleted(
  supabaseClient: SupabaseClient<any>,
  userId: string,
  courseId: string,
  totalLessons: number
): Promise<boolean> {
  try {
    const completedLessons = await getCompletedLessons(supabaseClient, userId, courseId);
    return completedLessons.size >= totalLessons && totalLessons > 0;
  } catch (error) {
    console.error("Error checking course completion:", error);
    return false;
  }
}

/**
 * Check if completing the current lesson would complete the course
 * (i.e., all other lessons are already completed)
 */
export async function wouldCompleteCourse(
  supabaseClient: SupabaseClient<any>,
  userId: string,
  courseId: string,
  currentLessonId: string,
  totalLessons: number
): Promise<boolean> {
  try {
    const completedLessons = await getCompletedLessons(supabaseClient, userId, courseId);
    // Check if all lessons except the current one are completed
    const otherLessonsCompleted = completedLessons.has(currentLessonId)
      ? completedLessons.size >= totalLessons
      : completedLessons.size >= totalLessons - 1;
    return otherLessonsCompleted && totalLessons > 0;
  } catch (error) {
    console.error("Error checking if course would be completed:", error);
    return false;
  }
}

/**
 * Award a completion badge for a course
 * @param supabaseClient - Learning Supabase client (for badges table)
 * @param authSupabaseClient - Auth Supabase client (for notifications)
 */
export async function awardCourseBadge(
  supabaseClient: SupabaseClient<any>,
  userId: string,
  courseId: string,
  courseName: string,
  authSupabaseClient?: SupabaseClient<any>
): Promise<boolean> {
  try {
    const badgeName = `${courseName} Mastery`;
    
    const { error } = await supabaseClient
      .from("badges")
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          badge_name: badgeName,
        },
        {
          onConflict: "user_id,course_id",
        }
      );

    if (error) {
      console.error("Error awarding badge:", error);
      return false;
    }

    // Create notification if auth client is provided
    if (authSupabaseClient) {
      try {
        await createNotification(
          {
            userId,
            type: "badge",
            title: "Badge Earned! 🏆",
            message: `You earned the "${badgeName}" badge for completing "${courseName}"!`,
            link: `/profile`,
            metadata: {
              course_id: courseId,
              course_name: courseName,
              badge_name: badgeName,
            },
          },
          authSupabaseClient
        );

        // Also create course completion notification
        await createNotification(
          {
            userId,
            type: "course",
            title: "Course Completed! 🎉",
            message: `Congratulations! You completed the course "${courseName}" and earned the "${badgeName}" badge!`,
            link: `/academy/courses/${courseId}`,
            metadata: {
              course_id: courseId,
              course_name: courseName,
              badge_name: badgeName,
            },
          },
          authSupabaseClient
        );
      } catch (notifError) {
        console.error("Error creating completion notification:", notifError);
        // Don't fail badge award if notification fails
      }
    }

    return true;
  } catch (error) {
    console.error("Unexpected error awarding badge:", error);
    return false;
  }
}

/**
 * Mark a lesson as complete for a user
 */
export async function markLessonComplete(
  supabaseClient: SupabaseClient<any>,
  userId: string,
  courseId: string,
  lessonId: string
): Promise<boolean> {
  try {
    // First, ensure course progress exists
    const { data: courseProgress, error: courseProgressError } = await supabaseClient
      .from("course_progress")
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          last_accessed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,course_id",
        }
      )
      .select("id")
      .single();

    if (courseProgressError && courseProgressError.code !== "23505") {
      // 23505 is unique constraint violation, which is fine
      console.error("Error creating/updating course progress:", courseProgressError);
    }

    // Mark lesson as complete
    const { error: lessonProgressError } = await supabaseClient
      .from("lesson_progress")
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,lesson_id",
        }
      );

    if (lessonProgressError) {
      console.error("Error marking lesson as complete:", lessonProgressError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error marking lesson as complete:", error);
    return false;
  }
}

