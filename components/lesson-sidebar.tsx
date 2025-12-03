"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Course } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { getCompletedLessons } from "@/lib/progress";

interface LessonSidebarProps {
  course: Course;
}

export function LessonSidebar({ course }: LessonSidebarProps) {
  const pathname = usePathname();
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedLessons = async () => {
      try {
        // Get current user
        const authSupabase = createClient();
        const {
          data: { user },
        } = await authSupabase.auth.getUser();

        if (user) {
          const learningSupabase = createLearningClient();
          const completed = await getCompletedLessons(
            learningSupabase,
            user.id,
            course.id
          );
          setCompletedLessons(completed);
        }
      } catch (error) {
        console.error("Error fetching completed lessons:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletedLessons();
  }, [course.id, pathname]); // Refetch when course or pathname changes

  if (!course.modules || course.modules.length === 0) {
    return (
      <div className="w-full space-y-4 md:w-64">
        <div className="sticky top-20">
          <h3 className="mb-4 text-lg font-semibold">Course Content</h3>
          <p className="text-sm text-muted-foreground">
            No modules available yet.
          </p>
        </div>
      </div>
    );
  }

  // Find which module contains the active lesson
  const activeModuleId = course.modules.find((module) =>
    module.lessons?.some((lesson) => {
      const lessonPath = `/academy/courses/${course.id}/${module.id}/${lesson.id}`;
      return pathname === lessonPath;
    })
  )?.id;

  const defaultValue = activeModuleId || course.modules[0]?.id;

  return (
    <div className="w-full space-y-4 md:w-64">
      <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden">
        <h3 className="mb-4 text-lg font-semibold">Course Content</h3>
        <Accordion
          type="single"
          collapsible
          defaultValue={defaultValue}
          className="w-full"
        >
          {course.modules.map((module, moduleIndex) => (
            <AccordionItem key={module.id} value={module.id}>
              <AccordionTrigger className="text-sm font-medium">
                Module {moduleIndex + 1}: {module.title}
              </AccordionTrigger>
              <AccordionContent>
                {module.lessons && module.lessons.length > 0 ? (
                  <ul className="space-y-1">
                    {module.lessons.map((lesson, lessonIndex) => {
                    const lessonPath = `/academy/courses/${course.id}/${module.id}/${lesson.id}`;
                    const isActive = pathname === lessonPath;
                    const isCompleted = completedLessons.has(lesson.id);

                    return (
                      <li key={lesson.id}>
                        <Link
                          href={lessonPath}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-muted font-medium text-foreground"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400 fill-green-600 dark:fill-green-400" />
                          ) : (
                            <Circle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          )}
                          <span>
                            {lessonIndex + 1}. {lesson.title}
                          </span>
                          {lesson.duration && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {lesson.duration}m
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground px-3 py-2">
                    No lessons in this module yet.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

