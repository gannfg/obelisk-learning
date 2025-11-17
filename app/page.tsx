import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { getFeaturedCourses } from "@/lib/mock-data";

export default function Home() {
  const featuredCourses = getFeaturedCourses();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl">
          Master Modern Development
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-zinc-600 dark:text-zinc-400">
          Learn from expert instructors with comprehensive courses on Next.js,
          React, and cutting-edge web technologies.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/courses">Browse Courses</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/instructors">Meet Instructors</Link>
          </Button>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-black">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-3xl font-bold">Featured Courses</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Obelisk Learning */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Why Obelisk Learning?
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-4 text-4xl">🎓</div>
            <h3 className="mb-2 text-xl font-semibold">Expert Instructors</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Learn from industry professionals with years of real-world
              experience.
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 text-4xl">📚</div>
            <h3 className="mb-2 text-xl font-semibold">
              Comprehensive Content
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Structured courses with hands-on projects and practical examples.
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 text-4xl">⚡</div>
            <h3 className="mb-2 text-xl font-semibold">Learn at Your Pace</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Access courses anytime, anywhere. Track your progress and learn on
              your schedule.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
