"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllCourses, CourseWithModules } from "@/lib/courses";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { Loader2, ArrowRight } from "lucide-react";

export function AcademyCoursesList() {
  const [courses, setCourses] = useState<CourseWithModules[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      const supabase = createLearningClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const data = await getAllCourses(supabase);
        // Show all courses in the list
        setCourses(data);
      } catch (error) {
        console.error("Error loading courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No courses available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {courses.map((course) => {
        const lessonCount = course.modules?.reduce(
          (total, module) => total + (module.lessons?.length || 0),
          0
        ) || 0;

        return (
          <Link
            key={course.id}
            href={`/academy/courses/${course.id}`}
            className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-background/50 hover:bg-muted/50 transition-all hover:scale-[1.02]"
          >
            {/* Course Thumbnail */}
            <div className="relative w-20 h-14 sm:w-24 sm:h-16 flex-shrink-0 rounded-md overflow-hidden">
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>

            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg mb-1 truncate group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                    {course.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
                  {course.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
      
      {/* View All Link */}
      <div className="pt-4 border-t border-border">
        <Link
          href="/academy?tab=courses"
          className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
        >
          View All Courses
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

