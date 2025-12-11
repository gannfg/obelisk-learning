"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, BookOpen, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { ClassWithModules } from "@/lib/classes";
import { getNextSession, getStudentProgress, getClassAnnouncements, getClassAssignments } from "@/lib/classroom";
import { createLearningClient } from "@/lib/supabase/learning-client";
import Link from "next/link";
import { MarkdownContent } from "@/components/markdown-content";

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
  const [latestAnnouncement, setLatestAnnouncement] = useState<any>(null);
  const [upcomingAssignment, setUpcomingAssignment] = useState<any>(null);
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

      {/* Student Progress Summary */}
      {!isInstructor && progress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Modules Unlocked</p>
                <p className="text-2xl font-bold">
                  {progress.unlockedModules} / {progress.totalModules}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="text-2xl font-bold">{progress.attendanceCount} weeks</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assignments</p>
                <p className="text-2xl font-bold">
                  {progress.submittedAssignments} / {progress.totalAssignments}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl font-bold">
                  {progress.totalAssignments > 0
                    ? Math.round((progress.submittedAssignments / progress.totalAssignments) * 100)
                    : 0}%
                </p>
              </div>
            </div>
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

