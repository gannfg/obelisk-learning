// Course Category
export type CourseCategory =
  | "Developer"
  | "Design"
  | "Videography / Photography"
  | "Marketing"
  | "Solana Integration";

// Course
export type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructorId: string;
  category: CourseCategory;
  modules: Module[];
  featured?: boolean;
};

// Module
export type Module = {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
};

// Lesson
export type Lesson = {
  id: string;
  title: string;
  markdownContent?: string; // lesson.md file
  videoUrl?: string;
  quizId?: string; // future
  duration?: number; // in minutes
};

// Instructor
export type Instructor = {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  specializations: string[];
  socials?: {
    twitter?: string;
    website?: string;
    github?: string;
    linkedin?: string;
  };
};

// Auth / User
export type AppUserRole = "user" | "admin";

// Re-export workshop types
export * from "./workshops";

// Re-export class types
export * from "./classes";

// Progress (for future Supabase integration)
export type LessonProgress = {
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
};

export type CourseProgress = {
  courseId: string;
  lessons: LessonProgress[];
  lastAccessedAt?: Date;
};

// Learning Platform Types
export type MissionSubmissionField = {
  type: string;
  label: string;
  required: boolean;
  placeholder: string;
  helper?: string;
};

export type Mission = {
  id: string;
  lessonId?: string;
  title: string;
  goal: string;
  description?: string;
  imageUrl?: string;
  initialFiles: Record<string, string>;
  stackType?: "nextjs" | "python" | "solana" | "node" | "react" | "other" | "none";
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime?: number;
  submissionDeadline?: Date;
  endDate?: Date;
  category?: string;
  orderIndex: number;
  badgeId?: string;
  submissionFields?: MissionSubmissionField[];
  prerequisiteClassIds?: string[]; // Optional: class IDs that must be completed before accessing this mission
};

export type MissionContent = {
  id: string;
  missionId: string;
  markdownContent: string;
  checklist: Array<{ text: string; completed: boolean }>;
  advancedTips?: string;
};

export type Sandbox = {
  id: string;
  userId: string;
  missionId: string;
  files: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
};

export type Snapshot = {
  id: string;
  userId: string;
  sandboxId: string;
  missionId: string;
  name?: string;
  description?: string;
  files: Record<string, string>;
  shareToken?: string;
  createdAt: Date;
};

export type MicroCheck = {
  id: string;
  missionId: string;
  name: string;
  description?: string;
  testCode: string;
  expectedResult?: any;
  orderIndex: number;
};

export type MicroCheckResult = {
  id: string;
  userId: string;
  microCheckId: string;
  missionId: string;
  passed: boolean;
  output?: string;
  errorMessage?: string;
  runAt: Date;
};

export type AIPromptTemplate = {
  id: string;
  missionId?: string;
  name: string;
  promptText: string;
  category: "explain" | "refactor" | "test" | "debug" | "optimize" | "general";
  orderIndex: number;
};

export type MissionProgress = {
  id: string;
  userId: string;
  missionId: string;
  completed: boolean;
  completedAt?: Date;
  checklistProgress: Array<{ text: string; completed: boolean }>;
  microChecksPassed: number;
  totalMicroChecks: number;
  lastAccessedAt?: Date;
};

export type MissionSubmissionStatus = "submitted" | "under_review" | "approved" | "changes_requested";

export type MissionSubmission = {
  id: string;
  userId: string;
  missionId: string;
  gitUrl: string;
  repoDirectory?: string;
  websiteUrl?: string;
  pitchDeckUrl?: string;
  status: MissionSubmissionStatus;
  feedback?: string;
  reviewerId?: string;
  reviewedAt?: Date;
  isWinner?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Academy Types
export type Project = {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  status: "planning" | "in-progress" | "completed" | "archived";
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  teamId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  repositoryUrl?: string;
  liveUrl?: string;
  progressLog?: string;
  members?: ProjectMember[];
};

export type ProjectMember = {
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: Date;
};

export type Team = {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  members: TeamMember[];
  projects: string[]; // Project IDs
};

export type TeamMember = {
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
};

