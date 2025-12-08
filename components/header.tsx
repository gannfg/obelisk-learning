 "use client";
 
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { useAuth } from "@/lib/hooks/use-auth";
 import { SearchBar } from "@/components/search-bar";
import {
  Menu,
  ChevronDown,
  User,
  LogOut,
  FolderKanban,
  Users as UsersIcon,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/profile";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAdmin } from "@/lib/hooks/use-admin";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
 
 export function Header() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const supabase = createClient();
  const { isAdmin } = useAdmin();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  // Fetch user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || loading) return;
      
      try {
        const profile = await getUserProfile(user.id, user.email || undefined, supabase);
        if (profile) {
          setProfileImageUrl(profile.image_url || null);
          setUsername(profile.username || profile.email?.split("@")[0] || "User");
        } else {
          setUsername(user.email?.split("@")[0] || "User");
          setProfileImageUrl(user.user_metadata?.avatar_url || null);
        }
      } catch (error) {
        console.debug('Error loading profile:', error);
        setUsername(user.email?.split("@")[0] || "User");
        setProfileImageUrl(user.user_metadata?.avatar_url || null);
      }
    };

    loadProfile();
  }, [user, loading, supabase]);


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const baseNavItems = [
    { href: "/academy", label: "Academy" },
    { href: "/missions", label: "Missions" },
    { href: "/workshops", label: "Workshops" },
    { href: "/instructors", label: "Mentors" },
  ];

  const navItems = isAdmin
    ? [...baseNavItems, { href: "/admin", label: "Admin" }]
    : baseNavItems;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const userEmail = user?.email || "";
  const userInitials = userEmail ? userEmail.charAt(0).toUpperCase() : "U";
  const userAvatar = profileImageUrl || user?.user_metadata?.avatar_url || null;
 
   return (
     <header 
      className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm safe-area-inset-top"
       style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}
     >
      <div className="container mx-auto flex h-14 sm:h-16 items-center gap-3 sm:gap-4 px-4 sm:px-6">
        {/* Logo + Study */}
          <Link
            href="/"
          className="flex items-center gap-2 shrink-0 transition-all duration-200 hover:opacity-80"
          >
            <Image
              src="/favicon.svg"
              alt="Study logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-md object-contain"
              priority
            />
          <span className="text-base sm:text-lg font-medium">Study</span>
          </Link>

        {/* Separator */}
        <div className="hidden lg:block h-6 w-px bg-border" />

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                isActive(item.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search Bar */}
        <div className="hidden md:flex items-center w-full max-w-md mx-4">
          <SearchBar />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Search */}
          <div className="md:hidden">
            <SearchBar />
          </div>

          {!loading && (
            <>
              {/* Theme Toggle - always visible */}
              <ThemeToggle />

              {user ? (
                <>
                  {/* Notifications */}
                  <NotificationsDropdown userId={user.id} supabase={supabase} />

                  {/* Profile Picture + Username + Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto px-2 py-1.5 gap-2 hover:bg-muted"
                      >
                        {userAvatar ? (
                          <div className="relative h-8 w-8 rounded-full overflow-hidden">
                            <Image
                              src={userAvatar}
                              alt={username}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                            {userInitials}
                          </div>
                        )}
                        <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                          {username}
                        </span>
                        <ChevronDown className="h-4 w-4 hidden sm:block text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{username}</p>
                        <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center w-full">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/academy/projects" className="flex items-center w-full">
                          <FolderKanban className="mr-2 h-4 w-4" />
                          Projects
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/academy/teams" className="flex items-center w-full">
                          <UsersIcon className="mr-2 h-4 w-4" />
                          Teams
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/instructors" className="flex items-center w-full">
                          <HelpCircle className="mr-2 h-4 w-4" />
                          Help
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/40"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {/* Sign In / Get Started for non-authenticated users */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/auth/sign-in">Sign In</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/auth/sign-up">Get Started</Link>
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden h-9 w-9 p-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
              </DropdownMenuItem>
              ))}
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
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
