"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import { getClassById, enrollUser, getClassEnrollments } from "@/lib/classes";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function EnrollPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const classId = params.id as string;
  
  const [classItem, setClassItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);

  // Load class data
  useEffect(() => {
    const loadClass = async () => {
      if (!classId) {
        setError("Class ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const learningSupabase = createLearningClient();
        if (!learningSupabase) {
          setError("Database connection failed");
          setLoading(false);
          return;
        }

        const classData = await getClassById(classId, learningSupabase);
        if (!classData) {
          setError("Class not found");
          setLoading(false);
          return;
        }

        setClassItem(classData);
      } catch (err) {
        console.error("Error loading class:", err);
        setError("Failed to load class information");
      } finally {
        setLoading(false);
      }
    };

    loadClass();
  }, [classId]);

  // Check if user is already enrolled
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user || !classId || authLoading) {
        setCheckingEnrollment(false);
        return;
      }

      try {
        const learningSupabase = createLearningClient();
        if (!learningSupabase) {
          setCheckingEnrollment(false);
          return;
        }

        const enrollments = await getClassEnrollments(classId, learningSupabase);
        const userEnrollment = enrollments.find(
          (enrollment) => enrollment.userId === user.id && enrollment.status === "active"
        );
        
        setIsEnrolled(!!userEnrollment);
      } catch (err) {
        console.error("Error checking enrollment:", err);
      } finally {
        setCheckingEnrollment(false);
      }
    };

    checkEnrollment();
  }, [user, classId, authLoading]);

  const handleEnroll = async () => {
    if (!user) {
      router.push("/auth/sign-in?redirect=/academy/classes/" + classId + "/enroll");
      return;
    }

    if (!classItem) {
      setError("Class information not loaded");
      return;
    }

    if (classItem.enrollmentLocked) {
      setError("Enrollment is locked for this class");
      return;
    }

    if (!classItem.published) {
      setError("This class is not yet published");
      return;
    }

    try {
      setEnrolling(true);
      setError(null);

      const learningSupabase = createLearningClient();
      if (!learningSupabase) {
        setError("Database connection failed");
        setEnrolling(false);
        return;
      }

      const enrollment = await enrollUser(classId, user.id, undefined, learningSupabase);
      
      if (enrollment) {
        setSuccess(true);
        setIsEnrolled(true);
        // Redirect to class page after 2 seconds
        setTimeout(() => {
          router.push(`/academy/classes/${classId}`);
        }, 2000);
      } else {
        setError("Failed to enroll. You may already be enrolled or the class may be full.");
      }
    } catch (err: any) {
      console.error("Error enrolling:", err);
      setError(err?.message || "An error occurred while enrolling. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  if (authLoading || loading || checkingEnrollment) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to sign in to enroll in classes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href={`/auth/sign-in?redirect=/academy/classes/${classId}/enroll`}>
                Sign In
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/academy/classes/${classId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Class
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !classItem) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/academy">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Academy
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classItem) {
    return null;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href={`/academy/classes/${classId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Class
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Class Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Class Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classItem.thumbnail ? (
              <div className="relative h-48 w-full rounded-lg overflow-hidden">
                <Image
                  src={classItem.thumbnail}
                  alt={classItem.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-48 w-full rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-primary" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold mb-2">{classItem.title}</h2>
              {classItem.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {classItem.description}
                </p>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Semester:</span>
                <span className="font-medium">{classItem.semester}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">
                  {format(classItem.startDate, "MMM d, yyyy")} - {format(classItem.endDate, "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{classItem.status}</span>
              </div>
              {classItem.maxCapacity && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-medium">{classItem.maxCapacity} students</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Card */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment</CardTitle>
            <CardDescription>
              {isEnrolled
                ? "You are already enrolled in this class"
                : "Complete your enrollment to access class materials"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Successfully enrolled!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to the class page...
                </p>
                <Button asChild className="w-full">
                  <Link href={`/academy/classes/${classId}`}>
                    Go to Class
                  </Link>
                </Button>
              </div>
            ) : isEnrolled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">You are enrolled</span>
                </div>
                <Button asChild className="w-full">
                  <Link href={`/academy/classes/${classId}`}>
                    View Class
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {classItem.enrollmentLocked ? (
                  <div className="p-3 rounded-md bg-muted border">
                    <p className="text-sm text-muted-foreground">
                      Enrollment is currently locked for this class.
                    </p>
                  </div>
                ) : !classItem.published ? (
                  <div className="p-3 rounded-md bg-muted border">
                    <p className="text-sm text-muted-foreground">
                      This class is not yet published.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        By enrolling, you will:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Gain access to all class materials</li>
                        <li>Be able to attend live sessions</li>
                        <li>Submit assignments and track progress</li>
                        <li>Participate in class discussions</li>
                      </ul>
                    </div>
                    <Button
                      onClick={handleEnroll}
                      disabled={enrolling || classItem.enrollmentLocked || !classItem.published}
                      className="w-full"
                      size="lg"
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        "Enroll Now"
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

