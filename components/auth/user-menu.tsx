"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  User,
  LogOut,
  Users as UsersIcon,
  HelpCircle,
  BookOpen,
  Trophy,
  FolderKanban,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useMentor } from "@/lib/hooks/use-mentor";
import { getUserProfile } from "@/lib/profile";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export function UserMenu() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = createClient();
  const { isMentor, loading: mentorLoading } = useMentor();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Fetch synced profile to get the latest profile picture
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || loading) return;
      
      try {
        const profile = await getUserProfile(user.id, user.email || undefined, supabase);
        if (profile?.image_url) {
          setProfileImageUrl(profile.image_url);
        } else {
          // Fallback to user_metadata if profile doesn't have image_url
          setProfileImageUrl(user.user_metadata?.avatar_url || null);
        }
      } catch (error) {
        console.debug('Error loading profile for user menu:', error);
        // Fallback to user_metadata
        setProfileImageUrl(user.user_metadata?.avatar_url || null);
      }
    };

    loadProfile();
    
    // Refresh profile when route changes (e.g., after updating profile)
    const handleRouteChange = () => {
      loadProfile();
    };
    
    // Listen for route changes
    window.addEventListener('focus', handleRouteChange);
    
    return () => {
      window.removeEventListener('focus', handleRouteChange);
    };
  }, [user, loading, supabase]);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const userEmail = user.email || "";
  const displayName =
    user.user_metadata?.username ||
    userEmail.split("@")[0] ||
    "User";
  const userInitials = userEmail ? userEmail.charAt(0).toUpperCase() : "U";
  // Use synced profile image if available, otherwise fallback to user_metadata
  const userAvatar = profileImageUrl || user.user_metadata?.avatar_url || null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
          {userAvatar ? (
            <div className="relative h-8 w-8 rounded-full overflow-hidden">
              <Image
                src={userAvatar}
                alt={userEmail}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {userInitials}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm">
          <p className="font-medium truncate">{displayName}</p>
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
          <Link href="/achievements" className="flex items-center w-full">
            <Trophy className="mr-2 h-4 w-4" />
            Achievement
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-classes" className="flex items-center w-full">
            <BookOpen className="mr-2 h-4 w-4" />
            My Classes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/academy/teams" className="flex items-center w-full">
            <UsersIcon className="mr-2 h-4 w-4" />
            Teams
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/academy/projects" className="flex items-center w-full">
            <FolderKanban className="mr-2 h-4 w-4" />
            Project
          </Link>
        </DropdownMenuItem>
        {/* Mentor option - only visible to mentors */}
        {isMentor && (
          <DropdownMenuItem asChild>
            <Link href="/mentor" className="flex items-center w-full">
              <GraduationCap className="mr-2 h-4 w-4" />
              Mentor
            </Link>
          </DropdownMenuItem>
        )}
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
  );
}
