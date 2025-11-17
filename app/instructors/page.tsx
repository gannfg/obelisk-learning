import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { mockInstructors, getCoursesByInstructor } from "@/lib/mock-data";

export default function InstructorsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">Our Instructors</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Learn from industry experts passionate about teaching.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockInstructors.map((instructor) => {
          const courses = getCoursesByInstructor(instructor.id);
          return (
            <Link key={instructor.id} href={`/instructors/${instructor.id}`}>
              <Card className="transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <Image
                      src={instructor.avatar}
                      alt={instructor.name}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                    <div>
                      <h3 className="text-xl font-semibold">
                        {instructor.name}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {courses.length} course{courses.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {instructor.specializations && instructor.specializations.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {instructor.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
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

