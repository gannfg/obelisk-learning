import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClassByIdWithModules, getClassEnrollments } from "@/lib/classes";
import { createLearningServerClient, createAuthServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getUserProfile } from "@/lib/profile";
import { format } from "date-fns";
import { Calendar, Users, BookOpen, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClassPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassPage({ params }: ClassPageProps) {
  const { id } = await params;
  const learningSupabase = await createLearningServerClient();
  const classItem = await getClassByIdWithModules(id, learningSupabase);

  if (!classItem) {
    notFound();
  }

  // Get current user and check enrollment status
  const user = await getCurrentUser();
  let userEnrollment = null;
  
  // Get all enrollments and user profiles
  const allEnrollments = await getClassEnrollments(id, learningSupabase);
  const activeEnrollments = allEnrollments.filter(e => e.status === "active");
  
  if (user) {
    userEnrollment = activeEnrollments.find(
      (enrollment) => enrollment.userId === user.id
    );
  }

  // Fetch user profiles with avatars for enrolled users
  const authSupabase = await createAuthServerClient();
  const enrolledUsersWithAvatars = await Promise.all(
    activeEnrollments.slice(0, 10).map(async (enrollment) => {
      try {
        const profile = await getUserProfile(enrollment.userId, undefined, authSupabase);
        return {
          id: enrollment.userId,
          avatar: profile?.image_url || profile?.email?.charAt(0).toUpperCase() || "U",
          email: profile?.email || "",
        };
      } catch (error) {
        return {
          id: enrollment.userId,
          avatar: enrollment.userId.charAt(0).toUpperCase() || "U",
          email: "",
        };
      }
    })
  );

  // Note: Mentor info would need to come from Auth Supabase users table
  // For now, we'll just use the mentor ID
  const mentor = {
    id: classItem.mentorId,
    name: "Mentor", // Would need to fetch from Auth Supabase
  };

  const totalModules = classItem.modules?.length || 0;

  const getDateShort = (date: Date) => {
    const month = format(date, "MMM").toUpperCase();
    const day = format(date, "d");
    return `${month} ${day}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/academy">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Academy
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 lg:gap-12">
          {/* Left Panel - Class Image & Core Information */}
          <div className="space-y-6">
            {/* Class Image */}
            {classItem.thumbnail ? (
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
                <Image
                  src={classItem.thumbnail}
                  alt={classItem.title}
                  fill
                  className="object-cover"
                  sizes="400px"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center">
                <span className="text-6xl">📚</span>
              </div>
            )}

            {/* Core Information & Quick Information */}
            <div className="bg-card rounded-lg p-4 border border-border space-y-4">
              {/* Status */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="font-medium capitalize">{classItem.status}</p>
              </div>

              {/* Semester */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Semester</p>
                <p className="font-medium">{classItem.semester}</p>
              </div>

              {/* Modules */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Modules</p>
                <p className="font-medium">{totalModules} module{totalModules !== 1 ? "s" : ""}</p>
              </div>

              {/* Capacity */}
              {classItem.maxCapacity && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Capacity</p>
                  <p className="font-medium">{classItem.maxCapacity} students</p>
                </div>
              )}

              {/* Enrollment Status */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Enrollment</p>
                <p className="font-medium">
                  {classItem.enrollmentLocked ? "Locked" : "Open"}
                </p>
              </div>

              {/* User Enrollment Status */}
              {user && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your Status</p>
                  <p className="font-medium">
                    {userEnrollment ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-green-700 dark:text-green-300">Enrolled</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not Enrolled</span>
                    )}
                  </p>
                  {userEnrollment && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Enrolled on {format(userEnrollment.enrolledAt, "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              )}

              {/* Mentor */}
              {mentor && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Mentor</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{mentor.name}</span>
                  </div>
                </div>
              )}

              {/* Enrolled Students */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Enrolled Students</p>
                <p className="font-medium mb-2">{activeEnrollments.length} {activeEnrollments.length === 1 ? "student" : "students"}</p>
                {enrolledUsersWithAvatars.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {enrolledUsersWithAvatars.map((user, idx) => (
                      <div
                        key={user.id}
                        className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-background"
                        title={user.email}
                        style={{ marginLeft: idx > 0 ? "-8px" : "0" }}
                      >
                        {typeof user.avatar === "string" && user.avatar.startsWith("http") ? (
                          <Image
                            src={user.avatar}
                            alt={user.email || "User"}
                            fill
                            className="object-cover"
                            sizes="32px"
                            unoptimized
                          />
                        ) : (
                          <div className="h-full w-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {user.avatar}
                          </div>
                        )}
                      </div>
                    ))}
                    {activeEnrollments.length > 10 && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground border-2 border-background">
                        +{activeEnrollments.length - 10}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Main Content */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {classItem.title}
              </h1>
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Calendar className="h-5 w-5" />
                <span>{getDateShort(classItem.startDate)} - {getDateShort(classItem.endDate)}</span>
              </div>
              <div className="text-muted-foreground">
                {format(classItem.startDate, "EEEE, MMMM d, yyyy")} - {format(classItem.endDate, "EEEE, MMMM d, yyyy")}
              </div>
            </div>

            {/* Enrollment Status Banner */}
            {userEnrollment && (
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>You are enrolled in this class</span>
                </div>
              </div>
            )}

            {/* Overview with Tabs */}
            <div className="space-y-4">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="modules">Modules</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 pt-4">
                  <h2 className="text-2xl font-bold">About This Class</h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {classItem.description || "No description available for this class."}
                    </p>
                    <div className="mt-6 space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Class Details</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Semester: {classItem.semester}</li>
                          <li>Start Date: {format(classItem.startDate, "MMMM d, yyyy")}</li>
                          <li>End Date: {format(classItem.endDate, "MMMM d, yyyy")}</li>
                          {classItem.maxCapacity && (
                            <li>Maximum Capacity: {classItem.maxCapacity} students</li>
                          )}
                          <li>Status: <span className="capitalize">{classItem.status}</span></li>
                        </ul>
                      </div>
                      {classItem.category && (
                        <div>
                          <h3 className="font-semibold mb-2">Category</h3>
                          <span className="inline-block rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                            {classItem.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="modules" className="space-y-4 pt-4">
                  <h2 className="text-2xl font-bold">Class Modules</h2>
                  {classItem.modules && classItem.modules.length > 0 ? (
                    <div className="space-y-4">
                      {classItem.modules.map((module) => (
                        <Card key={module.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="mb-2">
                                  Week {module.weekNumber}: {module.title}
                                </CardTitle>
                                {module.description && (
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {module.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  {module.startDate && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>Starts: {format(module.startDate, "MMM d, yyyy")}</span>
                                    </div>
                                  )}
                                  {module.endDate && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>Ends: {format(module.endDate, "MMM d, yyyy")}</span>
                                    </div>
                                  )}
                                  {module.locked && (
                                    <span className="text-orange-600 dark:text-orange-400">🔒 Locked</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          {module.learningMaterials && module.learningMaterials.length > 0 && (
                            <CardContent>
                              <h4 className="text-sm font-semibold mb-2">Learning Materials</h4>
                              <ul className="space-y-1">
                                {module.learningMaterials.map((material, idx) => (
                                  <li key={idx} className="text-sm">
                                    <a
                                      href={material.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {material.title} ({material.type})
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          )}
                          {module.liveSessionLink && (
                            <CardContent>
                              <a
                                href={module.liveSessionLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Join Live Session →
                              </a>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">
                        No modules available yet. Check back soon!
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4 pt-4">
                  <h2 className="text-2xl font-bold">Class Schedule</h2>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                          <p className="font-medium">
                            {format(classItem.startDate, "EEEE, MMMM d, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">End Date</p>
                          <p className="font-medium">
                            {format(classItem.endDate, "EEEE, MMMM d, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Duration</p>
                          <p className="font-medium">
                            {Math.ceil((classItem.endDate.getTime() - classItem.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                          </p>
                        </div>
                        {classItem.modules && classItem.modules.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Weekly Schedule</p>
                            <div className="space-y-2">
                              {classItem.modules.map((module) => (
                                <div key={module.id} className="text-sm border-l-2 border-primary/20 pl-3">
                                  <p className="font-medium">Week {module.weekNumber}: {module.title}</p>
                                  {module.startDate && module.endDate && (
                                    <p className="text-muted-foreground text-xs">
                                      {format(module.startDate, "MMM d")} - {format(module.endDate, "MMM d, yyyy")}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Enrollment Actions */}
            <div className="space-y-4 pt-6 border-t border-border">
              {!userEnrollment ? (
                <>
                  {classItem.published && !classItem.enrollmentLocked && (
                    <Button size="lg" className="w-full" asChild>
                      <Link href={`/academy/classes/${classItem.id}/enroll`}>
                        Enroll Now
                      </Link>
                    </Button>
                  )}
                  {classItem.enrollmentLocked && (
                    <Button size="lg" variant="outline" className="w-full" disabled>
                      Enrollment Locked
                    </Button>
                  )}
                  {!classItem.published && (
                    <Button size="lg" variant="outline" className="w-full" disabled>
                      Not Published
                    </Button>
                  )}
                </>
              ) : (
                <Button size="lg" className="w-full" asChild>
                  <Link href={`/class/${classItem.id}`}>
                    Enter Class
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

