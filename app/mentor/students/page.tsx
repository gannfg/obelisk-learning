"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMentor } from "@/lib/hooks/use-mentor";
import { useAuth } from "@/lib/hooks/use-auth";
import { getAllClasses, getClassEnrollments, Class, ClassEnrollment } from "@/lib/classes";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Mail, Calendar, BookOpen, UserCheck, UserX, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface StudentInfo {
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  enrollments: {
    classId: string;
    className: string;
    enrolledAt: Date;
    status: string;
  }[];
}

export default function MentorStudentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isMentor, loading: mentorLoading } = useMentor();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | "all">("all");

  useEffect(() => {
    if (!mentorLoading && !isMentor) {
      router.replace("/");
      return;
    }

    if (isMentor && user) {
      loadData();
    }
  }, [mentorLoading, isMentor, user, router]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const learningSupabase = createLearningClient();
      if (!learningSupabase) {
        return;
      }

      // Load all classes created by this mentor
      const mentorClasses = await getAllClasses({ createdBy: user.id }, learningSupabase);
      setClasses(mentorClasses);

      // Get all enrollments for mentor's classes
      const allEnrollments: Array<{ enrollment: ClassEnrollment; classId: string; className: string }> = [];
      
      for (const classItem of mentorClasses) {
        const enrollments = await getClassEnrollments(classItem.id, learningSupabase);
        enrollments.forEach((enrollment) => {
          allEnrollments.push({
            enrollment,
            classId: classItem.id,
            className: classItem.title,
          });
        });
      }

      // Group enrollments by user
      const studentsMap = new Map<string, StudentInfo>();
      const authSupabase = createClient();

      for (const { enrollment, classId, className } of allEnrollments) {
        if (!studentsMap.has(enrollment.userId)) {
          // Fetch user profile
          try {
            const profile = await getUserProfile(enrollment.userId, undefined, authSupabase);
            studentsMap.set(enrollment.userId, {
              userId: enrollment.userId,
              email: profile?.email || "Unknown",
              name:
                profile?.first_name ||
                profile?.username ||
                profile?.email?.split("@")[0] ||
                "Unknown User",
              avatar: profile?.image_url || undefined,
              enrollments: [],
            });
          } catch {
            studentsMap.set(enrollment.userId, {
              userId: enrollment.userId,
              email: "Unknown",
              name: "Unknown User",
              enrollments: [],
            });
          }
        }

        const student = studentsMap.get(enrollment.userId)!;
        student.enrollments.push({
          classId,
          className,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status,
        });
      }

      setStudents(Array.from(studentsMap.values()));
    } catch (error) {
      console.error("Error loading students:", error);
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

  // Filter students based on search and selected class
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass =
      selectedClassId === "all" ||
      student.enrollments.some((e) => e.classId === selectedClassId);

    return matchesSearch && matchesClass;
  });

  // Get unique students count
  const totalStudents = new Set(students.map((s) => s.userId)).size;
  const activeEnrollments = students.reduce(
    (sum, s) => sum + s.enrollments.filter((e) => e.status === "active").length,
    0
  );

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

      <div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">My Students</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          View and manage students enrolled in your classes.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique students across all classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Classes you created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Classes</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No students found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || selectedClassId !== "all"
                ? "Try adjusting your filters"
                : "No students have enrolled in your classes yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <Card key={student.userId}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {student.avatar ? (
                      <Image
                        src={student.avatar}
                        alt={student.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-lg font-medium">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{student.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{student.email}</span>
                          </div>
                        </div>

                        {/* Enrollments */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium mb-2">Enrolled Classes:</p>
                          <div className="flex flex-wrap gap-2">
                            {student.enrollments.map((enrollment) => (
                              <div
                                key={`${enrollment.classId}-${student.userId}`}
                                className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50"
                              >
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {enrollment.className}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant={
                                        enrollment.status === "active"
                                          ? "default"
                                          : enrollment.status === "completed"
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className="text-xs"
                                    >
                                      {enrollment.status === "active" ? (
                                        <UserCheck className="h-3 w-3 mr-1" />
                                      ) : (
                                        <UserX className="h-3 w-3 mr-1" />
                                      )}
                                      {enrollment.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {enrollment.enrolledAt.toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

