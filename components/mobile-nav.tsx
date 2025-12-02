"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Search, Users, User, Target, MessageCircle } from "lucide-react";
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
    href: "/missions",
    label: "Missions",
    icon: Target,
  },
  {
    href: "/academy",
    label: "Academy",
    icon: BookOpen,
  },
  {
    href: "/mentor-chat",
    label: "Mentor",
    icon: MessageCircle,
  },
  {
    href: "/search",
    label: "Search",
    icon: Search,
    isButton: true,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
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
          className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-md md:hidden safe-area-inset-top animate-in fade-in duration-200"
          onClick={() => setShowSearch(false)}
        >
          <div className="flex h-full flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-4 py-4 pt-safe bg-background/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Search</h2>
              </div>
              <button
                onClick={() => setShowSearch(false)}
                className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-95 text-2xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted"
                aria-label="Close search"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <SearchBar />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-inset-bottom"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}
      >
        <div className="flex items-center justify-between px-3 sm:px-5 pb-safe mx-auto max-w-screen-sm w-full">
          <div className="flex h-20 w-full items-center justify-between rounded-t-3xl border-t border-border bg-background/80 backdrop-blur-sm shadow-xl px-4 sm:px-5 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = 
              item.href === "/" 
                ? pathname === "/"
                : pathname === item.href || pathname?.startsWith(item.href + "/");

            // Note: All items are now always visible

            // Handle search button
            if (item.isButton) {
              const searchActive = showSearch;
              return (
                <button
                  key={item.href}
                  onClick={handleSearchClick}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-xl px-3 sm:px-4 py-2.5 flex-1 min-w-0 min-h-[64px] transition-all duration-300 ease-out",
                    "hover:scale-105 active:scale-95",
                    searchActive
                      ? "text-foreground bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  aria-label={item.label}
                >
                  <Icon className="h-6 w-6" strokeWidth={searchActive ? 2.5 : 2} />
                  <span className={cn(
                    "text-[11px] sm:text-xs font-medium leading-tight",
                    searchActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-3 sm:px-4 py-2.5 flex-1 min-w-0 min-h-[64px] transition-all duration-300 ease-out",
                  "hover:scale-105 active:scale-95",
                  isActive
                    ? "text-foreground bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                aria-label={item.label}
              >
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn(
                  "text-[11px] sm:text-xs font-medium leading-tight",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          </div>
        </div>
      </nav>
    </>
  );
}

