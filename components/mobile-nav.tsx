"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Target, Calendar, User, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/academy",
    label: "Academy",
    icon: BookOpen,
  },
  {
    href: "/missions",
    label: "Mission",
    icon: Target,
  },
  {
    href: "/workshops",
    label: "Workshop",
    icon: Calendar,
  },
  {
    href: "/social",
    label: "Social",
    icon: Users,
  },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageSquare,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-center px-2 mx-auto max-w-screen-sm w-full">
        <div className="flex h-16 w-full items-center justify-between rounded-t-2xl border-t border-border bg-background/95 backdrop-blur-md shadow-2xl px-2 py-2 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = 
              item.href === "/" 
                ? pathname === "/"
                : pathname === item.href || pathname?.startsWith(item.href + "/");
            
            // Only the active tab is expanded
            const isExpanded = isActive;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center justify-center gap-2.5 rounded-xl transition-all duration-300 ease-in-out",
                  "hover:scale-105 active:scale-95",
                  isActive
                    ? "text-foreground bg-primary/10 py-2.5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  // Width transition: icon-only to expanded
                  isExpanded 
                    ? "min-w-[90px] px-4 flex-1" 
                    : "w-12 min-w-[48px] px-0 flex-1"
                )}
                aria-label={item.label}
              >
                <Icon 
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-all duration-300",
                    isActive ? "stroke-[2.5]" : "stroke-2"
                  )} 
                />
                <span 
                  className={cn(
                    "text-xs font-medium whitespace-nowrap transition-all duration-300 ease-in-out",
                    isExpanded 
                      ? "max-w-[100px] opacity-100 translate-x-0" 
                      : "max-w-0 opacity-0 -translate-x-2"
                  )}
                  style={{
                    transition: 'max-width 0.3s ease-in-out, opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
