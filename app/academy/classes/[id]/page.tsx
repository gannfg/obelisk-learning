import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClassByIdWithModules, getClassEnrollments } from "@/lib/classes";
import { createLearningServerClient, createAuthServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getUserProfile } from "@/lib/profile";
import { format } from "date-fns";
import { Calendar, Users, BookOpen, CheckCircle2, ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

  // Get current user and check enrollment status
  const user = await getCurrentUser();
  let userEnrollment: any = null;
  
  // Get all enrollments and user profiles
  const allEnrollments = await getClassEnrollments(id, learningSupabase);
  const activeEnrollments = allEnrollments.filter(e => e.status === "active");
  
  if (user) {
    userEnrollment = activeEnrollments.find(
      (enrollment) => enrollment.userId === user.id
    );
    // If already enrolled, send user directly to the class experience
    if (userEnrollment) {
      redirect(`/class/${id}`);
    }
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

  // Fetch mentor profile information
  let mentor: { id: string; name: string; avatar?: string } | null = null;
  if (classItem.mentorId) {
    try {
      const mentorProfile = await getUserProfile(classItem.mentorId, undefined, authSupabase);
      if (mentorProfile) {
        mentor = {
          id: classItem.mentorId,
          name: mentorProfile.first_name && mentorProfile.last_name
            ? `${mentorProfile.first_name} ${mentorProfile.last_name}`.trim()
            : mentorProfile.username || mentorProfile.email?.split('@')[0] || "Mentor",
          avatar: mentorProfile.image_url || undefined,
        };
      } else {
        mentor = {
          id: classItem.mentorId,
          name: "Mentor",
        };
      }
    } catch (error) {
      console.error("Error fetching mentor profile:", error);
      mentor = {
        id: classItem.mentorId,
        name: "Mentor",
      };
    }
  }

  const totalModules = classItem.modules?.length || 0;
  const now = new Date();
  const isEnded = classItem.endDate < now;

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
          <Link href="/academy">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Academy
          </Link>
        </Button>

        {/* Mobile Layout: Title -> Compact Info -> Image -> Main Content -> Collapsible Details */}
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
              {totalModules} {totalModules === 1 ? "Module" : "Modules"}
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

          {/* Right Panel - Main Content (Mobile: Order 4) */}
          <div className="space-y-4 sm:space-y-6 order-4 lg:order-2">
            {/* Title - Desktop */}
            <div className="hidden lg:block">
              <h1 className="text-5xl font-bold mb-4 leading-tight">
                {classItem.title}
              </h1>
            </div>

            {/* Date & Time - Mobile only as part of main content */}
            <div className="lg:hidden space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4" />
                <span>{getDateShort(classItem.startDate)} - {getDateShort(classItem.endDate)}</span>
              </div>
            </div>

            {/* Date & Time - Desktop */}
            <div className="hidden lg:block space-y-2">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Calendar className="h-5 w-5" />
                <span>{getDateShort(classItem.startDate)} - {getDateShort(classItem.endDate)}</span>
              </div>
            </div>

            {/* Enrollment Status Banner */}
            {userEnrollment && (
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>You are enrolled in this class</span>
                </div>
              </div>
            )}

            {/* About This Class */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold">About This Class</h2>
              <div className="prose prose-invert max-w-none">
                {classItem.description ? (
                  <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                    <ExpandableText text={classItem.description} maxChars={300} />
                  </div>
                ) : (
                  <p className="text-muted-foreground">No description available for this class.</p>
                )}
                {/* Desktop: Additional Class Details */}
                <div className="hidden lg:block mt-6 space-y-4">
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
            </div>
          </div>

          {/* Left Panel - Desktop Sidebar + Mobile Collapsible Details */}
          <div className="space-y-4 sm:space-y-6 order-5 lg:order-1">
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
                    {user && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Your Status</p>
                        <p className="font-medium flex items-center gap-2">
                          {userEnrollment ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              <span className="text-green-700 dark:text-green-300">Enrolled</span>
                              {userEnrollment.enrolledAt && (
                                <span className="text-xs text-muted-foreground font-normal">
                                  ({format(userEnrollment.enrolledAt, "MMM d, yyyy")})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">Not Enrolled</span>
                          )}
                        </p>
                      </div>
                    )}
                    {classItem.category && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Category</p>
                        <span className="inline-block rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {classItem.category}
                        </span>
                      </div>
                    )}
                  </div>
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

              {/* Mentor */}
              {mentor && (
                <AccordionItem value="mentor" className="border-b border-border">
                  <AccordionTrigger className="text-sm font-medium py-3">
                    Mentor
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="flex items-center gap-2">
                      {mentor.avatar ? (
                        <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-background">
                          <Image
                            src={mentor.avatar}
                            alt={mentor.name}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span className="text-sm font-medium">{mentor.name}</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Enrollment Actions - Mobile (after accordion) */}
            <div className="lg:hidden space-y-4 pt-2">
              {!userEnrollment ? (
                <>
                  {isEnded ? (
                    <Button size="lg" variant="outline" className="w-full" disabled>
                      Class Ended
                    </Button>
                  ) : classItem.published && !classItem.enrollmentLocked ? (
                    <Button size="lg" className="w-full" asChild>
                      <Link href={`/academy/classes/${classItem.id}/enroll`}>
                        Enroll Now
                      </Link>
                    </Button>
                  ) : classItem.enrollmentLocked ? (
                    <Button size="lg" variant="outline" className="w-full" disabled>
                      Enrollment Locked
                    </Button>
                  ) : !classItem.published ? (
                    <Button size="lg" variant="outline" className="w-full" disabled>
                      Not Published
                    </Button>
                  ) : null}
                </>
              ) : (
                <Button size="lg" className="w-full" asChild>
                  <Link href={`/class/${classItem.id}`}>
                    Enter Class
                  </Link>
                </Button>
              )}
            </div>

            {/* Desktop: Full Details (unchanged) */}
            <div className="hidden lg:block bg-card rounded-lg p-4 border border-border space-y-4">
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
                  {userEnrollment && userEnrollment.enrolledAt && (
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
                    {mentor.avatar ? (
                      <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-background">
                        <Image
                          src={mentor.avatar}
                          alt={mentor.name}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                    )}
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
              </div>
            </div>

            {/* Enrollment Actions - Desktop */}
            <div className="hidden lg:block space-y-4 pt-4">
              {!userEnrollment ? (
                <>
                  {isEnded ? (
                    <Button size="lg" variant="outline" className="w-full" disabled>
                      Class Ended
                    </Button>
                  ) : classItem.published && !classItem.enrollmentLocked ? (
                    <Button size="lg" className="w-full" asChild>
                      <Link href={`/academy/classes/${classItem.id}/enroll`}>
                        Enroll Now
                      </Link>
                    </Button>
                  ) : classItem.enrollmentLocked ? (
                    <Button size="lg" variant="outline" className="w-full" disabled>
                      Enrollment Locked
                    </Button>
                  ) : !classItem.published ? (
                    <Button size="lg" variant="outline" className="w-full" disabled>
                      Not Published
                    </Button>
                  ) : null}
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

