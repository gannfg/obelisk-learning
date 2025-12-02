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
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid gap-6 md:gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_minmax(0,1.5fr)]">
        {/* Left: course content sidebar */}
        <div className="order-2 md:order-1 min-w-0">
          <LessonSidebar course={course} />
        </div>

        {/* Middle: lesson content */}
        <div className="order-1 md:order-2 flex-1 min-w-0">
          <div className="mb-4">
            <Link
              href={`/courses/${course.id}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Course
            </Link>
          </div>

          <h1 className="mb-3 text-2xl sm:text-3xl font-bold leading-tight">{lesson.title}</h1>
          <p className="mb-6 text-base text-muted-foreground">
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
          <div className="mb-8 rounded-lg border border-border bg-muted p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Progress tracking will be implemented with Supabase integration.
            </p>
            <Button size="sm">
              Mark as Complete
            </Button>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
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

