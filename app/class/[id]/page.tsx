import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getClassByIdWithModules, getClassEnrollments } from "@/lib/classes";
import { createLearningServerClient, createAuthServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getUserProfile } from "@/lib/profile";
import { ClassroomTabs } from "@/components/classroom/classroom-tabs";
import { ArrowLeft, CheckCircle2, ExternalLink, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { format } from "date-fns";
import { getClassAssignments } from "@/lib/classroom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpandableText } from "@/components/expandable-text";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ClassPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ClassPage({ params, searchParams }: ClassPageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
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

      <div className="relative container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 md:pb-6">
        <Button variant="ghost" asChild className="mb-4 sm:mb-6">
          <Link href="/academy/classes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Link>
        </Button>

        {/* Mobile Layout: Title -> Compact Info -> Image -> Collapsible Details -> Modules */}
        <div className="flex flex-col lg:grid lg:grid-cols-[400px_1fr] gap-4 lg:gap-12">
          {/* Title - First on Mobile */}
          <div className="order-1 lg:hidden">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
              {classItem.title}
            </h1>
          </div>

          {/* Compact Info Bar - Second on Mobile (Quick Stats) */}
          <div className="order-2 lg:hidden flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 bg-card">
              <Calendar className="h-3.5 w-3.5" />
              {`${getDateShort(classItem.startDate)} - ${getDateShort(classItem.endDate)}`}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 bg-card">
              {classItem.modules?.length || 0} {classItem.modules?.length === 1 ? "Module" : "Modules"}
            </span>
            {userEnrollment && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 bg-green-500/10 border-green-500/20">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium">Enrolled</span>
              </span>
            )}
          </div>

          {/* Image - Third on Mobile (Smaller) */}
          <div className="order-3 lg:hidden">
            {classItem.thumbnail ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <Image
                  src={classItem.thumbnail}
                  alt={classItem.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center">
                <span className="text-4xl">📚</span>
              </div>
            )}
          </div>

          {/* Left Panel - Desktop Sidebar + Mobile Collapsible Details */}
          <div className="space-y-4 sm:space-y-6 order-4 lg:order-1">
            {/* Date badge - Desktop only, shows above image */}
            <div className="hidden lg:inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                <Calendar className="h-4 w-4" />
                {`${getDateShort(classItem.startDate)} - ${getDateShort(classItem.endDate)}`}
              </span>
            </div>

            {/* Class Image - Desktop only */}
            <div className="hidden lg:block">
              {classItem.thumbnail ? (
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden">
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
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center">
                  <span className="text-6xl">📚</span>
                </div>
              )}
            </div>

            {/* Mobile: Collapsible Details Accordion */}
            <Accordion type="multiple" className="lg:hidden w-full" defaultValue={[]}>
              {/* Description */}
              {classItem.description && (
                <AccordionItem value="description" className="border-b border-border">
                  <AccordionTrigger className="text-sm font-medium py-3">
                    Description
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="text-sm text-muted-foreground">
                      <ExpandableText text={classItem.description} maxChars={300} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Class Information */}
              <AccordionItem value="info" className="border-b border-border">
                <AccordionTrigger className="text-sm font-medium py-3">
                  Class Details
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                      <p className="font-medium capitalize">{classItem.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Semester</p>
                      <p className="font-medium">{classItem.semester}</p>
                    </div>
                    {classItem.maxCapacity && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Capacity</p>
                        <p className="font-medium">{classItem.maxCapacity} students</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Enrollment</p>
                      <p className="font-medium">{classItem.enrollmentLocked ? "Locked" : "Open"}</p>
                    </div>
                    {userEnrollment && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Your Status</p>
                        <p className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          <span className="text-green-700 dark:text-green-300">Enrolled</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            ({format(userEnrollment.enrolledAt, "MMM d, yyyy")})
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  {classItem.meetingLink && (
                    <Button asChild variant="outline" className="w-full mt-4" size="sm">
                      <a href={classItem.meetingLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        Join Meeting
                      </a>
                    </Button>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Enrolled Students */}
              {activeEnrollments.length > 0 && (
                <AccordionItem value="students" className="border-b border-border">
                  <AccordionTrigger className="text-sm font-medium py-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {activeEnrollments.length} {activeEnrollments.length === 1 ? "Student" : "Students"}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    {enrolledUsersWithAvatars.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
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
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Desktop: Full Details (unchanged) */}
            {/* Description */}
            {classItem.description && (
              <div className="hidden lg:block bg-card rounded-lg p-4 border border-border">
                <ExpandableText text={classItem.description} maxChars={420} />
              </div>
            )}

            {/* Class Information Card - Desktop */}
            <div className="hidden lg:block bg-card rounded-lg p-3 sm:p-4 border border-border space-y-4">
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

            {/* Enrolled Students - Desktop */}
            <div className="hidden lg:block bg-card rounded-lg p-3 sm:p-4 border border-border">
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

          {/* Right Panel - Desktop Main Content with Tabs */}
          <div className="hidden lg:block space-y-6 order-2 lg:col-span-1">
            {/* Title - Desktop */}
            <div>
              <h1 className="text-5xl font-bold mb-4 leading-tight">
                {classItem.title}
              </h1>
            </div>

            {/* Tabs */}
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <ClassroomTabs
                classId={id}
                classItem={classItem}
                userId={user.id}
                isInstructor={isInstructor}
              />
            </Suspense>
          </div>

          {/* Mobile: Tabs */}
          <div className="lg:hidden order-5 space-y-4">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <ClassroomTabs
                classId={id}
                classItem={classItem}
                userId={user.id}
                isInstructor={isInstructor}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

