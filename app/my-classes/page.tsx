"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { getAllClassesWithModules, getClassEnrollments } from "@/lib/classes";
import type { ClassWithModules, ClassEnrollment } from "@/types/classes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

export default function MyClassesPage() {
  const { user, loading: authLoading } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState<ClassWithModules[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEnrolledClasses = async () => {
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabase = createLearningClient();
        if (!supabase) {
          setError("Supabase client not configured.");
          setLoading(false);
          return;
        }

        // Get all classes
        const allClasses = await getAllClassesWithModules({ publishedOnly: true }, supabase);
        
        // Get user's enrollments
        const enrollments: ClassEnrollment[] = [];
        for (const cls of allClasses) {
          const classEnrollments = await getClassEnrollments(cls.id, supabase);
          const userEnrollment = classEnrollments.find((e) => e.userId === user.id && e.status === "active");
          if (userEnrollment) {
            enrollments.push(userEnrollment);
          }
        }

        // Filter classes to only show enrolled ones
        const enrolledClassIds = new Set(enrollments.map((e) => e.classId));
        const userClasses = allClasses.filter((cls) => enrolledClassIds.has(cls.id));

        setEnrolledClasses(userClasses);
      } catch (error) {
        console.error("Error loading enrolled classes:", error);
        setError("Failed to load your classes.");
      } finally {
        setLoading(false);
      }
    };

    loadEnrolledClasses();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view your classes.</p>
            <Button asChild>
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">My Classes</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          View and manage your enrolled classes.
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {enrolledClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No classes enrolled</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You haven't enrolled in any classes yet.
            </p>
            <Button asChild>
              <Button asChild variant="outline">
              <Link href="/academy/classes">Browse Classes</Link>
            </Button>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledClasses.map((cls) => (
            <Link key={cls.id} href={`/academy/classes/${cls.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                {cls.thumbnail && (
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                    <Image
                      src={cls.thumbnail}
                      alt={cls.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{cls.title}</CardTitle>
                  <CardDescription>{cls.semester}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(cls.startDate, "MMM d")} - {format(cls.endDate, "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{cls.modules.length} module{cls.modules.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          cls.status === "ongoing"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : cls.status === "upcoming"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {cls.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

