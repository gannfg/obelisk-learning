import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { MarkdownContent } from "@/components/markdown-content";
import { VideoPlayer } from "@/components/video-player";
import { LessonLiteIDEShell } from "@/components/lesson-lite-ide-shell";
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
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-20 md:pb-8">
      <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_minmax(0,1.5fr)]">
        {/* Left: course content sidebar */}
        <div className="order-2 md:order-1 min-w-0">
          <LessonSidebar course={course} />
        </div>

        {/* Middle: lesson content */}
        <div className="order-1 md:order-2 flex-1 min-w-0">
          <div className="mb-4 sm:mb-5 md:mb-6">
            <Link
              href={`/courses/${course.id}`}
              className="text-xs sm:text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
            >
              ← Back to Course
            </Link>
          </div>

          <h1 className="mb-2 text-xl sm:text-2xl md:text-3xl font-bold leading-tight">{lesson.title}</h1>
          <p className="mb-4 sm:mb-5 md:mb-6 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            {module.title}
          </p>

          {lesson.videoUrl && (
            <div className="mb-6 sm:mb-7 md:mb-8">
              <VideoPlayer url={lesson.videoUrl} />
            </div>
          )}

          {lesson.markdownContent && (
            <div className="mb-6 sm:mb-7 md:mb-8">
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
          <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
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

        {/* Right: Lite IDE (collapsible) */}
        <LessonLiteIDEShell
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          lessonContent={lesson.markdownContent || ""}
          initialFiles={{
            "index.js":
              lesson.markdownContent
                ? "// Try out the ideas from this lesson here.\nconsole.log('Hello from this lesson!');"
                : "// Start coding here...\nconsole.log('Hello, World!');",
          }}
        />
      </div>
    </div>
  );
}

