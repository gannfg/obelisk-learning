import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { MarkdownContent } from "@/components/markdown-content";
import { VideoPlayer } from "@/components/video-player";
import { getCourseById } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LessonPageProps {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id, moduleId, lessonId } = await params;
  const course = getCourseById(id);

  if (!course) {
    notFound();
  }

  const module = course.modules.find((m) => m.id === moduleId);
  if (!module) {
    notFound();
  }

  const lesson = module.lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    notFound();
  }

  // Find previous and next lessons
  let prevLesson: { courseId: string; moduleId: string; lessonId: string } | null = null;
  let nextLesson: { courseId: string; moduleId: string; lessonId: string } | null = null;

  const allLessons: Array<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }> = [];

  course.modules.forEach((mod) => {
    mod.lessons.forEach((les) => {
      allLessons.push({
        courseId: course.id,
        moduleId: mod.id,
        lessonId: les.id,
      });
    });
  });

  const currentIndex = allLessons.findIndex(
    (l) => l.moduleId === moduleId && l.lessonId === lessonId
  );

  if (currentIndex > 0) {
    prevLesson = allLessons[currentIndex - 1];
  }
  if (currentIndex < allLessons.length - 1) {
    nextLesson = allLessons[currentIndex + 1];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex-1">
          <div className="mb-6">
            <Link
              href={`/courses/${course.id}`}
              className="text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
            >
              ← Back to Course
            </Link>
          </div>

          <h1 className="mb-2 text-3xl font-bold">{lesson.title}</h1>
          <p className="mb-6 text-zinc-600 dark:text-zinc-400">
            {module.title}
          </p>

          {lesson.videoUrl && (
            <div className="mb-8">
              <VideoPlayer url={lesson.videoUrl} />
            </div>
          )}

          {lesson.markdownContent && (
            <div className="mb-8">
              <MarkdownContent content={lesson.markdownContent} />
            </div>
          )}

          {/* Progress Placeholder */}
          <div className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Progress tracking will be implemented with Supabase integration.
            </p>
            <Button className="mt-2" size="sm">
              Mark as Complete
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
            {prevLesson ? (
              <Button asChild variant="outline">
                <Link
                  href={`/courses/${prevLesson.courseId}/${prevLesson.moduleId}/${prevLesson.lessonId}`}
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
              <Button asChild>
                <Link
                  href={`/courses/${nextLesson.courseId}/${nextLesson.moduleId}/${nextLesson.lessonId}`}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href={`/courses/${course.id}`}>Back to Course</Link>
              </Button>
            )}
          </div>
        </div>

        <LessonSidebar course={course} />
      </div>
    </div>
  );
}

