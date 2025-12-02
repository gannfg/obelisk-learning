import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { getFeaturedCourses, mockCourses, mockInstructors } from "@/lib/mock-data";
import { COURSE_CATEGORIES } from "@/lib/categories";
import { ArrowRight, CheckCircle2, Users, Award, Clock, Target, Code2, Sparkles } from "lucide-react";

export default function Home() {
  const featuredCourses = getFeaturedCourses();

  return (
    <div className="flex flex-col pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="container mx-auto px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-24 lg:py-32 text-center">
        <h1 className="mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium tracking-tight">
          Learn without limits
        </h1>
        <p className="mx-auto mb-8 sm:mb-10 md:mb-12 max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground px-3">
          Master modern development with expert-led courses. Start, switch, or advance your career today.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row px-3">
          <Button asChild size="lg" className="gap-2 w-full sm:w-auto text-sm sm:text-base h-10 sm:h-11">
            <Link href="/missions">
              <Target className="h-4 w-4 sm:h-5 sm:w-5" />
              Start Mission
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 w-full sm:w-auto text-sm sm:text-base h-10 sm:h-11">
            <Link href="/academy">
              Browse Academy
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto text-sm sm:text-base h-10 sm:h-11">
            <Link href="/instructors">Instructors</Link>
          </Button>
        </div>
      </section>

      {/* Career Paths */}
      <section className="border-t border-border py-8 sm:py-12 md:py-16 lg:py-24">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <h2 className="mb-8 sm:mb-12 md:mb-16 text-center text-2xl sm:text-3xl md:text-4xl font-medium">
            Start, switch, or advance your career
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:gap-10 md:gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 sm:mb-5 md:mb-6 flex justify-center">
                <Award className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-medium">Launch a new career</h3>
              <p className="text-xs sm:text-sm text-muted-foreground px-3">
                Build job-ready skills with comprehensive courses designed by industry experts.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 sm:mb-5 md:mb-6 flex justify-center">
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-medium">Change your career</h3>
              <p className="text-xs sm:text-sm text-muted-foreground px-3">
                Transition to tech with structured learning paths and hands-on projects.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 sm:mb-5 md:mb-6 flex justify-center">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-medium">Grow in your current role</h3>
              <p className="text-xs sm:text-sm text-muted-foreground px-3">
                Level up your skills with advanced courses and stay ahead of the curve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learn from Experts */}
      <section className="container mx-auto px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
        <h2 className="mb-8 sm:mb-12 md:mb-16 text-center text-2xl sm:text-3xl md:text-4xl font-medium">
          Learn from expert instructors
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 md:grid-cols-3">
          {mockInstructors.map((instructor) => (
            <Link
              key={instructor.id}
              href={`/instructors/${instructor.id}`}
              className="block rounded-lg border border-border bg-background p-4 sm:p-5 md:p-6 transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl hover:-translate-y-1 active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                <Image
                  src={instructor.avatar}
                  alt={instructor.name}
                  width={56}
                  height={56}
                  className="rounded-full w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                  unoptimized
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base md:text-lg leading-tight">
                    {instructor.name}
                  </h3>
                  {instructor.specializations && (
                    <p className="text-xs text-muted-foreground truncate">
                      {instructor.specializations.join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground">
                {instructor.bio}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Try Missions */}
      <section className="border-t border-border py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full mb-3 sm:mb-4">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">New Feature</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-3 sm:mb-4">
              Learn by doing with Interactive Missions
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-3">
              Hands-on coding missions with live preview, AI assistance, and instant feedback. 
              No setup required - code, run, and learn all in your browser.
            </p>
            <Button asChild size="lg" className="gap-2 text-sm sm:text-base h-10 sm:h-11">
              <Link href="/missions">
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                Explore Missions
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="border-t border-border py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="mb-8 sm:mb-10 md:mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium">Featured Courses</h2>
            <Button asChild variant="ghost" className="text-xs sm:text-sm h-8 sm:h-9 md:h-10">
              <Link href="/academy">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
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
      <section className="container mx-auto px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
        <h2 className="mb-8 sm:mb-12 md:mb-16 text-center text-2xl sm:text-3xl md:text-4xl font-medium">
          Explore categories
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-5">
          {COURSE_CATEGORIES.map((category) => {
            const categoryCourses = mockCourses.filter(
              (c) => c.category === category
            );
            return (
              <Link
                key={category}
                href={`/academy?category=${encodeURIComponent(category)}&tab=courses`}
                className="block rounded-lg border border-border bg-background p-3 sm:p-4 md:p-6 text-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl hover:-translate-y-1 active:scale-95 cursor-pointer"
              >
                <h3 className="mb-1 sm:mb-2 text-xs sm:text-sm font-medium">
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
      <section className="border-t border-border py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <h2 className="mb-8 sm:mb-12 md:mb-16 text-center text-2xl sm:text-3xl md:text-4xl font-medium">
            Why people choose Obelisk Learning
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:gap-10 md:gap-12 md:grid-cols-3">
            <div>
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <h3 className="text-base sm:text-lg font-medium">Expert-Led Content</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Learn from industry professionals with real-world experience and proven track records.
              </p>
            </div>
            <div>
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <h3 className="text-base sm:text-lg font-medium">Learn at Your Pace</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Access courses anytime, anywhere. Study on your schedule with lifetime access to materials.
              </p>
            </div>
            <div>
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                <h3 className="text-base sm:text-lg font-medium">Practical Skills</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
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
            <Link href="/academy">Browse Academy</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/instructors">Instructors</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
