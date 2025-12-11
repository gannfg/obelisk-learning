"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/lib/hooks/use-admin";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassModules,
  createModule,
  updateModule,
  deleteModule,
  getModuleSessions,
  createSession,
  getClassEnrollments,
  enrollUser,
  removeEnrollment,
  getModuleAssignments,
  createAssignment,
  getClassAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getClassStats,
  generateSessionQR,
  getSessionAttendance,
  markAttendance,
  removeAttendance,
  getAssignmentSubmissions,
  updateSubmissionStatus,
  getClassXPConfig,
  upsertXPConfig,
  updateModuleLearningMaterials,
} from "@/lib/classes";
import type {
  Class,
  ClassModule,
  LiveSession,
  ClassEnrollment,
  ClassAssignment,
  ClassAnnouncement,
  ClassStats,
  SessionAttendance,
  AssignmentSubmission,
  ClassXPConfig,
  LearningMaterial,
  SubmissionStatus,
  XPActionType,
} from "@/types/classes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  BookOpen,
  FileText,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  QrCode,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { uploadCourseImage } from "@/lib/storage";
import { COURSE_CATEGORIES } from "@/lib/categories";
import Image from "next/image";

export default function AdminClassesPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [modules, setModules] = useState<ClassModule[]>([]);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [announcements, setAnnouncements] = useState<ClassAnnouncement[]>([]);
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<SessionAttendance[]>([]);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<ClassAssignment | null>(null);
  const [xpConfigs, setXpConfigs] = useState<ClassXPConfig[]>([]);

  // Dialog states
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [classDialogError, setClassDialogError] = useState<string | null>(null);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [xpConfigDialogOpen, setXpConfigDialogOpen] = useState(false);
  const [learningMaterialsDialogOpen, setLearningMaterialsDialogOpen] = useState(false);

  // Form states
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingModule, setEditingModule] = useState<ClassModule | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Class form
  const [classForm, setClassForm] = useState({
    title: "",
    description: "",
    thumbnail: "",
    category: "",
    semester: "",
    startDate: "",
    endDate: "",
    maxCapacity: "",
    published: false,
    enrollmentLocked: false,
    mentorId: "",
  });

  // Module form
  const [moduleForm, setModuleForm] = useState({
    weekNumber: 1,
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    liveSessionLink: "",
  });

  // Session form
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    sessionDate: "",
    sessionTime: "",
    locationType: "online" as "online" | "offline",
    location: "",
    meetingLink: "",
    attendanceTracking: true,
  });

  // Assignment form
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
    dueTime: "",
    submissionType: "text" as "text" | "file" | "url" | "git",
    xpReward: 0,
    lockAfterDeadline: false,
  });

  // Announcement form
  const [announcementForm, setAnnouncementForm] = useState<{
    title: string;
    content: string;
    pinned: boolean;
    moduleId?: string;
  }>({
    title: "",
    content: "",
    pinned: false,
    moduleId: undefined,
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState<ClassAnnouncement | null>(null);

  // Attendance form
  const [attendanceUserId, setAttendanceUserId] = useState("");

  // Submission review form
  const [submissionReviewForm, setSubmissionReviewForm] = useState({
    status: "submitted" as SubmissionStatus,
    feedback: "",
  });
  const [editingSubmission, setEditingSubmission] = useState<AssignmentSubmission | null>(null);

  // XP Config form
  const [xpConfigForm, setXpConfigForm] = useState({
    actionType: "session_attendance" as XPActionType,
    xpAmount: 0,
    enabled: true,
  });

  // Learning materials form
  const [learningMaterialsForm, setLearningMaterialsForm] = useState<LearningMaterial[]>([]);
  const [editingModuleForMaterials, setEditingModuleForMaterials] = useState<ClassModule | null>(null);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      router.push("/");
      return;
    }
    loadClasses();
  }, [isAdmin, adminLoading]);

  useEffect(() => {
    if (selectedClass) {
      loadClassData(selectedClass.id);
      loadXPConfigs(selectedClass.id);
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const supabase = createLearningClient();
      if (!supabase) {
        setError("Supabase client not configured.");
        setLoading(false);
        return;
      }
      const data = await getAllClasses(undefined, supabase);
      setClasses(data);
    } catch (error) {
      console.error("Error loading classes:", error);
      setError("Failed to load classes.");
    } finally {
      setLoading(false);
    }
  };

  const loadClassData = async (classId: string) => {
    try {
      const supabase = createLearningClient();
      if (!supabase) {
        console.error("Supabase client not configured.");
        return;
      }
      const [modulesData, enrollmentsData, announcementsData, statsData] = await Promise.all([
        getClassModules(classId, supabase),
        getClassEnrollments(classId, supabase),
        getClassAnnouncements(classId, supabase),
        getClassStats(classId, supabase),
      ]);
      setModules(modulesData);
      setEnrollments(enrollmentsData);
      setAnnouncements(announcementsData);
      setStats(statsData);

      // Load sessions for all modules
      const allSessions: LiveSession[] = [];
      for (const module of modulesData) {
        const moduleSessions = await getModuleSessions(module.id, supabase);
        allSessions.push(...moduleSessions);
      }
      setSessions(allSessions);

      // Load assignments for all modules
      const allAssignments: ClassAssignment[] = [];
      for (const module of modulesData) {
        const moduleAssignments = await getModuleAssignments(module.id, supabase);
        allAssignments.push(...moduleAssignments);
      }
      setAssignments(allAssignments);
    } catch (error) {
      console.error("Error loading class data:", error);
    }
  };

  const handleCreateClass = async () => {
    if (!classForm.title || !classForm.semester || !classForm.startDate || !classForm.endDate) {
      setClassDialogError("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    setClassDialogError(null);

    try {
      // Use Auth Supabase for authentication
      const authSupabase = createClient();
      if (!authSupabase) {
        setClassDialogError("Supabase client not configured.");
        setSaving(false);
        return;
      }
      const { data: { user } } = await authSupabase.auth.getUser();
      if (!user) {
        setClassDialogError("Not authenticated.");
        setSaving(false);
        return;
      }

      // Use Learning Supabase for database operations
      const learningSupabase = createLearningClient();
      if (!learningSupabase) {
        setClassDialogError("Supabase client not configured.");
        setSaving(false);
        return;
      }
      let thumbnailUrl = classForm.thumbnail;
      if (imageFile) {
        thumbnailUrl = await uploadCourseImage(imageFile, null, learningSupabase) || "";
      }

      const startDateTime = new Date(`${classForm.startDate}T00:00:00`);
      const endDateTime = new Date(`${classForm.endDate}T23:59:59`);

      const newClass = await createClass(
        {
          title: classForm.title,
          description: classForm.description || undefined,
          thumbnail: thumbnailUrl || undefined,
          category: classForm.category || undefined,
          semester: classForm.semester,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          maxCapacity: classForm.maxCapacity ? parseInt(classForm.maxCapacity) : undefined,
          published: classForm.published,
          enrollmentLocked: classForm.enrollmentLocked,
          mentorId: classForm.mentorId || user.id,
        },
        user.id,
        learningSupabase
      );

      if (newClass) {
        setSuccess("Class created successfully!");
        setClassDialogOpen(false);
        setClassDialogError(null);
        resetClassForm();
        await loadClasses();
      } else {
        setClassDialogError("Failed to create class. Please check the console for details.");
      }
    } catch (error: any) {
      console.error("Error creating class:", error);
      const errorMessage = error?.message || error?.toString() || "Failed to create class.";
      setClassDialogError(`Error: ${errorMessage}. Please ensure the classes schema has been run in your Supabase database.`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;

    if (!classForm.title || !classForm.semester || !classForm.startDate || !classForm.endDate) {
      setClassDialogError("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    setClassDialogError(null);

    try {
      const supabase = createLearningClient();
      if (!supabase) {
        setClassDialogError("Supabase client not configured.");
        setSaving(false);
        return;
      }
      let thumbnailUrl = classForm.thumbnail;
      if (imageFile) {
        thumbnailUrl = await uploadCourseImage(imageFile, editingClass.id, supabase) || classForm.thumbnail;
      }

      const startDateTime = new Date(`${classForm.startDate}T00:00:00`);
      const endDateTime = new Date(`${classForm.endDate}T23:59:59`);

      const updated = await updateClass(
        {
          id: editingClass.id,
          title: classForm.title,
          description: classForm.description || undefined,
          thumbnail: thumbnailUrl || undefined,
          category: classForm.category || undefined,
          semester: classForm.semester,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          maxCapacity: classForm.maxCapacity ? parseInt(classForm.maxCapacity) : undefined,
          published: classForm.published,
          enrollmentLocked: classForm.enrollmentLocked,
        },
        supabase
      );

      if (updated) {
        setSuccess("Class updated successfully!");
        setClassDialogOpen(false);
        setClassDialogError(null);
        setEditingClass(null);
        resetClassForm();
        await loadClasses();
        if (selectedClass?.id === updated.id) {
          setSelectedClass(updated);
        }
      } else {
        setClassDialogError("Failed to update class.");
      }
    } catch (error: any) {
      console.error("Error updating class:", error);
      setClassDialogError(error.message || "Failed to update class.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
      return;
    }

    try {
      const supabase = createLearningClient();
      if (!supabase) {
        setError("Supabase client not configured.");
        return;
      }
      const success = await deleteClass(classId, supabase);
      if (success) {
        setSuccess("Class deleted successfully!");
        await loadClasses();
        if (selectedClass?.id === classId) {
          setSelectedClass(null);
        }
      } else {
        setError("Failed to delete class.");
      }
    } catch (error: any) {
      console.error("Error deleting class:", error);
      setError(error.message || "Failed to delete class.");
    }
  };

  const handleEnrollUser = async (userIdentifier: string) => {
    if (!selectedClass) return;

    setSaving(true);
    setError(null);

    try {
      // Use Auth Supabase for authentication and user lookup
      const authSupabase = createClient();
      if (!authSupabase) {
        setError("Supabase client not configured.");
        setSaving(false);
        return;
      }
      const { data: { user: currentUser } } = await authSupabase.auth.getUser();
      if (!currentUser) {
        setError("Not authenticated.");
        setSaving(false);
        return;
      }

      // Try to find user by email or ID
      let userId: string | null = null;

      // Check if it's a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(userIdentifier)) {
        userId = userIdentifier;
      } else {
        // Try to find by email (users table is in Auth Supabase)
        const { data: userData } = await authSupabase
          .from("users")
          .select("id")
          .eq("email", userIdentifier)
          .single();

        if (userData) {
          userId = userData.id;
        }
      }

      if (!userId) {
        setError("User not found. Please check the user ID or email.");
        setSaving(false);
        return;
      }

      // Check if already enrolled
      const existing = enrollments.find((e) => e.userId === userId);
      if (existing) {
        setError("User is already enrolled in this class.");
        setSaving(false);
        return;
      }

      // Check capacity
      if (selectedClass.maxCapacity && enrollments.length >= selectedClass.maxCapacity) {
        setError("Class is at maximum capacity.");
        setSaving(false);
        return;
      }

      // Use Learning Supabase for enrollment operations
      const learningSupabase = createLearningClient();
      if (!learningSupabase) {
        setError("Supabase client not configured.");
        setSaving(false);
        return;
      }
      const enrollment = await enrollUser(selectedClass.id, userId, currentUser.id, learningSupabase);

      if (enrollment) {
        setSuccess("Student enrolled successfully!");
        setEnrollmentDialogOpen(false);
        await loadClassData(selectedClass.id);
        // Clear input
        const input = document.getElementById("enrollment-user-input") as HTMLInputElement;
        if (input) input.value = "";
      } else {
        setError("Failed to enroll student.");
      }
    } catch (error: any) {
      console.error("Error enrolling user:", error);
      setError(error.message || "Failed to enroll student.");
    } finally {
      setSaving(false);
    }
  };

  const loadXPConfigs = async (classId: string) => {
    try {
      const supabase = createLearningClient();
      if (!supabase) return;
      const configs = await getClassXPConfig(classId, supabase);
      setXpConfigs(configs);
    } catch (error) {
      console.error("Error loading XP configs:", error);
    }
  };

  const handleGenerateQR = async (sessionId: string) => {
    try {
      const supabase = createLearningClient();
      if (!supabase) return;
      const qrToken = await generateSessionQR(sessionId, supabase);
      if (qrToken) {
        setSuccess("QR code generated successfully!");
        await loadClassData(selectedClass!.id);
        setQrDialogOpen(true);
      }
    } catch (error) {
      console.error("Error generating QR:", error);
      setError("Failed to generate QR code.");
    }
  };

  const handleLoadAttendance = async (sessionId: string) => {
    try {
      const supabase = createLearningClient();
      if (!supabase) return;
      const attendance = await getSessionAttendance(sessionId, supabase);
      setAttendanceRecords(attendance);
      const session = sessions.find((s) => s.id === sessionId);
      setSelectedSession(session || null);
      setAttendanceDialogOpen(true);
    } catch (error) {
      console.error("Error loading attendance:", error);
      setError("Failed to load attendance.");
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedSession || !attendanceUserId || !selectedClass) return;
    try {
      const authSupabase = createClient();
      if (!authSupabase) return;
      const { data: { user } } = await authSupabase.auth.getUser();
      if (!user) return;

      const learningSupabase = createLearningClient();
      if (!learningSupabase) return;
      await markAttendance(selectedSession.id, attendanceUserId, selectedClass.id, user.id, learningSupabase);
      setSuccess("Attendance marked successfully!");
      setAttendanceUserId("");
      await handleLoadAttendance(selectedSession.id);
    } catch (error) {
      console.error("Error marking attendance:", error);
      setError("Failed to mark attendance.");
    }
  };

  const handleRemoveAttendance = async (attendanceId: string) => {
    if (!confirm("Remove this attendance record?")) return;
    try {
      const supabase = createLearningClient();
      if (!supabase) return;
      await removeAttendance(attendanceId, supabase);
      setSuccess("Attendance removed successfully!");
      if (selectedSession) {
        await handleLoadAttendance(selectedSession.id);
      }
    } catch (error) {
      console.error("Error removing attendance:", error);
      setError("Failed to remove attendance.");
    }
  };

  const handleUpdateSubmission = async () => {
    if (!editingSubmission) return;
    try {
      const authSupabase = createClient();
      if (!authSupabase) return;
      const { data: { user } } = await authSupabase.auth.getUser();
      if (!user) return;

      const learningSupabase = createLearningClient();
      if (!learningSupabase) return;
      await updateSubmissionStatus(
        editingSubmission.id,
        submissionReviewForm.status,
        submissionReviewForm.feedback,
        user.id,
        learningSupabase
      );
      setSuccess("Submission updated successfully!");
      setSubmissionsDialogOpen(false);
      if (selectedAssignment) {
        const subs = await getAssignmentSubmissions(selectedAssignment.id, learningSupabase);
        setSubmissions(subs);
      }
    } catch (error) {
      console.error("Error updating submission:", error);
      setError("Failed to update submission.");
    }
  };

  const handleUpsertXPConfig = async () => {
    if (!selectedClass) return;
    try {
      const supabase = createLearningClient();
      if (!supabase) return;
      await upsertXPConfig(
        selectedClass.id,
        xpConfigForm.actionType,
        xpConfigForm.xpAmount,
        xpConfigForm.enabled,
        supabase
      );
      setSuccess("XP config updated successfully!");
      setXpConfigDialogOpen(false);
      await loadXPConfigs(selectedClass.id);
    } catch (error) {
      console.error("Error updating XP config:", error);
      setError("Failed to update XP config.");
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement) return;
    try {
      const supabase = createLearningClient();
      if (!supabase) return;
      await updateAnnouncement(editingAnnouncement.id, announcementForm, supabase);
      setSuccess("Announcement updated successfully!");
      setAnnouncementDialogOpen(false);
      setEditingAnnouncement(null);
      await loadClassData(selectedClass!.id);
    } catch (error) {
      console.error("Error updating announcement:", error);
      setError("Failed to update announcement.");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const supabase = createLearningClient();
      if (!supabase) return;
      await deleteAnnouncement(id, supabase);
      setSuccess("Announcement deleted successfully!");
      await loadClassData(selectedClass!.id);
    } catch (error) {
      console.error("Error deleting announcement:", error);
      setError("Failed to delete announcement.");
    }
  };

  const handleUpdateLearningMaterials = async () => {
    if (!editingModuleForMaterials) return;
    try {
      const supabase = createLearningClient();
      if (!supabase) return;
      await updateModuleLearningMaterials(editingModuleForMaterials.id, learningMaterialsForm, supabase);
      setSuccess("Learning materials updated successfully!");
      setLearningMaterialsDialogOpen(false);
      setEditingModuleForMaterials(null);
      await loadClassData(selectedClass!.id);
    } catch (error) {
      console.error("Error updating learning materials:", error);
      setError("Failed to update learning materials.");
    }
  };

  const resetClassForm = () => {
    setClassDialogError(null);
    setClassForm({
      title: "",
      description: "",
      thumbnail: "",
      category: "",
      semester: "",
      startDate: "",
      endDate: "",
      maxCapacity: "",
      published: false,
      enrollmentLocked: false,
      mentorId: "",
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const openClassDialog = (classToEdit?: Class) => {
    if (classToEdit) {
      setEditingClass(classToEdit);
      setClassForm({
        title: classToEdit.title,
        description: classToEdit.description || "",
        thumbnail: classToEdit.thumbnail || "",
        category: classToEdit.category || "",
        semester: classToEdit.semester,
        startDate: format(classToEdit.startDate, "yyyy-MM-dd"),
        endDate: format(classToEdit.endDate, "yyyy-MM-dd"),
        maxCapacity: classToEdit.maxCapacity?.toString() || "",
        published: classToEdit.published,
        enrollmentLocked: classToEdit.enrollmentLocked,
        mentorId: classToEdit.mentorId,
      });
      if (classToEdit.thumbnail) {
        setImagePreview(classToEdit.thumbnail);
      }
    } else {
      resetClassForm();
      setEditingClass(null);
    }
    setClassDialogOpen(true);
  };

  if (adminLoading || loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Classes Admin</h1>
        <p className="text-muted-foreground">
          Manage semester-based classes, modules, sessions, enrollments, assignments, and announcements.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left Sidebar - Classes List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Classes</CardTitle>
                <Button size="sm" onClick={() => openClassDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {classes.map((cls) => (
                  <Card
                    key={cls.id}
                    className={`cursor-pointer transition-colors ${
                      selectedClass?.id === cls.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedClass(cls)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-1">{cls.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{cls.semester}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                cls.status === "ongoing"
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                  : cls.status === "upcoming"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {cls.status}
                            </span>
                            {cls.published && (
                              <span className="text-xs text-muted-foreground">Published</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openClassDialog(cls);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClass(cls.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {classes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No classes yet. Create your first class!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Class Details */}
        <div className="space-y-6">
          {selectedClass ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="modules">Modules</TabsTrigger>
                <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="announcements">Announcements</TabsTrigger>
                <TabsTrigger value="xp">XP & Rewards</TabsTrigger>
                <TabsTrigger value="stats">Stats & KPIs</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedClass.title}</CardTitle>
                    <CardDescription>{selectedClass.semester}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedClass.thumbnail && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden">
                        <Image
                          src={selectedClass.thumbnail}
                          alt={selectedClass.title}
                          fill
                          className="object-cover"
                          sizes="100vw"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Description</p>
                      <p>{selectedClass.description || "No description"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium">{format(selectedClass.startDate, "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="font-medium">{format(selectedClass.endDate, "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{selectedClass.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Capacity</p>
                        <p className="font-medium">
                          {enrollments.length} / {selectedClass.maxCapacity || "∞"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const supabase = createLearningClient();
                          if (!supabase) return;
                          updateClass(
                            {
                              id: selectedClass.id,
                              published: !selectedClass.published,
                            },
                            supabase
                          ).then((updated) => {
                            if (updated) {
                              setSelectedClass(updated);
                              loadClasses();
                            }
                          });
                        }}
                      >
                        {selectedClass.published ? (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Publish
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const supabase = createLearningClient();
                          if (!supabase) return;
                          updateClass(
                            {
                              id: selectedClass.id,
                              enrollmentLocked: !selectedClass.enrollmentLocked,
                            },
                            supabase
                          ).then((updated) => {
                            if (updated) {
                              setSelectedClass(updated);
                              loadClasses();
                            }
                          });
                        }}
                      >
                        {selectedClass.enrollmentLocked ? (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Unlock Enrollment
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Lock Enrollment
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Modules Tab */}
              <TabsContent value="modules" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Weekly Modules</CardTitle>
                        <CardDescription>
                          Manage weekly curriculum modules for this class
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedModuleId(null);
                          setModuleForm({
                            weekNumber: modules.length + 1,
                            title: "",
                            description: "",
                            startDate: "",
                            endDate: "",
                            liveSessionLink: "",
                          });
                          setModuleDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Module
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {modules.map((module) => {
                        const moduleSessions = sessions.filter((s) => s.moduleId === module.id);
                        return (
                          <Card key={module.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold">
                                      Week {module.weekNumber}: {module.title}
                                    </h3>
                                    {module.locked ? (
                                      <Lock className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Unlock className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>
                                  {module.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {module.description}
                                    </p>
                                  )}
                                  {module.startDate && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                      {format(module.startDate, "MMM d")} -{" "}
                                      {module.endDate ? format(module.endDate, "MMM d") : "TBD"}
                                    </p>
                                  )}
                                  {moduleSessions.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs font-medium text-muted-foreground">
                                        Live Sessions ({moduleSessions.length}):
                                      </p>
                                      {moduleSessions.map((session) => (
                                        <div
                                          key={session.id}
                                          className="text-xs text-muted-foreground pl-2 border-l-2"
                                        >
                                          {session.title} - {format(session.sessionDate, "MMM d, h:mm a")}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedModuleId(module.id);
                                      setSessionForm({
                                        title: `${module.title} - Live Session`,
                                        description: "",
                                        sessionDate: module.startDate
                                          ? format(module.startDate, "yyyy-MM-dd")
                                          : "",
                                        sessionTime: "10:00",
                                        locationType: "online",
                                        location: "",
                                        meetingLink: "",
                                        attendanceTracking: true,
                                      });
                                      setSessionDialogOpen(true);
                                    }}
                                  >
                                    <Calendar className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingModuleForMaterials(module);
                                      setLearningMaterialsForm(module.learningMaterials || []);
                                      setLearningMaterialsDialogOpen(true);
                                    }}
                                    title="Manage Learning Materials"
                                  >
                                    <FileText className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingModule(module);
                                      setModuleForm({
                                        weekNumber: module.weekNumber,
                                        title: module.title,
                                        description: module.description || "",
                                        startDate: module.startDate
                                          ? format(module.startDate, "yyyy-MM-dd")
                                          : "",
                                        endDate: module.endDate ? format(module.endDate, "yyyy-MM-dd") : "",
                                        liveSessionLink: module.liveSessionLink || "",
                                      });
                                      setSelectedModuleId(module.id);
                                      setModuleDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      if (confirm("Delete this module?")) {
                                        const supabase = createLearningClient();
                                        if (!supabase) return;
                                        await deleteModule(module.id, supabase);
                                        await loadClassData(selectedClass.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {modules.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No modules yet. Add your first module!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Enrollments Tab */}
              <TabsContent value="enrollments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Enrollments</CardTitle>
                        <CardDescription>
                          {enrollments.length} enrolled student{enrollments.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </div>
                      <Button size="sm" onClick={() => setEnrollmentDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Student
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Enrolled</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell>{enrollment.userId}</TableCell>
                            <TableCell>
                              {format(enrollment.enrolledAt, "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  enrollment.status === "active"
                                    ? "bg-green-500/10 text-green-600"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {enrollment.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  if (confirm("Remove this enrollment?")) {
                                    const supabase = createLearningClient();
                                    if (!supabase) return;
                                    await removeEnrollment(
                                      selectedClass.id,
                                      enrollment.userId,
                                      supabase
                                    );
                                    await loadClassData(selectedClass.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Assignments Tab */}
              <TabsContent value="assignments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Assignments</CardTitle>
                    <CardDescription>
                      Manage assignments across all modules
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {modules.map((module) => {
                        const moduleAssignments = assignments.filter(
                          (a) => a.moduleId === module.id
                        );
                        return (
                          <Card key={module.id}>
                            <CardHeader>
                              <CardTitle className="text-base">
                                Week {module.weekNumber}: {module.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {moduleAssignments.map((assignment) => (
                                  <div
                                    key={assignment.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                  >
                                    <div>
                                      <h4 className="font-medium">{assignment.title}</h4>
                                      <p className="text-xs text-muted-foreground">
                                        Due: {format(assignment.dueDate, "MMM d, yyyy 'at' h:mm a")}
                                      </p>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={async () => {
                                          setSelectedAssignment(assignment);
                                          const supabase = createLearningClient();
                                          if (!supabase) return;
                                          const subs = await getAssignmentSubmissions(assignment.id, supabase);
                                          setSubmissions(subs);
                                          setSubmissionsDialogOpen(true);
                                        }}
                                      >
                                        <Users className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost">
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    setSelectedModuleId(module.id);
                                    setAssignmentForm({
                                      title: "",
                                      description: "",
                                      instructions: "",
                                      dueDate: "",
                                      dueTime: "",
                                      submissionType: "text",
                                      xpReward: 0,
                                      lockAfterDeadline: false,
                                    });
                                    setAssignmentDialogOpen(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Assignment
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Attendance</CardTitle>
                    <CardDescription>
                      Manage attendance for live sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sessions.map((session) => (
                        <Card key={session.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-2">{session.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {format(session.sessionDate, "MMM d, yyyy 'at' h:mm a")}
                                </p>
                                {session.locationType === "online" ? (
                                  <p className="text-xs text-muted-foreground">
                                    Online: {session.meetingLink}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Offline: {session.location}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {session.attendanceTracking && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleGenerateQR(session.id)}
                                    >
                                      <QrCode className="h-3 w-3 mr-1" />
                                      Generate QR
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleLoadAttendance(session.id)}
                                    >
                                      <Users className="h-3 w-3 mr-1" />
                                      View Attendance
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {sessions.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No sessions yet. Create a session in the Modules tab.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Announcements Tab */}
              <TabsContent value="announcements" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Announcements</CardTitle>
                      <Button size="sm" onClick={() => setAnnouncementDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        New Announcement
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {announcements.map((announcement) => (
                        <Card key={announcement.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{announcement.title}</h3>
                                  {announcement.pinned && (
                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                      Pinned
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {announcement.content}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(announcement.createdAt, "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingAnnouncement(announcement);
                                    setAnnouncementForm({
                                      title: announcement.title,
                                      content: announcement.content,
                                      pinned: announcement.pinned,
                                      moduleId: announcement.moduleId || "",
                                    });
                                    setAnnouncementDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {announcements.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No announcements yet.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* XP & Rewards Tab */}
              <TabsContent value="xp" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>XP Rewards Configuration</CardTitle>
                        <CardDescription>
                          Configure XP rewards for class actions
                        </CardDescription>
                      </div>
                      <Button size="sm" onClick={() => setXpConfigDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Config
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {xpConfigs.map((config) => (
                        <Card key={config.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold capitalize">
                                  {config.actionType.replace(/_/g, " ")}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {config.xpAmount} XP {config.enabled ? "(Enabled)" : "(Disabled)"}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setXpConfigForm({
                                    actionType: config.actionType,
                                    xpAmount: config.xpAmount,
                                    enabled: config.enabled,
                                  });
                                  setXpConfigDialogOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {xpConfigs.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No XP configurations yet. Add your first configuration!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Statistics & KPIs</CardTitle>
                    <CardDescription>Class performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Total Enrollments</p>
                          <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Active Enrollments</p>
                          <p className="text-2xl font-bold">{stats.activeEnrollments}</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Attendance Rate</p>
                          <p className="text-2xl font-bold">
                            {(stats.attendanceRate * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Assignment Completion</p>
                          <p className="text-2xl font-bold">
                            {(stats.assignmentCompletionRate * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Loading stats...</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a class from the list to manage it
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Class Dialog */}
      <Dialog open={classDialogOpen} onOpenChange={(open) => {
        setClassDialogOpen(open);
        if (!open) {
          setClassDialogError(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit Class" : "Create New Class"}</DialogTitle>
            <DialogDescription>
              {editingClass
                ? "Update class details and settings."
                : "Create a new semester-based class."}
            </DialogDescription>
          </DialogHeader>
          {classDialogError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{classDialogError}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                Title <span className="text-destructive">*</span>
                {!classForm.title && (
                  <span className="text-xs text-destructive ml-1">(Required)</span>
                )}
              </label>
              <Input
                value={classForm.title}
                onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                placeholder="e.g., Web3 Development Fundamentals"
                className={!classForm.title ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={classForm.description}
                onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                placeholder="Class description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  Semester <span className="text-destructive">*</span>
                  {!classForm.semester && (
                    <span className="text-xs text-destructive ml-1">(Required)</span>
                  )}
                </label>
                <Input
                  value={classForm.semester}
                  onChange={(e) => setClassForm({ ...classForm, semester: e.target.value })}
                  placeholder="e.g., Fall 2024"
                  className={!classForm.semester ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={classForm.category}
                  onValueChange={(value) => setClassForm({ ...classForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  Start Date <span className="text-destructive">*</span>
                  {!classForm.startDate && (
                    <span className="text-xs text-destructive ml-1">(Required)</span>
                  )}
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={classForm.startDate}
                    onChange={(e) => setClassForm({ ...classForm, startDate: e.target.value })}
                    className={!classForm.startDate ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  End Date <span className="text-destructive">*</span>
                  {!classForm.endDate && (
                    <span className="text-xs text-destructive ml-1">(Required)</span>
                  )}
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={classForm.endDate}
                    onChange={(e) => setClassForm({ ...classForm, endDate: e.target.value })}
                    className={!classForm.endDate ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Max Capacity</label>
              <Input
                type="number"
                value={classForm.maxCapacity}
                onChange={(e) => setClassForm({ ...classForm, maxCapacity: e.target.value })}
                placeholder="Leave empty for unlimited"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Thumbnail Image</label>
              {imagePreview && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2 border">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={classForm.published}
                  onChange={(e) =>
                    setClassForm({ ...classForm, published: e.target.checked })
                  }
                />
                <span className="text-sm">Published</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={classForm.enrollmentLocked}
                  onChange={(e) =>
                    setClassForm({ ...classForm, enrollmentLocked: e.target.checked })
                  }
                />
                <span className="text-sm">Lock Enrollment</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setClassDialogOpen(false);
              setClassDialogError(null);
            }}>
              Cancel
            </Button>
            <Button onClick={editingClass ? handleUpdateClass : handleCreateClass} disabled={saving}>
              {saving ? "Saving..." : editingClass ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModule ? "Edit Module" : "Create Weekly Module"}
            </DialogTitle>
            <DialogDescription>
              Add a weekly module to the class curriculum.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Week Number *</label>
              <Input
                type="number"
                min={1}
                value={moduleForm.weekNumber}
                onChange={(e) =>
                  setModuleForm({ ...moduleForm, weekNumber: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="e.g., Introduction to Web3"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={moduleForm.startDate}
                  onChange={(e) => setModuleForm({ ...moduleForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={moduleForm.endDate}
                  onChange={(e) => setModuleForm({ ...moduleForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Live Session Link</label>
              <Input
                value={moduleForm.liveSessionLink}
                onChange={(e) =>
                  setModuleForm({ ...moduleForm, liveSessionLink: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!moduleForm.title || !selectedClass) return;
                setSaving(true);
                try {
                  const supabase = createLearningClient();
                  if (!supabase) {
                    setSaving(false);
                    return;
                  }
                  if (editingModule && selectedModuleId) {
                    await updateModule(
                      selectedModuleId,
                      {
                        weekNumber: moduleForm.weekNumber,
                        title: moduleForm.title,
                        description: moduleForm.description || undefined,
                        startDate: moduleForm.startDate || undefined,
                        endDate: moduleForm.endDate || undefined,
                        liveSessionLink: moduleForm.liveSessionLink || undefined,
                      },
                      supabase
                    );
                  } else {
                    await createModule(
                      {
                        classId: selectedClass.id,
                        weekNumber: moduleForm.weekNumber,
                        title: moduleForm.title,
                        description: moduleForm.description || undefined,
                        startDate: moduleForm.startDate || undefined,
                        endDate: moduleForm.endDate || undefined,
                        liveSessionLink: moduleForm.liveSessionLink || undefined,
                      },
                      supabase
                    );
                  }
                  setModuleDialogOpen(false);
                  await loadClassData(selectedClass.id);
                } catch (error) {
                  console.error("Error saving module:", error);
                  setError("Failed to save module.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !moduleForm.title}
            >
              {saving ? "Saving..." : editingModule ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Enrollment Dialog */}
      <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
            <DialogDescription>
              Manually enroll a student in this class.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">User ID or Email *</label>
              <Input
                id="enrollment-user-input"
                placeholder="Enter user ID or email"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const input = document.getElementById("enrollment-user-input") as HTMLInputElement;
                    if (input?.value) {
                      handleEnrollUser(input.value);
                    }
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the user's ID (UUID) or email address
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const input = document.getElementById("enrollment-user-input") as HTMLInputElement;
                if (input?.value) {
                  await handleEnrollUser(input.value);
                }
              }}
            >
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Assignment</DialogTitle>
            <DialogDescription>
              Add an assignment to the selected module.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={assignmentForm.title}
                onChange={(e) =>
                  setAssignmentForm({ ...assignmentForm, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={assignmentForm.description}
                onChange={(e) =>
                  setAssignmentForm({ ...assignmentForm, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Instructions</label>
              <Textarea
                value={assignmentForm.instructions}
                onChange={(e) =>
                  setAssignmentForm({ ...assignmentForm, instructions: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Due Date *</label>
                <Input
                  type="date"
                  value={assignmentForm.dueDate}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Due Time</label>
                <Input
                  type="time"
                  value={assignmentForm.dueTime}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, dueTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Submission Type *</label>
              <Select
                value={assignmentForm.submissionType}
                onValueChange={(value: any) =>
                  setAssignmentForm({ ...assignmentForm, submissionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="file">File Upload</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="git">Git Repository</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">XP Reward</label>
              <Input
                type="number"
                min={0}
                value={assignmentForm.xpReward}
                onChange={(e) =>
                  setAssignmentForm({
                    ...assignmentForm,
                    xpReward: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={assignmentForm.lockAfterDeadline}
                onChange={(e) =>
                  setAssignmentForm({ ...assignmentForm, lockAfterDeadline: e.target.checked })
                }
              />
              <span className="text-sm">Lock submissions after deadline</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!assignmentForm.title || !assignmentForm.dueDate || !selectedModuleId || !selectedClass) return;
                setSaving(true);
                try {
                  // Use Auth Supabase for authentication
                  const authSupabase = createClient();
                  if (!authSupabase) {
                    setError("Supabase client not configured.");
                    setSaving(false);
                    return;
                  }
                  const { data: { user } } = await authSupabase.auth.getUser();
                  if (!user) return;

                  // Use Learning Supabase for database operations
                  const learningSupabase = createLearningClient();
                  if (!learningSupabase) {
                    setError("Supabase client not configured.");
                    setSaving(false);
                    return;
                  }
                  const dueDateTime = new Date(
                    `${assignmentForm.dueDate}T${assignmentForm.dueTime || "23:59"}`
                  );

                  const newAssignment = await createAssignment(
                    {
                      moduleId: selectedModuleId,
                      classId: selectedClass.id,
                      title: assignmentForm.title,
                      description: assignmentForm.description || undefined,
                      instructions: assignmentForm.instructions || undefined,
                      dueDate: dueDateTime.toISOString(),
                      submissionType: assignmentForm.submissionType,
                      xpReward: assignmentForm.xpReward,
                      lockAfterDeadline: assignmentForm.lockAfterDeadline,
                    },
                    user.id,
                    learningSupabase
                  );
                  
                  // Send notifications to all enrolled students
                  if (newAssignment) {
                    try {
                      const { notifyNewAssignment } = await import("@/lib/classroom-notifications");
                      // Fetch module to get title
                      const modules = await getClassModules(selectedClass.id, learningSupabase);
                      const module = modules.find(m => m.id === selectedModuleId);
                      await notifyNewAssignment(
                        selectedClass.id,
                        selectedClass.title,
                        assignmentForm.title,
                        dueDateTime,
                        learningSupabase,
                        authSupabase,
                        module?.title
                      );
                    } catch (notifError) {
                      console.error("Error sending assignment notifications:", notifError);
                      // Don't fail the assignment creation if notification fails
                    }
                  }
                  
                  setAssignmentDialogOpen(false);
                  // Reload assignments
                  const moduleAssignments = await getModuleAssignments(selectedModuleId, learningSupabase);
                  setAssignments((prev) => [
                    ...prev.filter((a) => a.moduleId !== selectedModuleId),
                    ...moduleAssignments,
                  ]);
                } catch (error) {
                  console.error("Error creating assignment:", error);
                  setError("Failed to create assignment.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !assignmentForm.title || !assignmentForm.dueDate}
            >
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? "Update announcement details." : "Post an announcement to the class."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={announcementForm.title}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content *</label>
              <Textarea
                value={announcementForm.content}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, content: e.target.value })
                }
                rows={5}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Target Module (Optional)</label>
              <Select
                value={announcementForm.moduleId || "all"}
                onValueChange={(value) =>
                  setAnnouncementForm({ ...announcementForm, moduleId: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Entire class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Entire class</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      Week {module.weekNumber}: {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={announcementForm.pinned}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, pinned: e.target.checked })
                }
              />
              <span className="text-sm">Pin this announcement</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!announcementForm.title || !announcementForm.content || !selectedClass) return;
                setSaving(true);
                try {
                  const learningSupabase = createLearningClient();
                  if (!learningSupabase) {
                    setError("Supabase client not configured.");
                    setSaving(false);
                    return;
                  }
                  
                  if (editingAnnouncement) {
                    await handleUpdateAnnouncement();
                  } else {
                    // Use Auth Supabase for authentication
                    const authSupabase = createClient();
                    if (!authSupabase) {
                      setError("Supabase client not configured.");
                      setSaving(false);
                      return;
                    }
                    const { data: { user } } = await authSupabase.auth.getUser();
                    if (!user) return;

                    const newAnnouncement = await createAnnouncement(
                      {
                        classId: selectedClass.id,
                        moduleId: announcementForm.moduleId || undefined,
                        title: announcementForm.title,
                        content: announcementForm.content,
                        pinned: announcementForm.pinned,
                      },
                      user.id,
                      learningSupabase
                    );
                    
                    // Send notifications to all enrolled students
                    if (newAnnouncement) {
                      try {
                        const { notifyNewAnnouncement } = await import("@/lib/classroom-notifications");
                        await notifyNewAnnouncement(
                          selectedClass.id,
                          selectedClass.title,
                          announcementForm.title,
                          announcementForm.content,
                          learningSupabase,
                          authSupabase,
                          announcementForm.moduleId || undefined
                        );
                      } catch (notifError) {
                        console.error("Error sending announcement notifications:", notifError);
                        // Don't fail the announcement creation if notification fails
                      }
                    }
                    
                    setAnnouncementDialogOpen(false);
                    setAnnouncementForm({ title: "", content: "", pinned: false, moduleId: undefined });
                    await loadClassData(selectedClass.id);
                  }
                } catch (error) {
                  console.error("Error saving announcement:", error);
                  setError("Failed to save announcement.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !announcementForm.title || !announcementForm.content}
            >
              {saving ? (editingAnnouncement ? "Updating..." : "Posting...") : (editingAnnouncement ? "Update" : "Post Announcement")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Live Session Dialog */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Live Session</DialogTitle>
            <DialogDescription>
              Schedule a live session for the selected module.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={sessionForm.title}
                onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                placeholder="e.g., Week 1 Live Class"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={sessionForm.description}
                onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Session Date *</label>
                <Input
                  type="date"
                  value={sessionForm.sessionDate}
                  onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Session Time *</label>
                <Input
                  type="time"
                  value={sessionForm.sessionTime}
                  onChange={(e) => setSessionForm({ ...sessionForm, sessionTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Location Type *</label>
              <Select
                value={sessionForm.locationType}
                onValueChange={(value: "online" | "offline") =>
                  setSessionForm({ ...sessionForm, locationType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sessionForm.locationType === "online" ? (
              <div>
                <label className="text-sm font-medium">Meeting Link *</label>
                <Input
                  value={sessionForm.meetingLink}
                  onChange={(e) => setSessionForm({ ...sessionForm, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">Venue/Location *</label>
                <Input
                  value={sessionForm.location}
                  onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                  placeholder="e.g., Room 101, Building A"
                />
              </div>
            )}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sessionForm.attendanceTracking}
                onChange={(e) =>
                  setSessionForm({ ...sessionForm, attendanceTracking: e.target.checked })
                }
              />
              <span className="text-sm">Enable attendance tracking</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (
                  !sessionForm.title ||
                  !sessionForm.sessionDate ||
                  !sessionForm.sessionTime ||
                  !selectedModuleId ||
                  !selectedClass
                )
                  return;
                if (
                  sessionForm.locationType === "online" &&
                  !sessionForm.meetingLink
                )
                  return;
                if (
                  sessionForm.locationType === "offline" &&
                  !sessionForm.location
                )
                  return;

                setSaving(true);
                try {
                  // Use Auth Supabase for authentication
                  const authSupabase = createClient();
                  if (!authSupabase) {
                    setError("Supabase client not configured.");
                    setSaving(false);
                    return;
                  }
                  const { data: { user } } = await authSupabase.auth.getUser();
                  if (!user) return;

                  // Use Learning Supabase for database operations
                  const learningSupabase = createLearningClient();
                  if (!learningSupabase) {
                    setError("Supabase client not configured.");
                    setSaving(false);
                    return;
                  }
                  const sessionDateTime = new Date(
                    `${sessionForm.sessionDate}T${sessionForm.sessionTime}`
                  );

                  const newSession = await createSession(
                    {
                      moduleId: selectedModuleId,
                      classId: selectedClass.id,
                      title: sessionForm.title,
                      description: sessionForm.description || undefined,
                      sessionDate: sessionDateTime.toISOString(),
                      locationType: sessionForm.locationType,
                      location: sessionForm.location || undefined,
                      meetingLink: sessionForm.meetingLink || undefined,
                      attendanceTracking: sessionForm.attendanceTracking,
                    },
                    user.id,
                    learningSupabase
                  );

                  if (newSession) {
                    setSessionDialogOpen(false);
                    setSessionForm({
                      title: "",
                      description: "",
                      sessionDate: "",
                      sessionTime: "",
                      locationType: "online",
                      location: "",
                      meetingLink: "",
                      attendanceTracking: true,
                    });
                    await loadClassData(selectedClass.id);
                  }
                } catch (error) {
                  console.error("Error creating session:", error);
                  setError("Failed to create session.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={
                saving ||
                !sessionForm.title ||
                !sessionForm.sessionDate ||
                !sessionForm.sessionTime ||
                (sessionForm.locationType === "online" && !sessionForm.meetingLink) ||
                (sessionForm.locationType === "offline" && !sessionForm.location)
              }
            >
              {saving ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code Generated</DialogTitle>
            <DialogDescription>
              Share this QR code with students for attendance check-in
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSession?.qrToken && (
              <div className="flex justify-center">
                <div className="p-4 border rounded-lg">
                  {/* QR Code would be rendered here - you can use qrcode.react library */}
                  <p className="text-sm font-mono break-all">{selectedSession.qrToken}</p>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              QR code expires 2 hours after session start time
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance Management Dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Attendance: {selectedSession?.title}
            </DialogTitle>
            <DialogDescription>
              Manage attendance for this session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="User ID or Email"
                value={attendanceUserId}
                onChange={(e) => setAttendanceUserId(e.target.value)}
              />
              <Button onClick={handleMarkAttendance} disabled={!attendanceUserId}>
                Mark Attendance
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.userId}</TableCell>
                    <TableCell>
                      {format(record.checkinTime, "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell className="capitalize">{record.method}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveAttendance(record.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {attendanceRecords.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No attendance records yet.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              // Export attendance as CSV
              const csv = [
                ["User ID", "Check-in Time", "Method"],
                ...attendanceRecords.map((r) => [
                  r.userId,
                  format(r.checkinTime, "yyyy-MM-dd HH:mm:ss"),
                  r.method,
                ]),
              ].map((row) => row.join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `attendance-${selectedSession?.id}.csv`;
              a.click();
            }}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={submissionsDialogOpen} onOpenChange={setSubmissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Submissions: {selectedAssignment?.title}
            </DialogTitle>
            <DialogDescription>
              Review and manage assignment submissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.userId}</TableCell>
                    <TableCell>
                      {format(submission.submittedAt, "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell className="capitalize">{submission.status}</TableCell>
                    <TableCell>
                      {submission.isLate ? (
                        <span className="text-xs text-destructive">Late</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">On time</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSubmission(submission);
                          setSubmissionReviewForm({
                            status: submission.status,
                            feedback: submission.feedback || "",
                          });
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {submissions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No submissions yet.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmissionsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submission Review Dialog */}
      <Dialog open={editingSubmission !== null} onOpenChange={(open) => {
        if (!open) setEditingSubmission(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              Update submission status and provide feedback
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={submissionReviewForm.status}
                onValueChange={(value: SubmissionStatus) =>
                  setSubmissionReviewForm({ ...submissionReviewForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="changes_requested">Changes Requested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Feedback</label>
              <Textarea
                value={submissionReviewForm.feedback}
                onChange={(e) =>
                  setSubmissionReviewForm({ ...submissionReviewForm, feedback: e.target.value })
                }
                rows={4}
                placeholder="Optional feedback for the student..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSubmission(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubmission}>
              Update Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* XP Config Dialog */}
      <Dialog open={xpConfigDialogOpen} onOpenChange={setXpConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure XP Reward</DialogTitle>
            <DialogDescription>
              Set XP amount for this action type
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Action Type</label>
              <Select
                value={xpConfigForm.actionType}
                onValueChange={(value: XPActionType) =>
                  setXpConfigForm({ ...xpConfigForm, actionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session_attendance">Session Attendance</SelectItem>
                  <SelectItem value="assignment_submission">Assignment Submission</SelectItem>
                  <SelectItem value="assignment_approved">Assignment Approved</SelectItem>
                  <SelectItem value="module_completion">Module Completion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">XP Amount</label>
              <Input
                type="number"
                min={0}
                value={xpConfigForm.xpAmount}
                onChange={(e) =>
                  setXpConfigForm({ ...xpConfigForm, xpAmount: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={xpConfigForm.enabled}
                onChange={(e) =>
                  setXpConfigForm({ ...xpConfigForm, enabled: e.target.checked })
                }
              />
              <span className="text-sm">Enabled</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setXpConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpsertXPConfig}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Learning Materials Dialog */}
      <Dialog open={learningMaterialsDialogOpen} onOpenChange={setLearningMaterialsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Learning Materials</DialogTitle>
            <DialogDescription>
              Add learning materials for this module
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {learningMaterialsForm.map((material, index) => (
              <div key={index} className="flex gap-2 p-3 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Title"
                    value={material.title}
                    onChange={(e) => {
                      const updated = [...learningMaterialsForm];
                      updated[index].title = e.target.value;
                      setLearningMaterialsForm(updated);
                    }}
                  />
                  <Input
                    placeholder="URL"
                    value={material.url}
                    onChange={(e) => {
                      const updated = [...learningMaterialsForm];
                      updated[index].url = e.target.value;
                      setLearningMaterialsForm(updated);
                    }}
                  />
                  <Select
                    value={material.type}
                    onValueChange={(value: "document" | "video" | "link" | "file") => {
                      const updated = [...learningMaterialsForm];
                      updated[index].type = value;
                      setLearningMaterialsForm(updated);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setLearningMaterialsForm(learningMaterialsForm.filter((_, i) => i !== index));
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setLearningMaterialsForm([
                  ...learningMaterialsForm,
                  { type: "link", title: "", url: "" },
                ]);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLearningMaterialsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLearningMaterials}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

