import { CourseCard } from "@/components/course-card";
import { CategoryFilter } from "@/components/category-filter";
import { mockCourses } from "@/lib/mock-data";
import { CourseCategory } from "@/types";

interface CoursesPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const selectedCategory = params.category as CourseCategory | undefined;

  const filteredCourses = selectedCategory
    ? mockCourses.filter((course) => course.category === selectedCategory)
    : mockCourses;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="mb-3 text-3xl sm:text-4xl font-bold">All Courses</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Explore our comprehensive collection of development courses.
        </p>
      </div>
      <CategoryFilter />
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-base text-muted-foreground">
            No courses found in this category.
          </p>
        </div>
      )}
    </div>
  );
}

