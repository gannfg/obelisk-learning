import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { getCourseById, getInstructorById } from "@/lib/mock-data";

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  const course = getCourseById(id);

  if (!course) {
    notFound();
  }

  const instructor = getInstructorById(course.instructorId);
  const totalLessons = course.modules.reduce(
    (total, module) => total + module.lessons.length,
    0
  );

  // Get first lesson for "Start Learning" button
  const firstModule = course.modules[0];
  const firstLesson = firstModule?.lessons[0];
  const startUrl = firstLesson
    ? `/courses/${course.id}/${firstModule.id}/${firstLesson.id}`
    : "#";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="relative mb-6 h-64 w-full overflow-hidden rounded-lg md:h-96">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        </div>
        <h1 className="mb-4 text-4xl font-bold">{course.title}</h1>
        <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-400">
          {course.description}
        </p>
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {instructor && (
            <Link
              href={`/instructors/${instructor.id}`}
              className="flex items-center gap-3"
            >
              <Image
                src={instructor.avatar}
                alt={instructor.name}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Instructor
                </p>
                <p className="font-medium">{instructor.name}</p>
              </div>
            </Link>
          )}
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Course Content
            </p>
            <p className="font-medium">
              {course.modules.length} modules • {totalLessons} lessons
            </p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href={startUrl}>Start Learning</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex-1">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="instructor">Instructor</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <h2 className="text-2xl font-semibold">About This Course</h2>
              <div className="prose prose-zinc dark:prose-invert max-w-none">
                <p>{course.description}</p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  This comprehensive course will take you from beginner to advanced,
                  covering all the essential concepts and best practices you need to
                  master.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="modules" className="space-y-4">
              <h2 className="text-2xl font-semibold">Course Modules</h2>
              <div className="space-y-4">
                {course.modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <h3 className="mb-2 font-semibold">
                      Module {index + 1}: {module.title}
                    </h3>
                    {module.description && (
                      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {module.description}
                      </p>
                    )}
                    <p className="text-sm text-zinc-500">
                      {module.lessons.length} lesson
                      {module.lessons.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="instructor" className="space-y-4">
              <h2 className="text-2xl font-semibold">Meet Your Instructor</h2>
              {instructor && (
                <div className="flex items-start gap-4 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
                  <Image
                    src={instructor.avatar}
                    alt={instructor.name}
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-semibold">
                      {instructor.name}
                    </h3>
                    <p className="mb-3 text-zinc-600 dark:text-zinc-400">
                      {instructor.bio}
                    </p>
                    {instructor.specializations &&
                      instructor.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {instructor.specializations.map((spec) => (
                            <span
                              key={spec}
                              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        <LessonSidebar course={course} />
      </div>
    </div>
  );
}

