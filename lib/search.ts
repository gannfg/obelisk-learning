import { Course } from "@/types";
import { mockCourses } from "./mock-data";
import { Class, ClassWithModules } from "@/types/classes";
import { getAllClassesWithModules } from "./classes";
import { createLearningClient } from "./supabase/learning-client";

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

/**
 * Search classes (similar to searchCourses but for the new classes system)
 */
export async function searchClasses(query: string): Promise<Class[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  const learningSupabase = createLearningClient();
  
  if (!learningSupabase) {
    console.error("Supabase client not configured.");
    return [];
  }
  
  // Fetch all published classes
  const allClasses = await getAllClassesWithModules({ publishedOnly: true }, learningSupabase);

  return allClasses.filter((classItem) => {
    const titleMatch = classItem.title.toLowerCase().includes(searchTerm);
    const descriptionMatch = (classItem.description || "").toLowerCase().includes(searchTerm);
    const categoryMatch = (classItem.category || "").toLowerCase().includes(searchTerm);
    const semesterMatch = (classItem.semester || "").toLowerCase().includes(searchTerm);

    return titleMatch || descriptionMatch || categoryMatch || semesterMatch;
  });
}

