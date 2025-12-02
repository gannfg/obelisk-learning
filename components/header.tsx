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
  Bell,
  ChevronDown,
  User,
  LogOut,
  CheckCircle2,
  FileText,
  MessageSquare,
  Award,
  FolderKanban,
  Users as UsersIcon,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/profile";
import { ThemeToggle } from "@/components/theme-toggle";
 
 export function Header() {
   const { user, loading } = useAuth();
  const pathname = usePathname();
  const supabase = createClient();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: "submission" | "feedback" | "achievement" | "message";
    title: string;
    message: string;
    time: string;
    read: boolean;
    link?: string;
  }>>([]);

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

  // Mock notifications (replace with real data later)
  useEffect(() => {
    // TODO: Replace with actual notification fetching
    const mockNotifications = [
      {
        id: "1",
        type: "submission" as const,
        title: "Lesson Submission Reviewed",
        message: "Your submission for 'Understanding Context Windows' has been reviewed",
        time: "2 hours ago",
        read: false,
        link: "/dashboard?tab=submissions",
      },
      {
        id: "2",
        type: "feedback" as const,
        title: "New Feedback Received",
        message: "You received feedback on your DeFi project submission",
        time: "5 hours ago",
        read: false,
        link: "/academy/projects/1",
      },
      {
        id: "3",
        type: "achievement" as const,
        title: "Achievement Unlocked!",
        message: "You completed 10 lessons in Solana Development course",
        time: "1 day ago",
        read: true,
        link: "/dashboard",
      },
      {
        id: "4",
        type: "message" as const,
        title: "New Message from Mentor",
        message: "Your mentor replied to your question about smart contracts",
        time: "2 days ago",
        read: true,
        link: "/mentor-chat",
      },
    ];
    setNotifications(mockNotifications);
    setNotificationCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navItems = [
    { href: "/missions", label: "Missions" },
    { href: "/academy", label: "Academy" },
    { href: "/instructors", label: "Mentors" },
    { href: "/mentor-chat", label: "Chat" },
  ];

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
              {user ? (
                <>
                  {/* Theme Toggle */}
                  <ThemeToggle />

                  {/* Lessons Submission / Notifications */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="relative h-9 w-9 p-0"
                      >
                        <Bell className="h-5 w-5" />
                        {notificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                            {notificationCount > 9 ? "9+" : notificationCount}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 sm:w-96">
                      <div className="px-3 py-2 border-b border-border">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold">Notifications</h3>
                          {notificationCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {notificationCount} new
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="py-1">
                            {notifications.map((notification) => {
                              const getIcon = () => {
                                switch (notification.type) {
                                  case "submission":
                                    return <FileText className="h-4 w-4 text-blue-500" />;
                                  case "feedback":
                                    return <MessageSquare className="h-4 w-4 text-green-500" />;
                                  case "achievement":
                                    return <Award className="h-4 w-4 text-yellow-500" />;
                                  case "message":
                                    return <MessageSquare className="h-4 w-4 text-purple-500" />;
                                  default:
                                    return <Bell className="h-4 w-4" />;
                                }
                              };

                              return (
                                <DropdownMenuItem
                                  key={notification.id}
                                  asChild
                                  className={cn(
                                    "flex items-start gap-3 px-3 py-3 cursor-pointer",
                                    !notification.read && "bg-muted/50"
                                  )}
                                >
                                  <Link
                                    href={notification.link || "#"}
                                    className="flex items-start gap-3 w-full"
                                  >
                                    <div className={cn(
                                      "mt-0.5 flex-shrink-0",
                                      !notification.read && "relative"
                                    )}>
                                      {getIcon()}
                                      {!notification.read && (
                                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={cn(
                                        "text-sm font-medium mb-0.5",
                                        !notification.read && "font-semibold"
                                      )}>
                                        {notification.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {notification.time}
                                      </p>
                                    </div>
                                  </Link>
                                </DropdownMenuItem>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              No notifications
                            </p>
                          </div>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link
                              href="/dashboard?tab=submissions"
                              className="flex items-center justify-center w-full text-sm font-medium"
                            >
                              View All Notifications
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

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
                        <Link href="/mentor-chat" className="flex items-center w-full">
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
