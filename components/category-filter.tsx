"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
  const selectedCategory = searchParams.get("category") as CourseCategory | null;
  const currentTab = searchParams.get("tab") || "classes";

  const updateCategory = (category: CourseCategory | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    
    // Preserve the tab parameter
    if (currentTab) {
      params.set("tab", currentTab);
    }
    
    // Update URL without page reload
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mb-12 flex flex-wrap gap-4">
      <button
        onClick={() => updateCategory(null)}
        className={cn(
          "text-sm font-medium transition-all duration-200 hover:text-foreground hover:scale-105 active:scale-95 cursor-pointer",
          !selectedCategory
            ? "text-foreground underline underline-offset-4"
            : "text-muted-foreground"
        )}
      >
        All Classes
      </button>
      {COURSE_CATEGORIES.map((category) => {
        const isActive = selectedCategory === category;
        return (
          <button
            key={category}
            onClick={() => updateCategory(category)}
            className={cn(
              "text-sm font-medium transition-all duration-200 hover:text-foreground hover:scale-105 active:scale-95 cursor-pointer",
              isActive
                ? "text-foreground underline underline-offset-4"
                : "text-muted-foreground"
            )}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

