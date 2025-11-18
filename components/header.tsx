"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, User } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center gap-6 px-6 relative">
        <div className="flex items-center gap-6 shrink-0">
          <Link href="/" className="text-lg font-medium">
            Obelisk Learning
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/courses"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Courses
            </Link>
            <Link
              href="/instructors"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Instructors
            </Link>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block w-full max-w-md">
          <SearchBar />
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <div className="md:hidden">
            <SearchBar />
          </div>
          <ThemeToggle />
          <SignedOut>
            <div className="hidden sm:flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">
                  Get Started
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonPopoverCard: "shadow-lg",
                },
              }}
            />
          </SignedIn>
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
              <SignedOut>
                <SignInButton mode="modal">
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <User className="mr-2 h-4 w-4" />
                    Sign In
                  </DropdownMenuItem>
                </SignInButton>
                <SignUpButton mode="modal">
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Get Started
                  </DropdownMenuItem>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
              </SignedIn>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

