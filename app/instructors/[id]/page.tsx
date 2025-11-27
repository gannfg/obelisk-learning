import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { getInstructorById, getCoursesByInstructor } from "@/lib/mock-data";
import { ExternalLink, Twitter, Github, Linkedin } from "lucide-react";

interface InstructorPageProps {
  params: Promise<{ id: string }>;
}

export default async function InstructorPage({ params }: InstructorPageProps) {
  const { id } = await params;
  const instructor = getInstructorById(id);

  if (!instructor) {
    notFound();
  }

  const courses = getCoursesByInstructor(id);

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-20 md:pb-8">
      <div className="mb-6 sm:mb-8 md:mb-12">
        <div className="mb-4 sm:mb-5 md:mb-6 flex flex-col items-center gap-4 sm:gap-5 md:gap-6 md:flex-row">
          <Image
            src={instructor.avatar}
            alt={instructor.name}
            width={128}
            height={128}
            className="rounded-full w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32"
            unoptimized
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="mb-2 text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">{instructor.name}</h1>
            {instructor.specializations && instructor.specializations.length > 0 && (
              <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:justify-start">
                {instructor.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="rounded-full bg-zinc-100 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}
            <p className="mb-3 sm:mb-4 text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 px-3 md:px-0">
              {instructor.bio}
            </p>
            {instructor.socials && (
              <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
                {instructor.socials.twitter && (
                  <a
                    href={`https://twitter.com/${instructor.socials.twitter.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
                  >
                    <Twitter className="h-4 w-4" />
                    {instructor.socials.twitter}
                  </a>
                )}
                {instructor.socials.github && (
                  <a
                    href={`https://github.com/${instructor.socials.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
                  >
                    <Github className="h-4 w-4" />
                    {instructor.socials.github}
                  </a>
                )}
                {instructor.socials.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${instructor.socials.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                {instructor.socials.website && (
                  <a
                    href={instructor.socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-6 sm:mb-8 md:mb-12 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-2xl sm:text-3xl font-bold">{courses.length}</div>
          <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Course{courses.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-2xl sm:text-3xl font-bold">
            {courses.reduce(
              (total, course) =>
                total +
                course.modules.reduce(
                  (modTotal, module) => modTotal + module.lessons.length,
                  0
                ),
              0
            )}
          </div>
          <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Total Lessons
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-2xl sm:text-3xl font-bold">
            {new Set(courses.map((c) => c.category)).size}
          </div>
          <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Categories
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 sm:mb-5 md:mb-6 text-xl sm:text-2xl font-semibold">
          Courses by {instructor.name}
        </h2>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            No courses available yet.
          </p>
        )}
      </div>
    </div>
  );
}

