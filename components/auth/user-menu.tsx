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
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import Image from "next/image";

export function UserMenu() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = createClient();

  const handleSignOut = async () => {
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
  const userInitials = userEmail ? userEmail.charAt(0).toUpperCase() : "U";
  const userAvatar = user.user_metadata?.avatar_url || null;

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
          <p className="font-medium">{userEmail}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/dashboard">
            <User className="mr-2 h-4 w-4" />
            Dashboard
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
