import { Course } from "@/types";
import { mockCourses } from "./mock-data";

export function searchCourses(query: string): Course[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  return mockCourses.filter((course) => {
    const titleMatch = course.title.toLowerCase().includes(searchTerm);
    const descriptionMatch = course.description.toLowerCase().includes(searchTerm);
    const categoryMatch = course.category.toLowerCase().includes(searchTerm);

    return titleMatch || descriptionMatch || categoryMatch;
  });
}

