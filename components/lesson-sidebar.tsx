"use client";

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

interface LessonSidebarProps {
  course: Course;
}

export function LessonSidebar({ course }: LessonSidebarProps) {
  const pathname = usePathname();

  // Find which module contains the active lesson
  const activeModuleId = course.modules.find((module) =>
    module.lessons.some((lesson) => {
      const lessonPath = `/courses/${course.id}/${module.id}/${lesson.id}`;
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
                <ul className="space-y-1">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const lessonPath = `/courses/${course.id}/${module.id}/${lesson.id}`;
                    const isActive = pathname === lessonPath;
                    // TODO: Replace with actual progress tracking
                    const isCompleted = false;

                    return (
                      <li key={lesson.id}>
                        <Link
                          href={lessonPath}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-zinc-100 font-medium text-foreground dark:bg-zinc-900"
                              : "text-zinc-600 hover:bg-zinc-50 hover:text-foreground dark:text-zinc-400 dark:hover:bg-zinc-950"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                          <span>
                            {lessonIndex + 1}. {lesson.title}
                          </span>
                          {lesson.duration && (
                            <span className="ml-auto text-xs text-zinc-500">
                              {lesson.duration}m
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

