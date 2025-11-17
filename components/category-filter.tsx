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
    <TooltipProvider>
      <div className="mb-8 flex flex-wrap gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/courses"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                !selectedCategory
                  ? "bg-foreground text-background"
                  : "bg-zinc-100 text-foreground hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              )}
            >
              All Courses
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>View all available courses</p>
          </TooltipContent>
        </Tooltip>
        {COURSE_CATEGORIES.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <Tooltip key={category}>
              <TooltipTrigger asChild>
                <Link
                  href={`/courses?category=${encodeURIComponent(category)}`}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-foreground text-background"
                      : "bg-zinc-100 text-foreground hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  )}
                >
                  {category}
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter courses by {category.toLowerCase()}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

