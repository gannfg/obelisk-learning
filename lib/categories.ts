import { CourseCategory } from "@/types";

export const COURSE_CATEGORIES: CourseCategory[] = [
  "Developer",
  "Design",
  "Videography / Photography",
  "Marketing",
  "Solana Integration",
];

export function getCategoryLabel(category: CourseCategory): string {
  return category;
}

export function getCategorySlug(category: CourseCategory): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}

