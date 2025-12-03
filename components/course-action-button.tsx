"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { isCourseCompleted } from "@/lib/progress";
import { BookOpen, RotateCcw } from "lucide-react";

interface CourseActionButtonProps {
  courseId: string;
  totalLessons: number;
  startUrl: string;
}

export function CourseActionButton({
  courseId,
  totalLessons,
  startUrl,
}: CourseActionButtonProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkCompletion = async () => {
      try {
        const authSupabase = createClient();
        const {
          data: { user },
        } = await authSupabase.auth.getUser();

        if (user && totalLessons > 0) {
          const learningSupabase = createLearningClient();
          const completed = await isCourseCompleted(
            learningSupabase,
            user.id,
            courseId,
            totalLessons
          );
          setIsCompleted(completed);
        }
      } catch (error) {
        console.error("Error checking course completion:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkCompletion();
  }, [courseId, totalLessons]);

  if (isLoading) {
    return (
      <Button size="lg" disabled className="h-12 px-8 text-base">
        Loading...
      </Button>
    );
  }

  if (startUrl === "#") {
    return (
      <Button size="lg" disabled className="h-12 px-8 text-base">
        No lessons available yet
      </Button>
    );
  }

  if (isCompleted) {
    return (
      <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
        <Link href={startUrl} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Review Course
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild size="lg" className="h-12 px-8 text-base">
      <Link href={startUrl} className="flex items-center gap-2">
        <BookOpen className="h-4 w-4" />
        Start Learning
      </Link>
    </Button>
  );
}

