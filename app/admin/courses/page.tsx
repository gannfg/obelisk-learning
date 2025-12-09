"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAdmin } from "@/lib/hooks/use-admin";
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
import { createLearningClient } from "@/lib/supabase/learning-client";
import { uploadCourseImage } from "@/lib/storage";
import { Loader2, Plus, Edit, Trash2, Image as ImageIcon, X, GripVertical, Copy, BookOpen } from "lucide-react";
import Image from "next/image";
import Editor from "@monaco-editor/react";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  featured: boolean;
  instructor_id: string;
  created_at: string;
  updated_at: string;
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  markdown_content: string | null;
  video_url: string | null;
  quiz_id: string | null;
  duration: number | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

type LessonType = "markdown" | "video" | "quiz";

interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  question: string;
  options?: string[];
  correctAnswer: string;
  scoreWeight: number;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("");
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const [draggedOverModuleId, setDraggedOverModuleId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<LessonType>("markdown");
  const [markdownContent, setMarkdownContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [videoThumbnailFile, setVideoThumbnailFile] = useState<File | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [lessonDuration, setLessonDuration] = useState<number | null>(null);
  const [lessonPublished, setLessonPublished] = useState(false);
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [draggedOverLessonId, setDraggedOverLessonId] = useState<string | null>(null);
  const [deleteLessonConfirmOpen, setDeleteLessonConfirmOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const supabase = createLearningClient();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadCourses();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedCourse) {
      loadModules(selectedCourse.id);
    } else {
      setModules([]);
      setSelectedModule(null);
      setLessons([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedModule) {
      loadLessons(selectedModule.id);
    } else {
      setLessons([]);
    }
  }, [selectedModule]);

  const loadCourses = async () => {
    if (!supabase) {
      setError("Supabase client not configured.");
      setLoadingCourses(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading courses:", error);
        setError("Failed to load courses.");
        return;
      }

      setCourses(data || []);
    } catch (err) {
      console.error("Unexpected error loading courses:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadModules = async (courseId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error loading modules:", error);
        return;
      }

      setModules(data || []);
    } catch (err) {
      console.error("Unexpected error loading modules:", err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Create Supabase client only on the client when form is submitted.
    // This avoids throwing during build/prerender if env vars are missing.
    const supabase = createLearningClient();
    if (!supabase) {
      setError(
        "Supabase environment variables are not configured. Please set NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL and NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY."
      );
      setSaving(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const courseCategory = category || (formData.get("category") as string);
    const featured = formData.get("featured") === "on";

    try {
      // Upload image if provided
      let thumbnailUrl = selectedCourse?.thumbnail || "";
      if (imageFile) {
        const uploadedUrl = await uploadCourseImage(
          imageFile,
          selectedCourse?.id || null,
          supabase
        );
        if (uploadedUrl) {
          thumbnailUrl = uploadedUrl;
        } else {
          setError("Failed to upload image. Please try again.");
          setSaving(false);
          return;
        }
      }

      // Ensure there is a single virtual instructor representing DeMentor (AI)
      const { data: existing, error: loadInstructorError } = await supabase
        .from("instructors")
        .select("id")
        .eq("name", "DeMentor")
        .limit(1);

      if (loadInstructorError) {
        console.error("Error loading DeMentor instructor:", loadInstructorError);
        setError(
          loadInstructorError.message ||
            "Failed to load DeMentor instructor. Check instructors table permissions."
        );
        setSaving(false);
        return;
      }

      let instructorId = existing?.[0]?.id as string | undefined;

      if (!instructorId) {
        const { data: created, error: createInstructorError } = await supabase
          .from("instructors")
          .insert({
            name: "DeMentor",
            avatar: "/dementor_avatar.png",
            bio: "DeMentor is your AI-native coding mentor for Web3, Solana, and modern fullstack development.",
            specializations: ["Web3", "Solana", "Fullstack"],
            socials: {
              twitter: "@DeMentorAI",
              website: "https://superteam.fun",
            },
          })
          .select("id")
          .single();

        if (createInstructorError || !created) {
          console.error(
            "Error creating DeMentor instructor:",
            createInstructorError
          );
          setError(
            createInstructorError?.message ||
              "Failed to create DeMentor instructor. Check instructors table permissions."
          );
          setSaving(false);
          return;
        }

        instructorId = created.id;
      }

      if (selectedCourse) {
        // Update existing course
        const { data, error: updateError } = await supabase
          .from("courses")
          .update({
            title,
            description,
            thumbnail: thumbnailUrl || selectedCourse.thumbnail,
            instructor_id: instructorId,
            category: courseCategory,
            featured,
          })
          .eq("id", selectedCourse.id)
          .select("id")
          .single();

        if (updateError) {
          console.error("Error updating course:", updateError);
          setError(
            updateError.message ||
              "Failed to update course. Check RLS policies for courses table."
          );
          setSaving(false);
          return;
        }

        setSuccess("Course updated successfully!");
        setSelectedCourse(null);
        setImagePreview(null);
        setImageFile(null);
        loadCourses();
      } else {
        // Create new course
        const { data, error: insertError } = await supabase
          .from("courses")
          .insert({
            title,
            description,
            thumbnail: thumbnailUrl || "https://placehold.co/600x400?text=Course",
            instructor_id: instructorId,
            category: courseCategory,
            featured,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("Error creating course:", insertError);
          setError(
            insertError.message ||
              "Failed to create course. Check RLS policies for courses table."
          );
          setSaving(false);
          return;
        }

        if (data?.id) {
          setSuccess("Course created successfully!");
          setImagePreview(null);
          setImageFile(null);
          // Reset form
          e.currentTarget.reset();
          loadCourses();
        } else {
          setError("Course created but no ID returned from Supabase.");
        }
      }
    } catch (err: any) {
      console.error("Unexpected error saving course:", err);
      setError(err?.message || "An unexpected error occurred while saving course.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!supabase) {
      setError("Supabase client not configured.");
      return;
    }
    if (!confirm("Are you sure you want to delete this course? This will also delete all modules and lessons.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) {
        console.error("Error deleting course:", error);
        setError("Failed to delete course.");
        return;
      }

      setSuccess("Course deleted successfully!");
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
      }
      loadCourses();
    } catch (err) {
      console.error("Unexpected error deleting course:", err);
      setError("An unexpected error occurred.");
    }
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setImagePreview(course.thumbnail);
    setImageFile(null);
    setCategory(course.category);
    setError(null);
    setSuccess(null);
  };

  const handleNewCourse = () => {
    setSelectedCourse(null);
    setImagePreview(null);
    setImageFile(null);
    setCategory("");
    setError(null);
    setSuccess(null);
  };

  const openModuleModal = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setModuleTitle(module.title);
      setModuleDescription(module.description || "");
    } else {
      setEditingModule(null);
      setModuleTitle("");
      setModuleDescription("");
    }
    setModuleModalOpen(true);
  };

  const closeModuleModal = () => {
    setModuleModalOpen(false);
    setEditingModule(null);
    setModuleTitle("");
    setModuleDescription("");
  };

  const handleSaveModule = async () => {
    if (!supabase) {
      setError("Supabase client not configured.");
      return;
    }
    if (!selectedCourse) {
      setError("Please select or create a course first.");
      return;
    }

    if (!moduleTitle.trim()) {
      setError("Module title is required.");
      return;
    }

    try {
      if (editingModule) {
        // Update existing module
        const { error: updateError } = await supabase
          .from("modules")
          .update({
            title: moduleTitle.trim(),
            description: moduleDescription.trim() || null,
          })
          .eq("id", editingModule.id);

        if (updateError) {
          console.error("Error updating module:", updateError);
          setError("Failed to update module.");
          return;
        }

        setSuccess("Module updated successfully!");
      } else {
        // Create new module
        const orderIndex = modules.length;
        const { data, error: insertError } = await supabase
          .from("modules")
          .insert({
            course_id: selectedCourse.id,
            title: moduleTitle.trim(),
            description: moduleDescription.trim() || null,
            order_index: orderIndex,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("Error creating module:", insertError);
          setError("Failed to create module.");
          return;
        }

        setSuccess("Module created successfully!");
      }

      closeModuleModal();
      loadModules(selectedCourse.id);
    } catch (err) {
      console.error("Unexpected error saving module:", err);
      setError("An unexpected error occurred.");
    }
  };

  const handleDeleteModuleClick = (moduleId: string) => {
    setModuleToDelete(moduleId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!supabase) {
      setError("Supabase client not configured.");
      return;
    }
    if (!moduleToDelete || !selectedCourse) return;

    try {
      const { error } = await supabase
        .from("modules")
        .delete()
        .eq("id", moduleToDelete);

      if (error) {
        console.error("Error deleting module:", error);
        setError("Failed to delete module.");
        return;
      }

      setSuccess("Module deleted successfully!");
      loadModules(selectedCourse.id);
    } catch (err) {
      console.error("Unexpected error deleting module:", err);
      setError("An unexpected error occurred.");
    } finally {
      setDeleteConfirmOpen(false);
      setModuleToDelete(null);
    }
  };

  const loadLessons = async (moduleId: string) => {
    if (!supabase) return;
    try {
      setLoadingLessons(true);
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error loading lessons:", error);
        return;
      }

      setLessons(data || []);
    } catch (err) {
      console.error("Unexpected error loading lessons:", err);
    } finally {
      setLoadingLessons(false);
    }
  };

  const openLessonModal = async (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonTitle(lesson.title);
      setMarkdownContent(lesson.markdown_content || "");
      setVideoUrl(lesson.video_url || "");
      setLessonDuration(lesson.duration);
      // Determine lesson type
      if (lesson.video_url) {
        setLessonType("video");
      } else if (lesson.quiz_id) {
        setLessonType("quiz");
      } else {
        setLessonType("markdown");
      }
      // Load quiz questions if quiz_id exists
      if (lesson.quiz_id && supabase) {
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("questions, title")
          .eq("lesson_id", lesson.id)
          .single();

        if (!quizError && quizData && quizData.questions) {
          setQuizQuestions(quizData.questions as QuizQuestion[]);
        } else {
          setQuizQuestions([]);
        }
      } else {
        setQuizQuestions([]);
      }
    } else {
      setEditingLesson(null);
      setLessonTitle("");
      setMarkdownContent("");
      setVideoUrl("");
      setVideoThumbnail(null);
      setVideoThumbnailFile(null);
      setLessonDuration(null);
      setLessonType("markdown");
      setQuizQuestions([]);
      setLessonPublished(false);
    }
    setLessonModalOpen(true);
  };

  const closeLessonModal = () => {
    setLessonModalOpen(false);
    setEditingLesson(null);
    setLessonTitle("");
    setMarkdownContent("");
    setVideoUrl("");
    setVideoThumbnail(null);
    setVideoThumbnailFile(null);
    setLessonDuration(null);
    setLessonType("markdown");
    setQuizQuestions([]);
    setLessonPublished(false);
  };

  const handleSaveLesson = async () => {
    if (!supabase) {
      setError("Supabase client not configured.");
      return;
    }
    if (!selectedModule) {
      setError("Please select a module first.");
      return;
    }

    if (!lessonTitle.trim()) {
      setError("Lesson title is required.");
      return;
    }

    try {
      const lessonData: any = {
        module_id: selectedModule.id,
        title: lessonTitle.trim(),
        duration: lessonDuration,
        order_index: editingLesson ? editingLesson.order_index : lessons.length,
      };

      // Set content based on lesson type
      if (lessonType === "markdown") {
        lessonData.markdown_content = markdownContent.trim() || null;
        lessonData.video_url = null;
        lessonData.quiz_id = null;
      } else if (lessonType === "video") {
        lessonData.video_url = videoUrl.trim() || null;
        lessonData.markdown_content = null;
        lessonData.quiz_id = null;
      } else if (lessonType === "quiz") {
        // Validate quiz questions
        if (quizQuestions.length === 0) {
          setError("Please add at least one quiz question.");
          return;
        }

        // Validate all questions have required fields
        for (const q of quizQuestions) {
          if (!q.question.trim()) {
            setError("All questions must have question text.");
            return;
          }
          if (!q.correctAnswer || !q.correctAnswer.trim()) {
            setError("All questions must have a correct answer.");
            return;
          }
          if (q.type === "multiple-choice" && (!q.options || q.options.length < 2)) {
            setError("Multiple choice questions must have at least 2 options.");
            return;
          }
        }

        lessonData.markdown_content = null;
        lessonData.video_url = null;
        // quiz_id will be set after creating/updating the quiz
      }

      let lessonId: string;

      if (editingLesson) {
        lessonId = editingLesson.id;
        
        // Update lesson first
        const { error: updateError } = await supabase
          .from("lessons")
          .update(lessonData)
          .eq("id", lessonId);

        if (updateError) {
          console.error("Error updating lesson:", updateError);
          setError("Failed to update lesson.");
          return;
        }

        // If quiz type, create or update quiz
        if (lessonType === "quiz") {
          const quizData = {
            lesson_id: lessonId,
            title: lessonTitle.trim(),
            questions: quizQuestions.map(q => ({
              id: q.id,
              type: q.type,
              question: q.question.trim(),
              options: q.options,
              correctAnswer: q.correctAnswer.trim(),
              scoreWeight: q.scoreWeight || 1,
            })),
          };

          // Check if quiz exists
          const { data: existingQuiz } = await supabase
            .from("quizzes")
            .select("id")
            .eq("lesson_id", lessonId)
            .single();

          if (existingQuiz) {
            // Update existing quiz
            const { error: quizUpdateError } = await supabase
              .from("quizzes")
              .update(quizData)
              .eq("lesson_id", lessonId);

            if (quizUpdateError) {
              console.error("Error updating quiz:", quizUpdateError);
              setError("Failed to update quiz.");
              return;
            }
            lessonData.quiz_id = existingQuiz.id;
          } else {
            // Create new quiz
            const { data: newQuiz, error: quizInsertError } = await supabase
              .from("quizzes")
              .insert(quizData)
              .select("id")
              .single();

            if (quizInsertError) {
              console.error("Error creating quiz:", quizInsertError);
              setError("Failed to create quiz.");
              return;
            }
            lessonData.quiz_id = newQuiz.id;
          }

          // Update lesson with quiz_id
          await supabase
            .from("lessons")
            .update({ quiz_id: lessonData.quiz_id })
            .eq("id", lessonId);
        } else {
          // If not quiz type, remove quiz_id
          await supabase
            .from("lessons")
            .update({ quiz_id: null })
            .eq("id", lessonId);
        }

        setSuccess("Lesson updated successfully!");
      } else {
        // Create new lesson
        const { data: newLesson, error: insertError } = await supabase
          .from("lessons")
          .insert(lessonData)
          .select("id")
          .single();

        if (insertError) {
          console.error("Error creating lesson:", insertError);
          setError("Failed to create lesson.");
          return;
        }

        lessonId = newLesson.id;

        // If quiz type, create quiz
        if (lessonType === "quiz") {
          const quizData = {
            lesson_id: lessonId,
            title: lessonTitle.trim(),
            questions: quizQuestions.map(q => ({
              id: q.id,
              type: q.type,
              question: q.question.trim(),
              options: q.options,
              correctAnswer: q.correctAnswer.trim(),
              scoreWeight: q.scoreWeight || 1,
            })),
          };

          const { data: newQuiz, error: quizInsertError } = await supabase
            .from("quizzes")
            .insert(quizData)
            .select("id")
            .single();

          if (quizInsertError) {
            console.error("Error creating quiz:", quizInsertError);
            setError("Failed to create quiz.");
            return;
          }

          // Update lesson with quiz_id
          await supabase
            .from("lessons")
            .update({ quiz_id: newQuiz.id })
            .eq("id", lessonId);
        }

        setSuccess("Lesson created successfully!");
      }

      closeLessonModal();
      loadLessons(selectedModule.id);
    } catch (err) {
      console.error("Unexpected error saving lesson:", err);
      setError("An unexpected error occurred.");
    }
  };

  const handleDeleteLessonClick = (lessonId: string) => {
    setLessonToDelete(lessonId);
    setDeleteLessonConfirmOpen(true);
  };

  const handleConfirmDeleteLesson = async () => {
    if (!supabase) {
      setError("Supabase client not configured.");
      return;
    }
    if (!lessonToDelete || !selectedModule) return;

    try {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lessonToDelete);

      if (error) {
        console.error("Error deleting lesson:", error);
        setError("Failed to delete lesson.");
        return;
      }

      setSuccess("Lesson deleted successfully!");
      loadLessons(selectedModule.id);
    } catch (err) {
      console.error("Unexpected error deleting lesson:", err);
      setError("An unexpected error occurred.");
    } finally {
      setDeleteLessonConfirmOpen(false);
      setLessonToDelete(null);
    }
  };

  const handleDuplicateLesson = async (lesson: Lesson) => {
    if (!supabase) {
      setError("Supabase client not configured.");
      return;
    }
    if (!selectedModule) return;

    try {
      const { data, error } = await supabase
        .from("lessons")
        .insert({
          module_id: selectedModule.id,
          title: `${lesson.title} (Copy)`,
          markdown_content: lesson.markdown_content,
          video_url: lesson.video_url,
          quiz_id: lesson.quiz_id,
          duration: lesson.duration,
          order_index: lessons.length,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error duplicating lesson:", error);
        setError("Failed to duplicate lesson.");
        return;
      }

      setSuccess("Lesson duplicated successfully!");
      loadLessons(selectedModule.id);
    } catch (err) {
      console.error("Unexpected error duplicating lesson:", err);
      setError("An unexpected error occurred.");
    }
  };

  const handleLessonDragStart = (e: React.DragEvent, lessonId: string) => {
    setDraggedLessonId(lessonId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleLessonDragOver = (e: React.DragEvent, lessonId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedOverLessonId(lessonId);
  };

  const handleLessonDragLeave = () => {
    setDraggedOverLessonId(null);
  };

  const handleLessonDrop = async (e: React.DragEvent, targetLessonId: string) => {
    e.preventDefault();
    setDraggedOverLessonId(null);

    if (!draggedLessonId || !selectedModule || draggedLessonId === targetLessonId) {
      setDraggedLessonId(null);
      return;
    }

    const draggedLesson = lessons.find((l) => l.id === draggedLessonId);
    const targetLesson = lessons.find((l) => l.id === targetLessonId);

    if (!draggedLesson || !targetLesson) {
      setDraggedLessonId(null);
      return;
    }

    const newLessons = [...lessons];
    const draggedIndex = newLessons.findIndex((l) => l.id === draggedLessonId);
    const targetIndex = newLessons.findIndex((l) => l.id === targetLessonId);

    newLessons.splice(draggedIndex, 1);
    newLessons.splice(targetIndex, 0, draggedLesson);

    const updates = newLessons.map((lesson, index) => ({
      id: lesson.id,
      order_index: index,
    }));

    if (!supabase) {
      setError("Supabase client not configured.");
      setDraggedLessonId(null);
      return;
    }
    try {
      for (const update of updates) {
        const { error } = await supabase
          .from("lessons")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) {
          console.error("Error updating lesson order:", error);
          setError("Failed to reorder lessons.");
          loadLessons(selectedModule.id);
          setDraggedLessonId(null);
          return;
        }
      }

      setSuccess("Lessons reordered successfully!");
      loadLessons(selectedModule.id);
    } catch (err) {
      console.error("Unexpected error reordering lessons:", err);
      setError("An unexpected error occurred.");
      loadLessons(selectedModule.id);
    } finally {
      setDraggedLessonId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    setDraggedModuleId(moduleId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedOverModuleId(moduleId);
  };

  const handleDragLeave = () => {
    setDraggedOverModuleId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetModuleId: string) => {
    e.preventDefault();
    setDraggedOverModuleId(null);

    if (!draggedModuleId || !selectedCourse || draggedModuleId === targetModuleId) {
      setDraggedModuleId(null);
      return;
    }

    const draggedModule = modules.find((m) => m.id === draggedModuleId);
    const targetModule = modules.find((m) => m.id === targetModuleId);

    if (!draggedModule || !targetModule) {
      setDraggedModuleId(null);
      return;
    }

    // Calculate new order indices
    const newModules = [...modules];
    const draggedIndex = newModules.findIndex((m) => m.id === draggedModuleId);
    const targetIndex = newModules.findIndex((m) => m.id === targetModuleId);

    // Remove dragged module from its position
    newModules.splice(draggedIndex, 1);
    // Insert at target position
    newModules.splice(targetIndex, 0, draggedModule);

    // Update order indices
    const updates = newModules.map((module, index) => ({
      id: module.id,
      order_index: index,
    }));

    if (!supabase) {
      setError("Supabase client not configured.");
      setDraggedModuleId(null);
      return;
    }
    try {
      // Update all modules with new order indices
      for (const update of updates) {
        const { error } = await supabase
          .from("modules")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) {
          console.error("Error updating module order:", error);
          setError("Failed to reorder modules.");
          loadModules(selectedCourse.id);
          setDraggedModuleId(null);
          return;
        }
      }

      setSuccess("Modules reordered successfully!");
      loadModules(selectedCourse.id);
    } catch (err) {
      console.error("Unexpected error reordering modules:", err);
      setError("An unexpected error occurred.");
      loadModules(selectedCourse.id);
    } finally {
      setDraggedModuleId(null);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-center min-height-[300px]">
          <p className="text-base text-muted-foreground">
            Checking admin access...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Courses Admin</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Create and manage classes, modules, and lessons for the Web3 Coding Academy.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          {/* Course Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCourse ? "Edit Course" : "Create New Course"}
              </CardTitle>
              <CardDescription>
                {selectedCourse
                  ? "Update course information and thumbnail."
                  : "Creates a record in the Supabase courses table."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Course Title
                  </label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Solana Development Bootcamp"
                    defaultValue={selectedCourse?.title || ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what this course will teach..."
                    rows={4}
                    defaultValue={selectedCourse?.description || ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Developer">Developer</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Videography / Photography">
                        Videography / Photography
                      </SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Solana Integration">
                        Solana Integration
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="category" value={category} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="thumbnail" className="text-sm font-medium">
                    Course Image
                  </label>
                  <div className="space-y-4">
                    {imagePreview && (
                      <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border border-border">
                        <Image
                          src={imagePreview}
                          alt="Course thumbnail preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                          }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background border border-border"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <label
                        htmlFor="image-upload"
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-muted transition-colors"
                      >
                        <ImageIcon className="h-4 w-4" />
                        {imageFile ? "Change Image" : "Upload Image"}
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      {!imagePreview && (
                        <span className="text-sm text-muted-foreground">
                          Or enter a URL below
                        </span>
                      )}
                    </div>
                    {!imageFile && (
                      <Input
                        id="thumbnail"
                        name="thumbnail"
                        placeholder="https://..."
                        defaultValue={selectedCourse?.thumbnail || ""}
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    defaultChecked={selectedCourse?.featured || false}
                    className="rounded border-border"
                  />
                  <label htmlFor="featured" className="text-sm font-medium">
                    Featured Course
                  </label>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {selectedCourse ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      selectedCourse ? "Update Course" : "Create Course"
                    )}
                  </Button>
                  {selectedCourse && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleNewCourse}
                    >
                      New Course
                    </Button>
                  )}
                  <Button type="button" variant="outline" asChild>
                    <Link href="/academy?tab=courses">View Courses</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Course List */}
          <Card>
            <CardHeader>
              <CardTitle>All Classes</CardTitle>
              <CardDescription>
                {loadingCourses
                  ? "Loading courses..."
                  : `${courses.length} class${courses.length !== 1 ? "es" : ""} found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCourses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : courses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No classes found. Create your first class above.
                </p>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative w-24 h-16 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={course.thumbnail}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{course.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-muted">
                            {course.category}
                          </span>
                          {course.featured && (
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCourse(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Module Management</CardTitle>
                  <CardDescription>
                    {selectedCourse
                      ? `Manage modules for "${selectedCourse.title}" - Drag and drop to reorder`
                      : "Select a course to manage its modules"}
                  </CardDescription>
                </div>
                {selectedCourse && (
                  <Button onClick={() => openModuleModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedCourse ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    Please select a course from the Courses tab to manage modules.
                  </p>
                  <Button variant="outline" onClick={() => {
                    const tabs = document.querySelector('[role="tablist"]');
                    const coursesTab = tabs?.querySelector('[value="courses"]') as HTMLElement;
                    coursesTab?.click();
                  }}>
                    Go to Courses Tab
                  </Button>
                </div>
              ) : modules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    No modules found. Add your first module above.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {modules.map((module, index) => (
                    <div
                      key={module.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, module.id)}
                      onDragOver={(e) => handleDragOver(e, module.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, module.id)}
                      className={`flex items-start gap-4 p-4 border border-border rounded-lg transition-all cursor-move ${
                        draggedModuleId === module.id
                          ? "opacity-50"
                          : draggedOverModuleId === module.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground w-8">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">{module.title}</h3>
                        {module.description && (
                          <p className="text-sm text-muted-foreground">
                            {module.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModuleModal(module)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteModuleClick(module.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lesson Management</CardTitle>
                  <CardDescription>
                    {selectedModule
                      ? `Manage lessons for "${selectedModule.title}" - Drag and drop to reorder`
                      : selectedCourse
                      ? "Select a module to manage its lessons"
                      : "Select a course and module to manage lessons"}
                  </CardDescription>
                </div>
                {selectedModule && (
                  <Button onClick={() => openLessonModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedCourse ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    Please select a course from the Courses tab first.
                  </p>
                  <Button variant="outline" onClick={() => {
                    const tabs = document.querySelector('[role="tablist"]');
                    const coursesTab = tabs?.querySelector('[value="courses"]') as HTMLElement;
                    coursesTab?.click();
                  }}>
                    Go to Courses Tab
                  </Button>
                </div>
              ) : !selectedModule ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Select a module from the Modules tab to manage its lessons.
                  </p>
                  <div className="space-y-2">
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedModule(module)}
                      >
                        <div>
                          <h4 className="font-medium">{module.title}</h4>
                          {module.description && (
                            <p className="text-sm text-muted-foreground">
                              {module.description}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : loadingLessons ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    No lessons found. Add your first lesson above.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, index) => {
                    const lessonTypeDisplay = lesson.video_url
                      ? "Video"
                      : lesson.quiz_id
                      ? "Quiz"
                      : "Markdown";
                    return (
                      <div
                        key={lesson.id}
                        draggable
                        onDragStart={(e) => handleLessonDragStart(e, lesson.id)}
                        onDragOver={(e) => handleLessonDragOver(e, lesson.id)}
                        onDragLeave={handleLessonDragLeave}
                        onDrop={(e) => handleLessonDrop(e, lesson.id)}
                        className={`flex items-start gap-4 p-4 border border-border rounded-lg transition-all cursor-move ${
                          draggedLessonId === lesson.id
                            ? "opacity-50"
                            : draggedOverLessonId === lesson.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground w-8">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{lesson.title}</h3>
                            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {lessonTypeDisplay}
                            </span>
                          </div>
                          {lesson.duration && (
                            <p className="text-xs text-muted-foreground">
                              Duration: {lesson.duration} minutes
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openLessonModal(lesson)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicateLesson(lesson)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLessonClick(lesson.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Module Modal */}
      <Dialog open={moduleModalOpen} onOpenChange={setModuleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModule ? "Edit Module" : "Add New Module"}
            </DialogTitle>
            <DialogDescription>
              {editingModule
                ? "Update the module information below."
                : "Enter the module details to add it to the course."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="module-title" className="text-sm font-medium">
                Module Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="module-title"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder="e.g., Introduction to Web3"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="module-description" className="text-sm font-medium">
                Module Description
              </label>
              <Textarea
                id="module-description"
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
                placeholder="Describe what this module covers..."
                rows={4}
              />
            </div>
            {editingModule && (
              <div className="text-sm text-muted-foreground">
                <p>Sort Order: {editingModule.order_index + 1}</p>
                <p className="text-xs mt-1">
                  Use drag & drop in the module list to reorder modules.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModuleModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveModule}>
              {editingModule ? "Update Module" : "Add Module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Modal */}
      <Dialog open={lessonModalOpen} onOpenChange={setLessonModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Edit Lesson" : "Add New Lesson"}
            </DialogTitle>
            <DialogDescription>
              {editingLesson
                ? "Update the lesson information below."
                : "Enter the lesson details to add it to the module."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label htmlFor="lesson-title" className="text-sm font-medium">
                Lesson Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="lesson-title"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g., Introduction to Web3"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lesson-type" className="text-sm font-medium">
                Lesson Type <span className="text-red-500">*</span>
              </label>
              <Select value={lessonType} onValueChange={(value) => setLessonType(value as LessonType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lesson type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">Text / Markdown</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="lesson-duration" className="text-sm font-medium">
                Duration (minutes)
              </label>
              <Input
                id="lesson-duration"
                type="number"
                min="0"
                value={lessonDuration || ""}
                onChange={(e) => setLessonDuration(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 15"
              />
            </div>

            {/* Markdown/Text Content */}
            {lessonType === "markdown" && (
              <div className="space-y-2">
                <label htmlFor="markdown-content" className="text-sm font-medium">
                  Markdown Content
                </label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <Editor
                    height="400px"
                    defaultLanguage="markdown"
                    value={markdownContent}
                    onChange={(value) => setMarkdownContent(value || "")}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: "on",
                      lineNumbers: "on",
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Write your lesson content in Markdown format. Supports headings, lists, code blocks, and more.
                </p>
              </div>
            )}

            {/* Video Content */}
            {lessonType === "video" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="video-url" className="text-sm font-medium">
                    Video URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="video-url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports YouTube, Vimeo, or custom video URLs
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="video-thumbnail" className="text-sm font-medium">
                    Thumbnail Override (Optional)
                  </label>
                  {videoThumbnail && (
                    <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border border-border mb-2">
                      <Image
                        src={videoThumbnail}
                        alt="Video thumbnail preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setVideoThumbnail(null);
                          setVideoThumbnailFile(null);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background border border-border"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="video-thumbnail-upload"
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-muted transition-colors"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {videoThumbnailFile ? "Change Thumbnail" : "Upload Thumbnail"}
                    </label>
                    <input
                      id="video-thumbnail-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setVideoThumbnailFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setVideoThumbnail(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Content */}
            {lessonType === "quiz" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Quiz Questions</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuizQuestions([
                        ...quizQuestions,
                        {
                          id: Date.now().toString(),
                          type: "multiple-choice",
                          question: "",
                          options: ["", "", "", ""],
                          correctAnswer: "",
                          scoreWeight: 1,
                        },
                      ]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {quizQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No questions yet. Click "Add Question" to get started.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {quizQuestions.map((question, qIndex) => (
                      <Card key={question.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Question {qIndex + 1}</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setQuizQuestions(quizQuestions.filter((q) => q.id !== question.id));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Question Type</label>
                            <Select
                              value={question.type}
                              onValueChange={(value) => {
                                const updated = [...quizQuestions];
                                updated[qIndex] = {
                                  ...question,
                                  type: value as "multiple-choice" | "true-false" | "short-answer",
                                  options: value === "multiple-choice" ? ["", "", "", ""] : undefined,
                                };
                                setQuizQuestions(updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                <SelectItem value="true-false">True/False</SelectItem>
                                <SelectItem value="short-answer">Short Answer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Question</label>
                            <Textarea
                              value={question.question}
                              onChange={(e) => {
                                const updated = [...quizQuestions];
                                updated[qIndex].question = e.target.value;
                                setQuizQuestions(updated);
                              }}
                              placeholder="Enter your question..."
                              rows={2}
                            />
                          </div>

                          {question.type === "multiple-choice" && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Options</label>
                              {question.options?.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const updated = [...quizQuestions];
                                      if (updated[qIndex].options) {
                                        updated[qIndex].options![oIndex] = e.target.value;
                                      }
                                      setQuizQuestions(updated);
                                    }}
                                    placeholder={`Option ${oIndex + 1}`}
                                  />
                                  <input
                                    type="radio"
                                    name={`correct-${question.id}`}
                                    checked={question.correctAnswer === option}
                                    onChange={() => {
                                      const updated = [...quizQuestions];
                                      updated[qIndex].correctAnswer = option;
                                      setQuizQuestions(updated);
                                    }}
                                  />
                                  <span className="text-xs text-muted-foreground">Correct</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {(question.type === "true-false" || question.type === "short-answer") && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Correct Answer</label>
                              <Input
                                value={question.correctAnswer}
                                onChange={(e) => {
                                  const updated = [...quizQuestions];
                                  updated[qIndex].correctAnswer = e.target.value;
                                  setQuizQuestions(updated);
                                }}
                                placeholder={question.type === "true-false" ? "True or False" : "Enter correct answer"}
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Score Weight</label>
                            <Input
                              type="number"
                              min="1"
                              value={question.scoreWeight}
                              onChange={(e) => {
                                const updated = [...quizQuestions];
                                updated[qIndex].scoreWeight = parseInt(e.target.value) || 1;
                                setQuizQuestions(updated);
                              }}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lesson-published"
                checked={lessonPublished}
                onChange={(e) => setLessonPublished(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="lesson-published" className="text-sm font-medium">
                Publish Lesson
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeLessonModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveLesson}>
              {editingLesson ? "Update Lesson" : "Add Lesson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Module</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this module? This will also delete
              all lessons in this module. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white hover:opacity-90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Confirmation Modal */}
      <Dialog open={deleteLessonConfirmOpen} onOpenChange={setDeleteLessonConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lesson? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLessonConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDeleteLesson}
              className="bg-red-600 hover:bg-red-700 text-white hover:opacity-90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
