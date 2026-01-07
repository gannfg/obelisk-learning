"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMentor } from "@/lib/hooks/use-mentor";
import { useAuth } from "@/lib/hooks/use-auth";
import { getAllClasses, Class } from "@/lib/classes";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MentorClassesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isMentor, loading: mentorLoading } = useMentor();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mentorLoading && !isMentor) {
      router.replace("/");
      return;
    }

    if (isMentor && user) {
      loadClasses();
    }
  }, [mentorLoading, isMentor, user, router]);

  const loadClasses = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const supabase = createLearningClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      // Only load classes created by this mentor
      const data = await getAllClasses({ createdBy: user.id }, supabase);
      setClasses(data);
    } catch (error) {
      console.error("Error loading classes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (mentorLoading || loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center min-height-[300px]">
          <p className="text-base text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isMentor) {
    return null;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mentor">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mentor Panel
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">My Classes</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Manage the classes you created
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/classes">
            <Plus className="mr-2 h-4 w-4" />
            Create New Class
          </Link>
        </Button>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No classes yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first class to get started
            </p>
            <Button asChild>
              <Link href="/admin/classes">Create Your First Class</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{classItem.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {classItem.description || "No description"}
                </p>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild className="w-full">
                  <Link href={`/admin/classes?classId=${classItem.id}`}>
                    Manage Class
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

