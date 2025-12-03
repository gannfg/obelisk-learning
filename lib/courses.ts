import { Course, Module, Lesson, CourseCategory } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CourseWithModules extends Course {
  modules: Module[];
}

/**
 * Fetch all courses from Supabase with their modules and lessons
 */
export async function getAllCourses(
  supabaseClient: SupabaseClient<any>
): Promise<CourseWithModules[]> {
  try {
    // Fetch courses
    const { data: courses, error: coursesError } = await supabaseClient
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (coursesError) {
      console.error("Error fetching courses:", coursesError);
      return [];
    }

    if (!courses || courses.length === 0) {
      return [];
    }

    // Fetch modules for all courses
    const courseIds = courses.map((c) => c.id);
    const { data: modules, error: modulesError } = await supabaseClient
      .from("modules")
      .select("*")
      .in("course_id", courseIds)
      .order("order_index", { ascending: true });

    if (modulesError) {
      console.error("Error fetching modules:", modulesError);
      // Continue with empty modules if there's an error
    }

    // Fetch lessons for all modules
    const moduleIds = modules?.map((m) => m.id) || [];
    const { data: lessons, error: lessonsError } = await supabaseClient
      .from("lessons")
      .select("*")
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true });

    if (lessonsError) {
      console.error("Error fetching lessons:", lessonsError);
      // Continue with empty lessons if there's an error
    }

    // Group modules by course_id
    const modulesByCourse = new Map<string, typeof modules>();
    modules?.forEach((module) => {
      if (!modulesByCourse.has(module.course_id)) {
        modulesByCourse.set(module.course_id, []);
      }
      modulesByCourse.get(module.course_id)!.push(module);
    });

    // Group lessons by module_id
    const lessonsByModule = new Map<string, typeof lessons>();
    lessons?.forEach((lesson) => {
      if (!lessonsByModule.has(lesson.module_id)) {
        lessonsByModule.set(lesson.module_id, []);
      }
      lessonsByModule.get(lesson.module_id)!.push(lesson);
    });

    // Transform to Course type
    const transformedCourses: CourseWithModules[] = courses.map((course) => {
      const courseModules = modulesByCourse.get(course.id) || [];
      const transformedModules: Module[] = courseModules.map((module) => {
        const moduleLessons = lessonsByModule.get(module.id) || [];
        const transformedLessons: Lesson[] = moduleLessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          markdownContent: lesson.markdown_content || undefined,
          videoUrl: lesson.video_url || undefined,
          quizId: lesson.quiz_id || undefined,
          duration: lesson.duration || undefined,
        }));

        return {
          id: module.id,
          title: module.title,
          description: module.description || undefined,
          lessons: transformedLessons,
        };
      });

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        instructorId: course.instructor_id,
        category: course.category as CourseCategory,
        modules: transformedModules,
        featured: course.featured || false,
      };
    });

    return transformedCourses;
  } catch (error) {
    console.error("Unexpected error fetching courses:", error);
    return [];
  }
}

/**
 * Fetch a single course by ID with all modules and lessons
 */
export async function getCourseById(
  supabaseClient: SupabaseClient<any>,
  courseId: string
): Promise<CourseWithModules | null> {
  try {
    // Fetch course
    const { data: course, error: courseError } = await supabaseClient
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      console.error("Error fetching course:", courseError);
      return null;
    }

    // Fetch modules
    const { data: modules, error: modulesError } = await supabaseClient
      .from("modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (modulesError) {
      console.error("Error fetching modules:", modulesError);
      return null;
    }

    // Fetch lessons for all modules
    const moduleIds = modules?.map((m) => m.id) || [];
    const { data: lessons, error: lessonsError } = await supabaseClient
      .from("lessons")
      .select("*")
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true });

    if (lessonsError) {
      console.error("Error fetching lessons:", lessonsError);
      // Continue with empty lessons
    }

    // Group lessons by module_id
    const lessonsByModule = new Map<string, typeof lessons>();
    lessons?.forEach((lesson) => {
      if (!lessonsByModule.has(lesson.module_id)) {
        lessonsByModule.set(lesson.module_id, []);
      }
      lessonsByModule.get(lesson.module_id)!.push(lesson);
    });

    // Transform to Course type
    const transformedModules: Module[] = (modules || []).map((module) => {
      const moduleLessons = lessonsByModule.get(module.id) || [];
      const transformedLessons: Lesson[] = moduleLessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        markdownContent: lesson.markdown_content || undefined,
        videoUrl: lesson.video_url || undefined,
        quizId: lesson.quiz_id || undefined,
        duration: lesson.duration || undefined,
      }));

      return {
        id: module.id,
        title: module.title,
        description: module.description || undefined,
        lessons: transformedLessons,
      };
    });

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      instructorId: course.instructor_id,
      category: course.category as CourseCategory,
      modules: transformedModules,
      featured: course.featured || false,
    };
  } catch (error) {
    console.error("Unexpected error fetching course:", error);
    return null;
  }
}

