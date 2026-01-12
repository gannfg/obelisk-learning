"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Users, Trophy, Flame } from "lucide-react";
import { format } from "date-fns";
import type { ClassWithModules } from "@/lib/classes";
import { getWeekAttendance, getClassWeekAttendance, markWeekAttendance, getAttendanceStats } from "@/lib/classroom";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { getClassEnrollments } from "@/lib/classes";
import { StatusBadge } from "./status-badge";
import { ProgressBar } from "./progress-bar";
import type { AttendanceStats } from "@/types/classes";

interface ClassroomAttendanceProps {
  classId: string;
  classItem: ClassWithModules;
  userId: string;
  isInstructor: boolean;
}

export function ClassroomAttendance({
  classId,
  classItem,
  userId,
  isInstructor,
}: ClassroomAttendanceProps) {
  const [userAttendance, setUserAttendance] = useState<Record<number, any>>({});
  const [allAttendance, setAllAttendance] = useState<Record<number, any[]>>({});
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState<number | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createLearningClient();
      if (!supabase) return;

      try {
        // Get total weeks from modules
        const totalWeeks = classItem.modules?.length || 0;

        if (isInstructor) {
          // Load all attendance for all weeks
          const allAtt: Record<number, any[]> = {};
          for (let week = 1; week <= totalWeeks; week++) {
            const attendance = await getClassWeekAttendance(classId, week, supabase);
            allAtt[week] = attendance;
          }
          setAllAttendance(allAtt);

          // Load enrollments
          const enrolls = await getClassEnrollments(classId, supabase);
          setEnrollments(enrolls.filter((e) => e.status === "active"));
        } else {
          // Load user's attendance
          const attendance = await getWeekAttendance(classId, userId, supabase);
          const attendanceMap: Record<number, any> = {};
          attendance.forEach((a) => {
            attendanceMap[a.weekNumber] = a;
          });
          setUserAttendance(attendanceMap);

          // Load attendance statistics
          const stats = await getAttendanceStats(classId, userId, supabase);
          setAttendanceStats(stats);
        }
      } catch (error) {
        console.error("Error loading attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [classId, userId, isInstructor, classItem.modules]);

  const handleMarkAttendance = async (weekNumber: number) => {
    setMarkingAttendance(weekNumber);
    try {
      const supabase = createLearningClient();
      if (!supabase) return;

      const attendance = await markWeekAttendance(
        classId,
        userId,
        weekNumber,
        "manual",
        userId,
        supabase
      );

      if (attendance) {
        setUserAttendance((prev) => ({
          ...prev,
          [weekNumber]: attendance,
        }));
        // Reload attendance stats
        const supabase = createLearningClient();
        if (supabase) {
          const stats = await getAttendanceStats(classId, userId, supabase);
          setAttendanceStats(stats);
        }
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
    } finally {
      setMarkingAttendance(null);
    }
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const startDate = classItem.startDate;
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  };

  const totalWeeks = classItem.modules?.length || 0;
  const currentWeek = getCurrentWeek();

  if (loading) {
    return <div className="text-center py-8">Loading attendance...</div>;
  }

  return (
    <div className="space-y-6">
      {isInstructor ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Class Attendance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Total Students: {enrollments.length}
              </p>
              <div className="space-y-4">
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
                  const weekAttendance = allAttendance[week] || [];
                  const attendanceCount = weekAttendance.length;
                  const attendanceRate = enrollments.length > 0
                    ? (attendanceCount / enrollments.length) * 100
                    : 0;

                  return (
                    <Card key={week}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Week {week}</CardTitle>
                          {week === currentWeek && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Current Week
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Attendance Rate</span>
                            <span className="font-medium">
                              {attendanceCount} / {enrollments.length} ({Math.round(attendanceRate)}%)
                            </span>
                          </div>
                          <ProgressBar value={attendanceRate} max={100} size="sm" showLabel={false} />
                          {weekAttendance.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold mb-2">Present Students</p>
                              <div className="space-y-1">
                                {weekAttendance.map((att) => (
                                  <div
                                    key={att.id}
                                    className="flex items-center justify-between text-sm p-2 bg-muted rounded"
                                  >
                                    <span>User {att.userId.substring(0, 8)}...</span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(att.checkedInAt, "MMM d, h:mm a")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Attendance Statistics Card */}
          {attendanceStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Attendance Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall Attendance</span>
                    <span className="font-semibold">
                      {attendanceStats.attendedWeeks} / {attendanceStats.totalWeeks} weeks ({attendanceStats.percentage}%)
                    </span>
                  </div>
                  <ProgressBar value={attendanceStats.percentage} max={100} size="md" showLabel={false} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Flame className="h-4 w-4 text-orange-600" />
                      <span>Current Streak</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {attendanceStats.currentStreak} {attendanceStats.currentStreak === 1 ? "week" : "weeks"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                      <span>Longest Streak</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {attendanceStats.longestStreak} {attendanceStats.longestStreak === 1 ? "week" : "weeks"}
                    </p>
                  </div>
                </div>
                {attendanceStats.perfectAttendance && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <Trophy className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-500">
                      Perfect Attendance! 🎉
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Your Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
                  const attendance = userAttendance[week];
                  const isCurrentWeek = week === currentWeek;
                  const isPastWeek = week < currentWeek;
                  const isFutureWeek = week > currentWeek;

                  // Determine status
                  let status: "completed" | "pending" | "overdue" | "locked" = "pending";
                  if (attendance) {
                    status = "completed";
                  } else if (isFutureWeek) {
                    status = "locked";
                  } else if (isPastWeek) {
                    status = "overdue";
                  }

                  return (
                    <div
                      key={week}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <StatusBadge status={status} size="sm" />
                        <div className="flex-1">
                          <p className="font-medium">Week {week}</p>
                          {attendance ? (
                            <p className="text-sm text-muted-foreground">
                              Checked in on {format(attendance.checkedInAt, "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          ) : isCurrentWeek ? (
                            <p className="text-sm text-muted-foreground">Not checked in yet</p>
                          ) : isPastWeek ? (
                            <p className="text-sm text-red-700 dark:text-red-600">Absent</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Upcoming</p>
                          )}
                        </div>
                      </div>
                      {isCurrentWeek && !attendance && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAttendance(week)}
                          disabled={markingAttendance === week}
                        >
                          {markingAttendance === week ? "Marking..." : "Mark Attendance"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

