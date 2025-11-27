 "use client";
 
 import Link from "next/link";
 import Image from "next/image";
 import { Button } from "@/components/ui/button";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { useAuth } from "@/lib/hooks/use-auth";
 import { UserMenu } from "@/components/auth/user-menu";
 import { SearchBar } from "@/components/search-bar";
 import { ThemeToggle } from "@/components/theme-toggle";
 import { Menu, User } from "lucide-react";
 
 export function Header() {
   const { user, loading } = useAuth();
 
   return (
     <header 
       className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm safe-area-inset-top"
       style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}
     >
       <div className="container mx-auto flex h-14 sm:h-16 items-center gap-4 sm:gap-6 px-4 sm:px-6 relative">
         <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 text-base sm:text-lg font-medium truncate transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Image
              src="/logo.png"
              alt="Obelisk Learning logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-md object-contain filter dark:invert"
              priority
            />
            <span className="truncate">Obelisk Learning</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/missions"
              className="text-sm text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-105 active:scale-95"
            >
              Missions
            </Link>
            <Link
              href="/courses"
              className="text-sm text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-105 active:scale-95"
            >
              Courses
            </Link>
            <Link
              href="/instructors"
              className="text-sm text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-105 active:scale-95"
            >
              Instructors
            </Link>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block w-full max-w-md">
          <SearchBar />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          <div className="md:hidden">
            <SearchBar />
          </div>
          <ThemeToggle />
          {!loading && (
            <>
              {!user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/auth/sign-in">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/auth/sign-up">Get Started</Link>
                  </Button>
                </div>
              ) : (
                <UserMenu />
              )}
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/missions">Missions</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/courses">Courses</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/instructors">Instructors</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/sign-in">
                      <User className="mr-2 h-4 w-4" />
                      Sign In
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/sign-up">Get Started</Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

