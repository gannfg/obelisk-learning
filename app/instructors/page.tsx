import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { mockInstructors, getCoursesByInstructor } from "@/lib/mock-data";

export default function InstructorsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="mb-3 text-3xl sm:text-4xl font-bold">Our Instructors</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Learn from industry experts passionate about teaching.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockInstructors.map((instructor) => {
          const courses = getCoursesByInstructor(instructor.id);
          return (
            <Link 
              key={instructor.id} 
              href={`/instructors/${instructor.id}`}
              className="block w-full"
            >
              <Card className="transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl active:scale-95 w-full cursor-pointer">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <Image
                      src={instructor.avatar}
                      alt={instructor.name}
                      width={64}
                      height={64}
                      className="rounded-full w-16 h-16 object-cover object-top"
                      unoptimized
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold leading-tight">
                        {instructor.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {courses.length} course{courses.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {instructor.specializations && instructor.specializations.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {instructor.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="line-clamp-3 text-sm text-muted-foreground">
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

