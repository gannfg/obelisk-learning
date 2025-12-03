import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { MarkdownContent } from "@/components/markdown-content";
import { VideoPlayer } from "@/components/video-player";
import { LessonLiteIDEShell } from "@/components/lesson-lite-ide-shell";
import { QuizComponent } from "@/components/quiz-component";
import { LessonNavigation } from "@/components/lesson-navigation";
import { getCourseById } from "@/lib/courses";
import { createLearningServerClient } from "@/lib/supabase/server";

interface LessonPageProps {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id, moduleId, lessonId } = await params;
  const learningSupabase = createLearningServerClient();
  const course = await getCourseById(learningSupabase, id);

  if (!course) {
    notFound();
  }

  const module = course.modules?.find((m) => m.id === moduleId);
  if (!module) {
    notFound();
  }

  const lesson = module.lessons?.find((l) => l.id === lessonId);
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

  course.modules?.forEach((mod) => {
    mod.lessons?.forEach((les) => {
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

  // Calculate total lessons count
  const totalLessons = course.modules?.reduce(
    (total, module) => total + (module.lessons?.length || 0),
    0
  ) || 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_minmax(0,1.5fr)]">
        {/* Left: course content sidebar */}
        <div className="order-2 md:order-1 min-w-0">
          <LessonSidebar course={course} />
        </div>

        {/* Middle: lesson content */}
        <div className="order-1 md:order-2 flex-1 min-w-0">
          <div className="mb-4">
            <Link
              href={`/academy/courses/${course.id}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Course
            </Link>
          </div>

          <h1 className="mb-3 text-2xl sm:text-3xl font-bold leading-tight">{lesson.title}</h1>
          <p className="mb-6 text-base text-muted-foreground">
            {module.title}
          </p>

          {/* Determine lesson type: quiz takes priority if quizId exists */}
          {lesson.quizId ? (
            /* Quiz Lesson */
            <div className="mb-8">
              <QuizComponent quizId={lesson.quizId} lessonId={lesson.id} />
            </div>
          ) : (
            <>
              {/* Video can be shown with or without markdown */}
              {lesson.videoUrl && lesson.videoUrl.trim() && (
                <div className="mb-8">
                  <VideoPlayer url={lesson.videoUrl.trim()} />
                </div>
              )}
              
              {/* Markdown content can be shown with or without video */}
              {lesson.markdownContent && (
                <div className="mb-8">
                  <MarkdownContent content={lesson.markdownContent} />
                </div>
              )}

              {/* Show message if no content at all */}
              {!lesson.videoUrl && !lesson.markdownContent && (
                <div className="mb-8 rounded-lg border border-border bg-muted p-6">
                  <p className="text-sm text-muted-foreground">
                    This lesson doesn't have content yet. Check back soon!
                  </p>
                </div>
              )}
            </>
          )}

          {/* Navigation - automatically marks lesson as complete when clicking Next */}
          <LessonNavigation
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            currentCourseId={course.id}
            currentLessonId={lesson.id}
            backToCourseUrl={`/academy/courses/${course.id}`}
            courseName={course.title}
            totalLessons={totalLessons}
          />
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

