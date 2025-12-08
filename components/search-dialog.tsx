"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchCourses } from "@/lib/search";
import { Course } from "@/types";
import { getInstructorById } from "@/lib/mock-data";
import { Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Course[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (query.trim().length > 0) {
      const searchResults = searchCourses(query);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleCourseClick = (courseId: string) => {
    router.push(`/academy/courses/${courseId}`);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Classes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search by title, description, or category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          {query.trim().length > 0 && (
            <div className="max-h-[400px] overflow-y-auto">
              {results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((course) => {
                    const instructor = getInstructorById(course.instructorId);
                    return (
                      <button
                        key={course.id}
                        onClick={() => handleCourseClick(course.id)}
                        className={cn(
                          "w-full rounded-lg border border-zinc-200 p-4 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={course.thumbnail}
                              alt={course.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                              <h3 className="font-semibold">{course.title}</h3>
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                                {course.category}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                              {course.description}
                            </p>
                            {instructor && (
                              <p className="mt-1 text-xs text-zinc-500">
                                By {instructor.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="mb-4 h-12 w-12 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    No classes found
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Try a different search term
                  </p>
                </div>
              )}
            </div>
          )}
          {query.trim().length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="mb-4 h-12 w-12 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Start typing to search classes
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

