import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { mockInstructors, getCoursesByInstructor } from "@/lib/mock-data";

export default function InstructorsPage() {
  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-20 md:pb-8">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="mb-2 sm:mb-3 md:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold">Our Instructors</h1>
        <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400">
          Learn from industry experts passionate about teaching.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockInstructors.map((instructor) => {
          const courses = getCoursesByInstructor(instructor.id);
          return (
            <Link 
              key={instructor.id} 
              href={`/instructors/${instructor.id}`}
              className="block w-full"
            >
              <Card className="transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl active:scale-95 w-full cursor-pointer">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="mb-3 sm:mb-4 flex items-center gap-3 sm:gap-4">
                    <Image
                      src={instructor.avatar}
                      alt={instructor.name}
                      width={64}
                      height={64}
                      className="rounded-full w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                      unoptimized
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold leading-tight">
                        {instructor.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                        {courses.length} course{courses.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {instructor.specializations && instructor.specializations.length > 0 && (
                    <div className="mb-2 sm:mb-3 flex flex-wrap gap-1.5 sm:gap-2">
                      {instructor.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="rounded-full bg-zinc-100 px-1.5 sm:px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="line-clamp-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    {instructor.bio}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

