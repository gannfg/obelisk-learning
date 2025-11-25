"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CourseCategory } from "@/types";
import { COURSE_CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CategoryFilter() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") as CourseCategory | null;

  return (
    <div className="mb-12 flex flex-wrap gap-4">
      <Link
        href="/courses"
        className={cn(
          "text-sm font-medium transition-all duration-200 hover:opacity-70 hover:scale-105 active:scale-95",
          !selectedCategory
            ? "text-foreground"
            : "text-muted-foreground"
        )}
      >
        All Courses
      </Link>
      {COURSE_CATEGORIES.map((category) => {
        const isActive = selectedCategory === category;
        return (
          <Link
            key={category}
            href={`/courses?category=${encodeURIComponent(category)}`}
            className={cn(
              "text-sm font-medium transition-all duration-200 hover:opacity-70 hover:scale-105 active:scale-95",
              isActive
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {category}
          </Link>
        );
      })}
    </div>
  );
}

