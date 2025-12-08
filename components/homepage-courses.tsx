"use client";

import { useEffect, useState } from "react";
import { CourseCard } from "@/components/course-card";
import { getAllCourses, CourseWithModules } from "@/lib/courses";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HomepageCourses() {
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
        // Show only first 6 courses on homepage
        setCourses(data.slice(0, 6));
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
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
              Featured Courses
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Start your Web3 learning journey with our structured courses
            </p>
          </div>
          <Link
            href="/academy?tab=courses"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              priority={index < 3} // Prioritize first 3 images
            />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/academy?tab=courses"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
          >
            View All Courses
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

