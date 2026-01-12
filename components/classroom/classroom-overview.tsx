"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, BookOpen, CheckCircle2, AlertCircle, ExternalLink, Trophy } from "lucide-react";
import { format } from "date-fns";
import type { ClassWithModules } from "@/lib/classes";
import { getNextSession, getStudentProgress, getClassAnnouncements, getClassAssignments, getOverallClassProgress, checkAndMarkClassCompletion } from "@/lib/classroom";
import { getClassBadgeConfig, awardClassBadges } from "@/lib/classes";
import { createLearningClient } from "@/lib/supabase/learning-client";
import Link from "next/link";
import { MarkdownContent } from "@/components/markdown-content";
import { ProgressBar } from "./progress-bar";
import type { ClassProgress, ClassBadgeConfig } from "@/types/classes";
import Image from "next/image";

interface ClassroomOverviewProps {
  classId: string;
  classItem: ClassWithModules;
  userId: string;
  isInstructor: boolean;
}

export function ClassroomOverview({
  classId,
  classItem,
  userId,
  isInstructor,
}: ClassroomOverviewProps) {
  const [nextSession, setNextSession] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [classProgress, setClassProgress] = useState<ClassProgress | null>(null);
  const [latestAnnouncement, setLatestAnnouncement] = useState<any>(null);
  const [upcomingAssignment, setUpcomingAssignment] = useState<any>(null);
  const [badgeConfigs, setBadgeConfigs] = useState<ClassBadgeConfig[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createLearningClient();
      if (!supabase) return;

      try {
        // Load next session
        const session = await getNextSession(classId, supabase);
        setNextSession(session);

        // Load progress (for students)
        if (!isInstructor) {
          const prog = await getStudentProgress(classId, userId, supabase);
          setProgress(prog);

          // Load detailed class progress
          const classProg = await getOverallClassProgress(classId, userId, supabase);
          setClassProgress(classProg);

          // If progress is 100%, ensure enrollment is marked completed and badges are awarded
          if (classProg && classProg.overall === 100) {
            try {
              // Mark enrollment as completed (idempotent)
              await checkAndMarkClassCompletion(classId, userId, supabase);
              // Ensure class badges are awarded (idempotent)
              await awardClassBadges(classId, userId, supabase);
            } catch (completionError) {
              console.error("Error finalizing class completion state:", completionError);
            }
          }

          // Load badge configs
          const badges = await getClassBadgeConfig(classId, supabase);
          setBadgeConfigs(badges.filter(b => b.enabled));

          // Check which badges are earned
          const { data: userBadges } = await supabase
            .from("badges")
            .select("badge_name")
            .eq("user_id", userId)
            .in("badge_name", badges.map(b => b.badgeName));

          if (userBadges) {
            setEarnedBadges(new Set(userBadges.map(b => b.badge_name)));
          }
        }

        // Load latest announcement
        const announcements = await getClassAnnouncements(classId, supabase);
        if (announcements && announcements.length > 0) {
          setLatestAnnouncement(announcements[0]);
        }

        // Load upcoming assignment
        const assignments = await getClassAssignments(classId, supabase);
        const upcoming = assignments
          .filter((a: any) => new Date(a.dueDate) > new Date())
          .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
        setUpcomingAssignment(upcoming);
      } catch (error) {
        console.error("Error loading overview data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [classId, userId, isInstructor]);

  const meetingLink = classItem.meetingLink || nextSession?.meetingLink;

  return (
    <div className="space-y-6">
      {/* Next Session */}
      {nextSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Next Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextSession.session ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Session Date</p>
                  <p className="font-medium">
                    {format(nextSession.session.sessionDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Title</p>
                  <p className="font-medium">{nextSession.session.title}</p>
                </div>
                {nextSession.session.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{nextSession.session.description}</p>
                  </div>
                )}
              </>
            ) : nextSession.module ? (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Next Module</p>
                <p className="font-medium">Week {nextSession.module.week_number}: {nextSession.module.title}</p>
                {nextSession.module.start_date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Starts: {format(new Date(nextSession.module.start_date), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            ) : null}
            {meetingLink && (
              <Button asChild variant="outline" className="w-full">
                <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Join Meeting
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student Progress Dashboard */}
      {!isInstructor && classProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Progress - Circular Indicator */}
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - classProgress.overall / 100)}`}
                    className="text-primary transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{classProgress.overall}%</p>
                    <p className="text-xs text-muted-foreground">Complete</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Modules */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Modules</span>
                      <span className="font-semibold">
                        {classProgress.modules.completed} / {classProgress.modules.total}
                      </span>
                    </div>
                    <ProgressBar value={classProgress.modules.percentage} max={100} size="sm" showLabel={false} />
                    <p className="text-xs text-muted-foreground">{classProgress.modules.percentage}% complete</p>
                  </div>
                </CardContent>
              </Card>

              {/* Assignments */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Assignments</span>
                      <span className="font-semibold">
                        {classProgress.assignments.completed} / {classProgress.assignments.total}
                      </span>
                    </div>
                    <ProgressBar value={classProgress.assignments.percentage} max={100} size="sm" showLabel={false} />
                    <p className="text-xs text-muted-foreground">{classProgress.assignments.percentage}% complete</p>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Attendance</span>
                      <span className="font-semibold">
                        {classProgress.attendance.attended} / {classProgress.attendance.total}
                      </span>
                    </div>
                    <ProgressBar value={classProgress.attendance.percentage} max={100} size="sm" showLabel={false} />
                    <p className="text-xs text-muted-foreground">{classProgress.attendance.percentage}% complete</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Completion Timeline */}
            {classItem.modules && classItem.modules.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Module Timeline</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {classItem.modules.map((module, index) => {
                    const isCompleted = classProgress.modules.completed > index;
                    const isInProgress = classProgress.modules.completed === index;
                    return (
                      <div
                        key={module.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          isCompleted
                            ? "bg-green-500/10 text-green-700 dark:text-green-500 border border-green-500/20"
                            : isInProgress
                            ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border border-yellow-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border-2 border-current" />
                        )}
                        <span>Week {module.weekNumber}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Badge Preview */}
            {badgeConfigs.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Class Badges
                </h4>
                <div className="flex items-center gap-3 flex-wrap">
                  {badgeConfigs.map((badge) => {
                    const isEarned = earnedBadges.has(badge.badgeName);
                    return (
                      <div
                        key={badge.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border ${
                          isEarned
                            ? "bg-green-500/10 border-green-500/20"
                            : "bg-muted border-border opacity-60"
                        }`}
                        title={badge.badgeDescription || badge.badgeName}
                      >
                        {badge.badgeImageUrl ? (
                          <div className="relative h-8 w-8">
                            <Image
                              src={badge.badgeImageUrl}
                              alt={badge.badgeName}
                              fill
                              className="object-contain"
                              sizes="32px"
                            />
                          </div>
                        ) : (
                          <Trophy className={`h-6 w-6 ${isEarned ? "text-green-600" : "text-muted-foreground"}`} />
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{badge.badgeName}</span>
                          {isEarned && (
                            <span className="text-xs text-green-600 dark:text-green-500">Earned</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Latest Announcement */}
      {latestAnnouncement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Latest Announcement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{latestAnnouncement.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {format(latestAnnouncement.createdAt, "MMM d, yyyy")}
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownContent content={latestAnnouncement.content} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Assignment */}
      {upcomingAssignment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Upcoming Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="font-semibold">{upcomingAssignment.title}</h3>
              {upcomingAssignment.description && (
                <p className="text-sm text-muted-foreground">{upcomingAssignment.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span className="text-muted-foreground">
                  Due: {format(upcomingAssignment.dueDate, "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <Button asChild variant="outline" className="mt-4">
                <Link href={`/class/${classId}?tab=assignments`}>View Assignment</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class Info */}
      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Semester</p>
            <p className="font-medium">{classItem.semester}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Duration</p>
            <p className="font-medium">
              {format(classItem.startDate, "MMM d, yyyy")} - {format(classItem.endDate, "MMM d, yyyy")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <p className="font-medium capitalize">{classItem.status}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

