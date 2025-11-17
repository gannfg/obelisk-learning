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

