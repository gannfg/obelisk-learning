/**
 * Semester-Based Classes Management System Types
 */

export type ClassStatus = "upcoming" | "ongoing" | "completed" | "cancelled" | "archived";
export type LocationType = "online" | "offline";
// Distinguish from workshop attendance type
export type ClassAttendanceMethod = "qr" | "manual";
export type SubmissionType = "text" | "file" | "url" | "git";
export type SubmissionStatus = "submitted" | "late" | "reviewed" | "approved" | "changes_requested";
export type EnrollmentStatus = "active" | "dropped" | "completed";
export type MentorRole = "mentor" | "assistant" | "ta";
export type XPActionType = "session_attendance" | "assignment_submission" | "assignment_approved" | "module_completion";

export interface Class {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  semester: string;
  startDate: Date;
  endDate: Date;
  maxCapacity?: number;
  status: ClassStatus;
  published: boolean;
  enrollmentLocked: boolean;
  mentorId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassModule {
  id: string;
  classId: string;
  weekNumber: number;
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  liveSessionLink?: string;
  learningMaterials: LearningMaterial[];
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Class with modules (used by search and detail pages)
export interface ClassWithModules extends Class {
  modules: ClassModule[];
}

export interface LearningMaterial {
  type: "document" | "video" | "link" | "file";
  title: string;
  url: string;
}

export interface LiveSession {
  id: string;
  moduleId: string;
  classId: string;
  title: string;
  description?: string;
  sessionDate: Date;
  locationType: LocationType;
  location?: string;
  meetingLink?: string;
  attendanceTracking: boolean;
  qrToken?: string;
  qrExpiresAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  userId: string;
  enrolledAt: Date;
  enrolledBy?: string;
  status: EnrollmentStatus;
}

export interface SessionAttendance {
  id: string;
  sessionId: string;
  userId: string;
  classId: string;
  checkinTime: Date;
  method: ClassAttendanceMethod;
  checkedInBy?: string;
}

export interface ClassAssignment {
  id: string;
  moduleId: string;
  classId: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: Date;
  submissionType: SubmissionType;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  lockAfterDeadline: boolean;
  xpReward: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  classId: string;
  submissionContent?: string;
  submissionUrl?: string;
  submissionFileUrl?: string;
  gitUrl?: string;
  repoDirectory?: string;
  status: SubmissionStatus;
  isLate: boolean;
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  submittedAt: Date;
  updatedAt: Date;
}

export interface ClassAnnouncement {
  id: string;
  classId: string;
  moduleId?: string;
  title: string;
  content: string;
  pinned: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassMentor {
  id: string;
  classId: string;
  mentorId: string;
  role: MentorRole;
  assignedAt: Date;
}

export interface ClassXPConfig {
  id: string;
  classId: string;
  actionType: XPActionType;
  xpAmount: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClassInput {
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  semester: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  maxCapacity?: number;
  published?: boolean;
  enrollmentLocked?: boolean;
  mentorId: string;
}

export interface UpdateClassInput extends Partial<CreateClassInput> {
  id: string;
  status?: ClassStatus;
}

export interface CreateModuleInput {
  classId: string;
  weekNumber: number;
  title: string;
  description?: string;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  liveSessionLink?: string;
  learningMaterials?: LearningMaterial[];
}

export interface CreateSessionInput {
  moduleId: string;
  classId: string;
  title: string;
  description?: string;
  sessionDate: string; // ISO string
  locationType: LocationType;
  location?: string;
  meetingLink?: string;
  attendanceTracking?: boolean;
}

export interface CreateAssignmentInput {
  moduleId: string;
  classId: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: string; // ISO string
  submissionType: SubmissionType;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  lockAfterDeadline?: boolean;
  xpReward?: number;
}

export interface CreateAnnouncementInput {
  classId: string;
  moduleId?: string;
  title: string;
  content: string;
  pinned?: boolean;
}

export interface ClassStats {
  totalEnrollments: number;
  activeEnrollments: number;
  attendanceRate: number;
  assignmentCompletionRate: number;
  averageXP: number;
}

