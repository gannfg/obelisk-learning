import { notFound, redirect } from "next/navigation";
import { getClassByIdWithModules, getClassEnrollments } from "@/lib/classes";
import { createLearningServerClient, createAuthServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getUserProfile } from "@/lib/profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassroomOverview } from "@/components/classroom/classroom-overview";
import { ClassroomModules } from "@/components/classroom/classroom-modules";
import { ClassroomAttendance } from "@/components/classroom/classroom-attendance";
import { ClassroomAssignments } from "@/components/classroom/classroom-assignments";
import { ClassroomAnnouncements } from "@/components/classroom/classroom-announcements";
import { ArrowLeft, CheckCircle2, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { format } from "date-fns";
import { getClassAssignments } from "@/lib/classroom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpandableText } from "@/components/expandable-text";

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

  // Get current user and check enrollment
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  // Get enrollments
  const allEnrollments = await getClassEnrollments(id, learningSupabase);
  const userEnrollment = allEnrollments.find(
    (enrollment) => enrollment.userId === user.id && enrollment.status === "active"
  );

  // Check if user is instructor
  const authSupabase = await createAuthServerClient();
  const { data: profile } = await authSupabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const adminEmails = new Set([
    "gany.wicaksono@gmail.com",
    "amirsafruddin99@gmail.com",
  ]);
  const isAdmin = Boolean(profile?.is_admin) || (user.email ? adminEmails.has(user.email) : false);
  const isInstructor = isAdmin || classItem.mentorId === user.id;

  // If not enrolled and not instructor, redirect to enrollment page
  if (!userEnrollment && !isInstructor) {
    redirect(`/academy/classes/${id}/enroll`);
  }

  // Fetch assignments to show alongside modules
  const assignments = await getClassAssignments(id, learningSupabase);
  const assignmentsByModule: Record<string, typeof assignments> = {};
  (classItem.modules || []).forEach((mod) => {
    assignmentsByModule[mod.id] = assignments.filter((a) => a.moduleId === mod.id);
  });

  // Get enrolled students for left panel
  const activeEnrollments = allEnrollments.filter(e => e.status === "active");
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
          <Link href="/academy/classes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Link>
        </Button>

        <div className="flex flex-col lg:grid lg:grid-cols-[400px_1fr] gap-6 lg:gap-12">
          {/* Left Panel - Class Image & Information */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
            {/* Date badge above image */}
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                <Calendar className="h-4 w-4" />
                {`${getDateShort(classItem.startDate)} - ${getDateShort(classItem.endDate)}`}
              </span>
            </div>

            {/* Class Image */}
            {classItem.thumbnail ? (
              <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden">
                <Image
                  src={classItem.thumbnail}
                  alt={classItem.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 400px"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center">
                <span className="text-6xl">📚</span>
              </div>
            )}

            {/* Description moved below image with See more */}
            {classItem.description && (
              <div className="bg-card rounded-lg p-4 border border-border">
                <ExpandableText text={classItem.description} maxChars={420} />
              </div>
            )}

            {/* Class Information Card */}
            <div className="bg-card rounded-lg p-3 sm:p-4 border border-border space-y-4">
              {/* Status */}
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Status</p>
                <p className="font-medium capitalize">{classItem.status}</p>
              </div>

              {/* Semester */}
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Semester</p>
                <p className="font-medium">{classItem.semester}</p>
              </div>

              {/* Duration */}
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Duration</p>
                <p className="font-medium text-sm">
                  {`${getDateShort(classItem.startDate)} - ${getDateShort(classItem.endDate)}`}
                </p>
              </div>

              {/* Modules */}
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Modules</p>
                <p className="font-medium">{classItem.modules?.length || 0} module{(classItem.modules?.length || 0) !== 1 ? "s" : ""}</p>
              </div>

              {/* Capacity */}
              {classItem.maxCapacity && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Capacity</p>
                  <p className="font-medium">{classItem.maxCapacity} students</p>
                </div>
              )}

              {/* Enrollment Status */}
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Enrollment</p>
                <p className="font-medium">
                  {classItem.enrollmentLocked ? "Locked" : "Open"}
                </p>
              </div>

              {/* User Enrollment Status */}
              {userEnrollment && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Your Status</p>
                  <p className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">Enrolled</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enrolled on {format(userEnrollment.enrolledAt, "MMM d, yyyy")}
                  </p>
                </div>
              )}

              {/* Meeting Link */}
              {classItem.meetingLink && (
                <div>
                  <Button asChild variant="outline" className="w-full">
                    <a href={classItem.meetingLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Join Meeting
                    </a>
                  </Button>
                </div>
              )}
            </div>

            {/* Enrolled Students */}
            <div className="bg-card rounded-lg p-3 sm:p-4 border border-border">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-semibold">
                  {activeEnrollments.length} {activeEnrollments.length === 1 ? "Student" : "Students"}
                </span>
              </div>
              {enrolledUsersWithAvatars.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {enrolledUsersWithAvatars.map((enrolledUser, idx) => (
                      <div
                        key={enrolledUser.id}
                        className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-background"
                        title={enrolledUser.email}
                        style={{ marginLeft: idx > 0 ? "-8px" : "0" }}
                      >
                        {typeof enrolledUser.avatar === "string" && enrolledUser.avatar.startsWith("http") ? (
                          <Image
                            src={enrolledUser.avatar}
                            alt={enrolledUser.email || "User"}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        ) : (
                          <div className="h-full w-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {enrolledUser.avatar}
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
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Main Content */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {classItem.title}
              </h1>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className={isInstructor ? "grid w-full grid-cols-5" : "grid w-full grid-cols-3"}>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="modules">Modules</TabsTrigger>
                {isInstructor && (
                  <>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                  </>
                )}
                <TabsTrigger value="announcements">Announcements</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <ClassroomOverview
                  classId={id}
                  classItem={classItem}
                  userId={user.id}
                  isInstructor={isInstructor}
                />
              </TabsContent>

              <TabsContent value="modules" className="mt-6">
                <ClassroomModules
                  classId={id}
                  classItem={classItem}
                  userId={user.id}
                  isInstructor={isInstructor}
                />
              </TabsContent>

              {isInstructor && (
                <>
                  <TabsContent value="attendance" className="mt-6">
                    <ClassroomAttendance
                      classId={id}
                      classItem={classItem}
                      userId={user.id}
                      isInstructor={isInstructor}
                    />
                  </TabsContent>

                  <TabsContent value="assignments" className="mt-6">
                    <ClassroomAssignments
                      classId={id}
                      classItem={classItem}
                      userId={user.id}
                      isInstructor={isInstructor}
                    />
                  </TabsContent>
                </>
              )}

              <TabsContent value="announcements" className="mt-6">
                <ClassroomAnnouncements
                  classId={id}
                  classItem={classItem}
                  userId={user.id}
                  isInstructor={isInstructor}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

