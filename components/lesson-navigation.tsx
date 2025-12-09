"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { markLessonComplete, isCourseCompleted, awardCourseBadge, wouldCompleteCourse } from "@/lib/progress";
import { CourseCompletionModal } from "@/components/course-completion-modal";

interface LessonNavigationProps {
  prevLesson: { courseId: string; moduleId: string; lessonId: string } | null;
  nextLesson: { courseId: string; moduleId: string; lessonId: string } | null;
  currentCourseId: string;
  currentLessonId: string;
  backToCourseUrl: string;
  courseName: string;
  totalLessons: number;
}

export function LessonNavigation({
  prevLesson,
  nextLesson,
  currentCourseId,
  currentLessonId,
  backToCourseUrl,
  courseName,
  totalLessons,
}: LessonNavigationProps) {
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isCourseComplete, setIsCourseComplete] = useState(false);
  const [wouldComplete, setWouldComplete] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const router = useRouter();

  // Check if course is completed or if completing current lesson would complete it
  useEffect(() => {
    const checkCourseStatus = async () => {
      try {
        const authSupabase = createClient();
        if (!authSupabase) return;
        const {
          data: { user },
        } = await authSupabase.auth.getUser();

        if (user) {
          const learningSupabase = createLearningClient();
          if (!learningSupabase) return;
          
          // Check if course is already completed
          const completed = await isCourseCompleted(
            learningSupabase,
            user.id,
            currentCourseId,
            totalLessons
          );
          setIsCourseComplete(completed);

          // If not completed and we're on the last lesson, check if completing it would complete the course
          if (!completed && !nextLesson) {
            const willComplete = await wouldCompleteCourse(
              learningSupabase,
              user.id,
              currentCourseId,
              currentLessonId,
              totalLessons
            );
            setWouldComplete(willComplete);
          } else {
            setWouldComplete(false);
          }
        }
      } catch (error) {
        console.error("Error checking course status:", error);
      }
    };

    checkCourseStatus();
  }, [currentCourseId, currentLessonId, totalLessons, nextLesson]);

  const handleNextClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!nextLesson) return;
    
    e.preventDefault(); // Prevent default navigation

    // Get current user
    const authSupabase = createClient();
    if (!authSupabase) return;
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (user) {
      // Mark current lesson as complete before navigating
      setIsMarkingComplete(true);
      try {
        const learningSupabase = createLearningClient();
        if (!learningSupabase) {
          setIsMarkingComplete(false);
          return;
        }
        await markLessonComplete(
          learningSupabase,
          user.id,
          currentCourseId,
          currentLessonId
        );

        // Check if course is now completed
        const completed = await isCourseCompleted(
          learningSupabase,
          user.id,
          currentCourseId,
          totalLessons
        );

        if (completed && !isCourseComplete) {
          // Award badge (pass auth client for notifications)
          await awardCourseBadge(
            learningSupabase,
            user.id,
            currentCourseId,
            courseName,
            authSupabase
          );
          setIsCourseComplete(true);
          setShowCompletionModal(true);
          return; // Don't navigate, show modal instead
        }
      } catch (error) {
        console.error("Error marking lesson as complete:", error);
        // Continue navigation even if marking complete fails
      } finally {
        setIsMarkingComplete(false);
      }
    }

    // Navigate to next lesson
    router.push(`/academy/courses/${nextLesson.courseId}/${nextLesson.moduleId}/${nextLesson.lessonId}`);
  };

  const handleCompleteClick = async () => {
    // Get current user
    const authSupabase = createClient();
    if (!authSupabase) return;
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (user) {
      setIsMarkingComplete(true);
      try {
        const learningSupabase = createLearningClient();
        if (!learningSupabase) {
          setIsMarkingComplete(false);
          return;
        }
        
        // Mark current lesson as complete
        await markLessonComplete(
          learningSupabase,
          user.id,
          currentCourseId,
          currentLessonId
        );

        // Check if course is completed
        const completed = await isCourseCompleted(
          learningSupabase,
          user.id,
          currentCourseId,
          totalLessons
        );

        if (completed) {
          // Award badge (pass auth client for notifications)
          await awardCourseBadge(
            learningSupabase,
            user.id,
            currentCourseId,
            courseName,
            authSupabase
          );
          setShowCompletionModal(true);
        }
      } catch (error) {
        console.error("Error completing course:", error);
      } finally {
        setIsMarkingComplete(false);
      }
    }
  };

  return (
    <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
      {prevLesson ? (
        <Button asChild variant="outline">
          <Link
            href={`/academy/courses/${prevLesson.courseId}/${prevLesson.moduleId}/${prevLesson.lessonId}`}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        </Button>
      ) : (
        <div />
      )}
      {nextLesson ? (
        <Button asChild disabled={isMarkingComplete}>
          <Link
            href={`/academy/courses/${nextLesson.courseId}/${nextLesson.moduleId}/${nextLesson.lessonId}`}
            className="flex items-center gap-2"
            onClick={handleNextClick}
          >
            {isMarkingComplete ? "Marking..." : "Next"}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : isCourseComplete || wouldComplete ? (
        <Button onClick={handleCompleteClick} disabled={isMarkingComplete}>
          <Trophy className="h-4 w-4 mr-2" />
          {isMarkingComplete ? "Processing..." : "Complete Course"}
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link href={backToCourseUrl}>Back to Course</Link>
        </Button>
      )}

      <CourseCompletionModal
        open={showCompletionModal}
        onOpenChange={setShowCompletionModal}
        courseName={courseName}
        badgeName={`${courseName} Mastery`}
        backToCourseUrl={backToCourseUrl}
      />
    </div>
  );
}

