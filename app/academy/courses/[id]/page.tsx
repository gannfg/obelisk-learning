import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { CourseActionButton } from "@/components/course-action-button";
import { getCourseById } from "@/lib/courses";
import { createLearningServerClient } from "@/lib/supabase/server";
import { getInstructorById } from "@/lib/mock-data";

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  const learningSupabase = createLearningServerClient();
  const course = await getCourseById(learningSupabase, id);

  if (!course) {
    notFound();
  }

  // Try to fetch instructor from Supabase, fallback to mock data
  let instructor;
  try {
    const { data: instructorData } = await learningSupabase
      .from("instructors")
      .select("*")
      .eq("id", course.instructorId)
      .single();
    
    if (instructorData) {
      instructor = {
        id: instructorData.id,
        name: instructorData.name,
        avatar: instructorData.avatar,
        bio: instructorData.bio,
        specializations: instructorData.specializations || [],
        socials: instructorData.socials || {},
      };
    } else {
      // Fallback to mock data
      instructor = getInstructorById(course.instructorId);
    }
  } catch (error) {
    // Fallback to mock data if Supabase fetch fails
    instructor = getInstructorById(course.instructorId);
  }
  const totalLessons = course.modules?.reduce(
    (total, module) => total + (module.lessons?.length || 0),
    0
  ) || 0;

  // Get first lesson for "Start Learning" button
  const firstModule = course.modules?.[0];
  const firstLesson = firstModule?.lessons?.[0];
  const startUrl = firstLesson && firstModule
    ? `/academy/courses/${course.id}/${firstModule.id}/${firstLesson.id}`
    : "#";

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <Link
          href="/academy"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block transition-colors"
        >
          ← Back to Academy
        </Link>
        <div className="relative mb-6 h-64 md:h-80 lg:h-96 w-full overflow-hidden rounded-lg">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        </div>
        <h1 className="mb-3 text-3xl sm:text-4xl font-bold leading-tight">{course.title}</h1>
        <p className="mb-6 text-base sm:text-lg text-muted-foreground">
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
                className="rounded-full w-12 h-12"
                unoptimized
              />
              <div>
                <p className="text-sm text-muted-foreground">
                  Instructor
                </p>
                <p className="font-medium text-base">{instructor.name}</p>
              </div>
            </Link>
          )}
          <div>
            <p className="text-sm text-muted-foreground">
              Course Content
            </p>
            <p className="font-medium text-base">
              {course.modules?.length || 0} modules • {totalLessons} lessons
            </p>
          </div>
        </div>
        <CourseActionButton
          courseId={course.id}
          totalLessons={totalLessons}
          startUrl={startUrl}
        />
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
                <p className="text-muted-foreground">
                  This comprehensive course will take you from beginner to advanced,
                  covering all the essential concepts and best practices you need to
                  master.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="modules" className="space-y-4">
              <h2 className="text-2xl font-semibold">Course Modules</h2>
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-4">
                  {course.modules.map((module, index) => (
                    <div
                      key={module.id}
                      className="rounded-lg border border-border p-4 bg-card"
                    >
                      <h3 className="mb-2 font-semibold">
                        Module {index + 1}: {module.title}
                      </h3>
                      {module.description && (
                        <p className="mb-3 text-sm text-muted-foreground">
                          {module.description}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {module.lessons?.length || 0} lesson
                        {(module.lessons?.length || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No modules available yet. Check back soon!
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="instructor" className="space-y-4">
              <h2 className="text-2xl font-semibold">Meet Your Instructor</h2>
              {instructor && (
                <div className="flex items-start gap-4 rounded-lg border border-border p-6 bg-card">
                  <Image
                    src={instructor.avatar}
                    alt={instructor.name}
                    width={80}
                    height={80}
                    className="rounded-full"
                    unoptimized
                  />
                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-semibold">
                      {instructor.name}
                    </h3>
                    <p className="mb-3 text-muted-foreground">
                      {instructor.bio}
                    </p>
                    {instructor.specializations &&
                      instructor.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {instructor.specializations.map((spec: string) => (
                            <span
                              key={spec}
                              className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
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

