"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useAuth } from "@/lib/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FolderKanban, Users as UsersIcon, Target, Calendar } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-center min-height-[300px]">
          <p className="text-base text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Admin Panel</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Welcome{user?.email ? `, ${user.email}` : ""}. Manage classes, missions, projects, and teams for the academy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Classes
            </CardTitle>
            <CardDescription>
              Create and manage academy classes. (Uses learning database schema)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/courses">Open Classes Admin</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Missions
            </CardTitle>
            <CardDescription>
              Create and manage practice missions for learners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/admin/missions">Open Missions Admin</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/missions">View Mission Board</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Projects
            </CardTitle>
            <CardDescription>
              Create and manage academy projects (backed by Supabase).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/academy/projects/new">New Project</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/academy/projects">View All Projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Teams
            </CardTitle>
            <CardDescription>
              Create and manage teams for collaborative work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/academy/teams/new">New Team</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/academy/teams">View All Teams</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Workshops
            </CardTitle>
            <CardDescription>
              Create and manage workshops for online and offline events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/admin/workshops">Manage Workshops</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/workshops">View Workshop Calendar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


