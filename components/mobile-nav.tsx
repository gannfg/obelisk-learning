"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Search, Users, User } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { SearchBar } from "@/components/search-bar";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/courses",
    label: "Courses",
    icon: BookOpen,
  },
  {
    href: "/search",
    label: "Search",
    icon: Search,
    isButton: true,
  },
  {
    href: "/instructors",
    label: "Instructors",
    icon: Users,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: User,
    requiresAuth: true,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSearch(true);
  };

  return (
    <>
      {/* Search Modal */}
      {showSearch && (
        <div 
          className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm md:hidden safe-area-inset-top"
          onClick={() => setShowSearch(false)}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-4 pt-safe">
              <h2 className="text-lg font-medium">Search</h2>
              <button
                onClick={() => setShowSearch(false)}
                className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-95 text-2xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close search"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <SearchBar />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-inset-bottom border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-around px-4 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = 
              item.href === "/" 
                ? pathname === "/"
                : pathname === item.href || pathname?.startsWith(item.href + "/");

            // Only show auth-required items if user is signed in and loaded
            if (item.requiresAuth) {
              if (loading || !user) {
                return null;
              }
            }

            // Handle search button
            if (item.isButton) {
              const searchActive = showSearch;
              return (
                <button
                  key={item.href}
                  onClick={handleSearchClick}
                  className={cn(
                    "flex items-center justify-center rounded-md p-2 min-w-[44px] min-h-[44px] transition-all duration-200 hover:scale-110 active:scale-95",
                    searchActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={item.label}
                >
                  <Icon className="h-5 w-5" strokeWidth={searchActive ? 2.5 : 2} />
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center rounded-md p-2 min-w-[44px] min-h-[44px] transition-all duration-200 hover:scale-110 active:scale-95",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

