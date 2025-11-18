"use client";

import { useRouter } from "next/navigation";
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
import { useAuth } from "@/lib/auth/client-side";
import { User, LogOut, BookOpen } from "lucide-react";

export function UserMenu() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <>
        <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
          <Link href="/auth/sign-in">Sign In</Link>
        </Button>
        <Button size="sm" className="hidden sm:flex" asChild>
          <Link href="/auth/sign-up">Get Started</Link>
        </Button>
      </>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const fullName = user?.fullName || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || email?.split("@")[0] || 'User');
  const avatarUrl = user?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Image
            src={avatarUrl}
            alt={fullName}
            width={24}
            height={24}
            className="rounded-full"
            unoptimized
          />
          <span className="hidden md:inline">{email?.split("@")[0] || fullName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{fullName}</p>
          {email && <p className="text-xs text-muted-foreground">{email}</p>}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            My Courses
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

