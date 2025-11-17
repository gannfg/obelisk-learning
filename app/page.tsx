import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { getFeaturedCourses, mockCourses, mockInstructors } from "@/lib/mock-data";
import { COURSE_CATEGORIES } from "@/lib/categories";
import { ArrowRight, CheckCircle2, Users, Award, Clock } from "lucide-react";

export default function Home() {
  const featuredCourses = getFeaturedCourses();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          Learn without limits
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-zinc-600 dark:text-zinc-400 md:text-2xl">
          Master modern development with expert-led courses. Start, switch, or advance your career today.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="text-base">
            <Link href="/courses">
              Start Learning Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <Link href="/instructors">Explore Instructors</Link>
          </Button>
        </div>
      </section>

      {/* Career Paths */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-black">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            Start, switch, or advance your career
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center transition-all hover:scale-105 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
                  <Award className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Launch a new career</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Build job-ready skills with comprehensive courses designed by industry experts.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center transition-all hover:scale-105 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                  <ArrowRight className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Change your career</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Transition to tech with structured learning paths and hands-on projects.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center transition-all hover:scale-105 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-purple-100 p-4 dark:bg-purple-900/30">
                  <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Grow in your current role</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Level up your skills with advanced courses and stay ahead of the curve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learn from Experts */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
          Learn from expert instructors
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {mockInstructors.map((instructor) => (
            <Link
              key={instructor.id}
              href={`/instructors/${instructor.id}`}
              className="group rounded-lg border border-zinc-200 bg-white p-6 transition-all hover:scale-105 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="mb-4 flex items-center gap-4">
                <Image
                  src={instructor.avatar}
                  alt={instructor.name}
                  width={64}
                  height={64}
                  className="rounded-full"
                  unoptimized
                />
                <div>
                  <h3 className="font-semibold group-hover:text-foreground">
                    {instructor.name}
                  </h3>
                  {instructor.specializations && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {instructor.specializations.join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                {instructor.bio}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold md:text-4xl">Featured Courses</h2>
            <Button asChild variant="ghost">
              <Link href="/courses">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Explore Categories */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
          Explore categories
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {COURSE_CATEGORIES.map((category) => {
            const categoryCourses = mockCourses.filter(
              (c) => c.category === category
            );
            return (
              <Link
                key={category}
                href={`/courses?category=${encodeURIComponent(category)}`}
                className="group rounded-lg border border-zinc-200 bg-white p-6 text-center transition-all hover:scale-105 hover:border-foreground hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h3 className="mb-2 font-semibold group-hover:text-foreground">
                  {category}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {categoryCourses.length} course
                  {categoryCourses.length !== 1 ? "s" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Why Choose Obelisk Learning */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-black">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            Why people choose Obelisk Learning
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-8 transition-all hover:scale-105 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold">Expert-Led Content</h3>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Learn from industry professionals with real-world experience and proven track records.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-8 transition-all hover:scale-105 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold">Learn at Your Pace</h3>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Access courses anytime, anywhere. Study on your schedule with lifetime access to materials.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-8 transition-all hover:scale-105 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold">Practical Skills</h3>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Build real projects and gain hands-on experience with practical, job-ready skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h2 className="mb-4 text-4xl font-bold md:text-5xl">
          Ready to start learning?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Join thousands of learners building their skills with Obelisk Learning.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="text-base">
            <Link href="/courses">
              Browse All Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <Link href="/instructors">Meet Our Instructors</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
