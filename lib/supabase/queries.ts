import { createClient } from "./server";
import { Course, Instructor, CourseCategory, CourseProgress, LessonProgress } from "@/types";

// Instructors
export async function getInstructors(): Promise<Instructor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("instructors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching instructors:", error);
    return [];
  }

  return data.map((instructor) => ({
    id: instructor.id,
    name: instructor.name,
    avatar: instructor.avatar,
    bio: instructor.bio,
    specializations: instructor.specializations || [],
    socials: instructor.socials || {},
  }));
}

export async function getInstructorById(id: string): Promise<Instructor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("instructors")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar,
    bio: data.bio,
    specializations: data.specializations || [],
    socials: data.socials || {},
  };
}

// Courses
export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      *,
      modules:modules(
        *,
        lessons:lessons(*)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching courses:", error);
    return [];
  }

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    instructorId: course.instructor_id,
    category: course.category as CourseCategory,
    featured: course.featured || false,
    modules: (course.modules || []).map((module: any) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      lessons: (module.lessons || []).map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        markdownContent: lesson.markdown_content,
        videoUrl: lesson.video_url,
        quizId: lesson.quiz_id,
        duration: lesson.duration,
      })),
    })),
  }));
}

export async function getCourseById(id: string): Promise<Course | null> {
  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      *,
      modules:modules(
        *,
        lessons:lessons(*)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !course) {
    return null;
  }

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    instructorId: course.instructor_id,
    category: course.category as CourseCategory,
    featured: course.featured || false,
    modules: (course.modules || []).map((module: any) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      lessons: (module.lessons || []).map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        markdownContent: lesson.markdown_content,
        videoUrl: lesson.video_url,
        quizId: lesson.quiz_id,
        duration: lesson.duration,
      })),
    })),
  };
}

export async function getCoursesByCategory(category: CourseCategory): Promise<Course[]> {
  const supabase = await createClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      *,
      modules:modules(
        *,
        lessons:lessons(*)
      )
    `)
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching courses by category:", error);
    return [];
  }

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    instructorId: course.instructor_id,
    category: course.category as CourseCategory,
    featured: course.featured || false,
    modules: (course.modules || []).map((module: any) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      lessons: (module.lessons || []).map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        markdownContent: lesson.markdown_content,
        videoUrl: lesson.video_url,
        quizId: lesson.quiz_id,
        duration: lesson.duration,
      })),
    })),
  }));
}

export async function getFeaturedCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      *,
      modules:modules(
        *,
        lessons:lessons(*)
      )
    `)
    .eq("featured", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching featured courses:", error);
    return [];
  }

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    instructorId: course.instructor_id,
    category: course.category as CourseCategory,
    featured: course.featured || false,
    modules: (course.modules || []).map((module: any) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      lessons: (module.lessons || []).map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        markdownContent: lesson.markdown_content,
        videoUrl: lesson.video_url,
        quizId: lesson.quiz_id,
        duration: lesson.duration,
      })),
    })),
  }));
}

export async function getCoursesByInstructor(instructorId: string): Promise<Course[]> {
  const supabase = await createClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      *,
      modules:modules(
        *,
        lessons:lessons(*)
      )
    `)
    .eq("instructor_id", instructorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching courses by instructor:", error);
    return [];
  }

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    instructorId: course.instructor_id,
    category: course.category as CourseCategory,
    featured: course.featured || false,
    modules: (course.modules || []).map((module: any) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      lessons: (module.lessons || []).map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        markdownContent: lesson.markdown_content,
        videoUrl: lesson.video_url,
        quizId: lesson.quiz_id,
        duration: lesson.duration,
      })),
    })),
  }));
}

// Progress tracking
export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<CourseProgress | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (error || !data) {
    return null;
  }

  return {
    courseId,
    lessons: data.map((progress) => ({
      lessonId: progress.lesson_id,
      completed: progress.completed,
      completedAt: progress.completed_at ? new Date(progress.completed_at) : undefined,
    })),
    lastAccessedAt: data[0]?.updated_at ? new Date(data[0].updated_at) : undefined,
  };
}

export async function markLessonComplete(
  userId: string,
  courseId: string,
  lessonId: string
): Promise<void> {
  const supabase = await createClient();
  
  // Upsert lesson progress
  const { error: progressError } = await supabase
    .from("lesson_progress")
    .upsert({
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    });

  if (progressError) {
    console.error("Error marking lesson complete:", progressError);
    throw progressError;
  }

  // Update course progress last accessed
  await supabase
    .from("course_progress")
    .upsert({
      user_id: userId,
      course_id: courseId,
      last_accessed_at: new Date().toISOString(),
    });
}

export async function getCompletedLessons(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("completed", true);

  if (error || !data) {
    return new Set();
  }

  return new Set(data.map((progress) => progress.lesson_id));
}

export async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single();

  return !error && !!data;
}

export async function enrollInCourse(userId: string, courseId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .insert({
      user_id: userId,
      course_id: courseId,
    });

  if (error) {
    console.error("Error enrolling in course:", error);
    throw error;
  }
}

