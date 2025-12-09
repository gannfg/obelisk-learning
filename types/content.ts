/**
 * Modular Content System Types
 */

export type ContentType = 
  | 'video'
  | 'image'
  | 'document'
  | 'markdown'
  | 'code'
  | 'quiz'
  | 'embed';

export type ContentBlock = {
  id: string;
  type: ContentType;
  title: string;
  description?: string;
  order: number;
  
  // Type-specific data
  videoUrl?: string;
  imageUrl?: string;
  imageUrls?: string[]; // For galleries
  documentUrl?: string;
  markdownContent?: string;
  codeContent?: string;
  embedUrl?: string;
  quizData?: QuizData;
  
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

export type QuizData = {
  questions: QuizQuestion[];
  passingScore: number;
};

export type QuizQuestion = {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
};

export type TrainingProgram = {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  contentBlocks: ContentBlock[];
  prerequisites?: string[]; // Program IDs
  createdAt: string;
  updatedAt: string;
};

export type ProgramEnrollment = {
  id: string;
  userId: string;
  programId: string;
  progress: number; // 0-100
  completed: boolean;
  completedAt?: string;
  enrolledAt: string;
  lastAccessedAt: string;
};






