import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Course } from "@/types";
import { getInstructorById } from "@/lib/mock-data";

interface CourseCardProps {
  course: Course;
  priority?: boolean;
}

export function CourseCard({ course, priority }: CourseCardProps) {
  const instructor = getInstructorById(course.instructorId);

  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="group overflow-hidden transition-all hover:scale-105">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <CardContent className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {course.category}
            </span>
          </div>
          <h3 className="mb-2 text-xl font-semibold">{course.title}</h3>
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>
          {instructor && (
            <p className="text-sm text-muted-foreground">
              By {instructor.name}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <span className="text-sm font-medium text-foreground">
            {course.modules.reduce(
              (total, module) => total + module.lessons.length,
              0
            )}{" "}
            lessons
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

