import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";
import { CourseWithModules } from "@/lib/courses";

interface HorizontalCourseCardProps {
  course: CourseWithModules;
}

export function HorizontalCourseCard({ course }: HorizontalCourseCardProps) {
  // Calculate total lessons
  const totalLessons = course.modules?.reduce(
    (total, module) => total + (module.lessons?.length || 0),
    0
  ) || 0;

  return (
    <Link
      href={`/academy/courses/${course.id}`}
      className="group block w-full"
    >
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-300 hover:shadow-md">
        {/* Thumbnail */}
        {course.thumbnail ? (
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden">
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, 128px"
            />
          </div>
        ) : (
          <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-primary/50" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg sm:text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {course.description}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {course.category && (
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                {course.category}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

