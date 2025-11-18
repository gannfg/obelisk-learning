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
      <section className="container mx-auto px-6 py-32 text-center">
        <h1 className="mb-6 text-5xl font-medium tracking-tight md:text-6xl lg:text-7xl">
          Learn without limits
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Master modern development with expert-led courses. Start, switch, or advance your career today.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/courses">
              Start Learning
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/instructors">Instructors</Link>
          </Button>
        </div>
      </section>

      {/* Career Paths */}
      <section className="border-t border-border py-24">
        <div className="container mx-auto px-6">
          <h2 className="mb-16 text-center text-3xl font-medium md:text-4xl">
            Start, switch, or advance your career
          </h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-medium">Launch a new career</h3>
              <p className="text-sm text-muted-foreground">
                Build job-ready skills with comprehensive courses designed by industry experts.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <ArrowRight className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-medium">Change your career</h3>
              <p className="text-sm text-muted-foreground">
                Transition to tech with structured learning paths and hands-on projects.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-medium">Grow in your current role</h3>
              <p className="text-sm text-muted-foreground">
                Level up your skills with advanced courses and stay ahead of the curve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learn from Experts */}
      <section className="container mx-auto px-6 py-24">
        <h2 className="mb-16 text-center text-3xl font-medium md:text-4xl">
          Learn from expert instructors
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {mockInstructors.map((instructor) => (
            <Link
              key={instructor.id}
              href={`/instructors/${instructor.id}`}
              className="group rounded-lg border border-border bg-background p-6 transition-all hover:scale-105 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={instructor.avatar}
                  alt={instructor.name}
                  width={56}
                  height={56}
                  className="rounded-full"
                  unoptimized
                />
                <div>
                  <h3 className="font-medium">
                    {instructor.name}
                  </h3>
                  {instructor.specializations && (
                    <p className="text-xs text-muted-foreground">
                      {instructor.specializations.join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {instructor.bio}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="border-t border-border py-24">
        <div className="container mx-auto px-6">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-3xl font-medium md:text-4xl">Featured Courses</h2>
            <Button asChild variant="ghost">
              <Link href="/courses">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
      <section className="container mx-auto px-6 py-24">
        <h2 className="mb-16 text-center text-3xl font-medium md:text-4xl">
          Explore categories
        </h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {COURSE_CATEGORIES.map((category) => {
            const categoryCourses = mockCourses.filter(
              (c) => c.category === category
            );
            return (
              <Link
                key={category}
                href={`/courses?category=${encodeURIComponent(category)}`}
                className="group rounded-lg border border-border bg-background p-6 text-center transition-all hover:scale-105 hover:shadow-md"
              >
                <h3 className="mb-2 text-sm font-medium">
                  {category}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {categoryCourses.length} course
                  {categoryCourses.length !== 1 ? "s" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Why Choose Obelisk Learning */}
      <section className="border-t border-border py-24">
        <div className="container mx-auto px-6">
          <h2 className="mb-16 text-center text-3xl font-medium md:text-4xl">
            Why people choose Obelisk Learning
          </h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-lg font-medium">Expert-Led Content</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Learn from industry professionals with real-world experience and proven track records.
              </p>
            </div>
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Clock className="h-5 w-5" />
                <h3 className="text-lg font-medium">Learn at Your Pace</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Access courses anytime, anywhere. Study on your schedule with lifetime access to materials.
              </p>
            </div>
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Award className="h-5 w-5" />
                <h3 className="text-lg font-medium">Practical Skills</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Build real projects and gain hands-on experience with practical, job-ready skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-32 text-center">
        <h2 className="mb-4 text-4xl font-medium md:text-5xl">
          Ready to start learning?
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">
          Join thousands of learners building their skills with Obelisk Learning.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/courses">Browse All Courses</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/instructors">Instructors</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
