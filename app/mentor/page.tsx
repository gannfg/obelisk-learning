"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useMentor } from "@/lib/hooks/use-mentor";
import { useAuth } from "@/lib/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, FileText } from "lucide-react";

export default function MentorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isMentor, loading } = useMentor();

  useEffect(() => {
    if (!loading && !isMentor) {
      router.replace("/");
    }
  }, [loading, isMentor, router]);

  if (loading || !isMentor) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center min-height-[300px]">
          <p className="text-base text-muted-foreground">Checking mentor access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Mentor Panel</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Welcome{user?.email ? `, ${user.email}` : ""}. Manage your classes, students, and content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Classes
            </CardTitle>
            <CardDescription>
              View and manage the classes you created. Add modules, sessions, and assignments.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild className="w-full">
              <Link href="/mentor/classes">Manage My Classes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students
            </CardTitle>
            <CardDescription>
              View enrollments and student progress for your classes.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="/mentor/students">View Students</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submissions
            </CardTitle>
            <CardDescription>
              Review and grade assignment submissions from your students.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="/mentor/submissions">Review Submissions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
