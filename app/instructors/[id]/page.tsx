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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-8">
        <div className="mb-6 flex flex-col items-center gap-6 md:flex-row">
          <Image
            src={instructor.avatar}
            alt={instructor.name}
            width={128}
            height={128}
            className="rounded-full w-32 h-32 object-cover object-top"
            unoptimized
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="mb-3 text-3xl sm:text-4xl font-bold leading-tight">{instructor.name}</h1>
            {instructor.specializations && instructor.specializations.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                {instructor.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}
            <p className="mb-4 text-base sm:text-lg text-muted-foreground">
              {instructor.bio}
            </p>
            {instructor.socials && (
              <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
                {instructor.socials.twitter && (
                  <a
                    href={`https://twitter.com/${instructor.socials.twitter.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted p-6">
          <div className="text-3xl font-bold">{courses.length}</div>
          <div className="text-sm text-muted-foreground">
            Class{courses.length !== 1 ? "es" : ""}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted p-6">
          <div className="text-3xl font-bold">
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
          <div className="text-sm text-muted-foreground">
            Total Lessons
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted p-6">
          <div className="text-3xl font-bold">
            {new Set(courses.map((c) => c.category)).size}
          </div>
          <div className="text-sm text-muted-foreground">
            Categories
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold">
          Classes by {instructor.name}
        </h2>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No classes available yet.
          </p>
        )}
      </div>
    </div>
  );
}

