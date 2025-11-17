"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchDialog } from "@/components/search-dialog";
import { Menu, User, Search } from "lucide-react";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-black/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Obelisk Learning</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/courses"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              Courses
            </Link>
            <Link
              href="/instructors"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              Instructors
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              Search
              <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-zinc-200 bg-zinc-100 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="sm:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              Sign In
            </Button>
            <Button size="sm" className="hidden sm:flex">
              Get Started
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="sm:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/courses">Courses</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/instructors">Instructors</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </DropdownMenuItem>
                <DropdownMenuItem>Get Started</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

