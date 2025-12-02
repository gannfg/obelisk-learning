"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { searchCourses } from "@/lib/search";
import { Course } from "@/types";
import { getInstructorById } from "@/lib/mock-data";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Course[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.trim().length > 0) {
      const searchResults = searchCourses(query);
      setResults(searchResults);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleCourseClick = (courseId: string) => {
    router.push(`/academy/courses/${courseId}`);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search courses..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            // Delay to allow click events on results
            setTimeout(() => {
              setIsOpen(false);
            }, 200);
          }}
          className="pl-10 pr-4"
        />
        {query.length === 0 && (
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        )}
      </div>
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-lg border border-border bg-background shadow-lg">
          <div className="max-h-96 overflow-y-auto p-2">
            {results.length > 0 ? (
              <div className="space-y-1">
                {results.map((course) => {
                  const instructor = getInstructorById(course.instructorId);
                  return (
                    <button
                      key={course.id}
                      onClick={() => handleCourseClick(course.id)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      className={cn(
                        "w-full rounded-md border border-transparent p-3 text-left transition-all duration-200 hover:bg-muted hover:border-border hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                          <Image
                            src={course.thumbnail}
                            alt={course.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="text-sm font-medium">{course.title}</h3>
                            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {course.category}
                            </span>
                          </div>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {course.description}
                          </p>
                          {instructor && (
                            <p className="mt-1 text-xs text-muted-foreground">
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
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No courses found
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a different search term
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

