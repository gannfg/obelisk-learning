/**
 * Semester-Based Classes Management System - Data Access Layer
 */

import { createLearningClient } from "@/lib/supabase/learning-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Class,
  ClassModule,
  LiveSession,
  ClassEnrollment,
  SessionAttendance,
  ClassAssignment,
  AssignmentSubmission,
  ClassAnnouncement,
  ClassMentor,
  ClassXPConfig,
  CreateClassInput,
  UpdateClassInput,
  CreateModuleInput,
  CreateSessionInput,
  CreateAssignmentInput,
  CreateAnnouncementInput,
  ClassStats,
  SubmissionStatus,
  XPActionType,
  LearningMaterial,
} from "@/types/classes";

// Re-export types for convenience
export type {
  Class,
  ClassModule,
  LiveSession,
  ClassEnrollment,
  SessionAttendance,
  ClassAssignment,
  AssignmentSubmission,
  ClassAnnouncement,
  ClassMentor,
  ClassXPConfig,
  CreateClassInput,
  UpdateClassInput,
  CreateModuleInput,
  CreateSessionInput,
  CreateAssignmentInput,
  CreateAnnouncementInput,
  ClassStats,
  SubmissionStatus,
  XPActionType,
  LearningMaterial,
};

// Helper function to ensure supabase client is not null
function ensureSupabaseClient(
  supabaseClient?: SupabaseClient<any>
): SupabaseClient<any> {
  const client = supabaseClient || createLearningClient();
  if (!client) {
    throw new Error("Supabase client not configured.");
  }
  return client;
}

/**
 * Normalize class data from Supabase
 */
function normalizeClass(data: any): Class {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    thumbnail: data.thumbnail,
    category: data.category,
    semester: data.semester,
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    maxCapacity: data.max_capacity,
    status: data.status,
    published: data.published,
    enrollmentLocked: data.enrollment_locked,
    mentorId: data.instructor_id,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Normalize module data from Supabase
 */
function normalizeModule(data: any): ClassModule {
  return {
    id: data.id,
    classId: data.class_id,
    weekNumber: data.week_number,
    title: data.title,
    description: data.description,
    startDate: data.start_date ? new Date(data.start_date) : undefined,
    endDate: data.end_date ? new Date(data.end_date) : undefined,
    liveSessionLink: data.live_session_link,
    embedVideoUrl: data.embed_video_url,
    learningMaterials: data.learning_materials || [],
    locked: data.locked,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    // Support classroom system fields
    content: data.content,
    isReleased: data.is_released,
    releaseDate: data.release_date ? new Date(data.release_date) : undefined,
  } as ClassModule;
}

/**
 * Normalize session data from Supabase
 */
function normalizeSession(data: any): LiveSession {
  return {
    id: data.id,
    moduleId: data.module_id,
    classId: data.class_id,
    title: data.title,
    description: data.description,
    sessionDate: new Date(data.session_date),
    locationType: data.location_type,
    location: data.location,
    meetingLink: data.meeting_link,
    attendanceTracking: data.attendance_tracking,
    qrToken: data.qr_token,
    qrExpiresAt: data.qr_expires_at ? new Date(data.qr_expires_at) : undefined,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Get all classes
 */
export async function getAllClasses(
  options?: {
    status?: string;
    mentorId?: string;
    publishedOnly?: boolean;
    createdBy?: string;
  },
  supabaseClient?: SupabaseClient<any>
): Promise<Class[]> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    let query = supabase.from("classes").select("*").order("start_date", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }
    if (options?.mentorId) {
      query = query.eq("instructor_id", options.mentorId);
    }
    if (options?.createdBy) {
      query = query.eq("created_by", options.createdBy);
    }
    if (options?.publishedOnly) {
      query = query.eq("published", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching classes:", error);
      return [];
    }

    return (data || []).map(normalizeClass);
  } catch (error) {
    console.error("Error in getAllClasses:", error);
    return [];
  }
}

/**
 * Get class by ID
 */
export async function getClassById(
  id: string,
  supabaseClient?: SupabaseClient<any>
): Promise<Class | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase.from("classes").select("*").eq("id", id).single();

    if (error) {
      console.error("Error fetching class:", error);
      return null;
    }

    return data ? normalizeClass(data) : null;
  } catch (error) {
    console.error("Error in getClassById:", error);
    return null;
  }
}

/**
 * Interface for class with modules (similar to CourseWithModules)
 */
export interface ClassWithModules extends Class {
  modules: ClassModule[];
}

/**
 * Get all classes with their modules (similar to getAllCourses)
 */
export async function getAllClassesWithModules(
  options?: {
    status?: string;
    mentorId?: string;
    publishedOnly?: boolean;
  },
  supabaseClient?: SupabaseClient<any>
): Promise<ClassWithModules[]> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    
    // Fetch classes
    let query = supabase.from("classes").select("*").order("start_date", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }
    if (options?.mentorId) {
      query = query.eq("instructor_id", options.mentorId);
    }
    if (options?.publishedOnly) {
      query = query.eq("published", true);
    }

    const { data: classes, error: classesError } = await query;

    if (classesError) {
      console.error("Error fetching classes:", classesError);
      return [];
    }

    if (!classes || classes.length === 0) {
      return [];
    }

    // Fetch modules for all classes
    const classIds = classes.map((c) => c.id);
    const { data: modules, error: modulesError } = await supabase
      .from("class_modules")
      .select("*")
      .in("class_id", classIds)
      .order("week_number", { ascending: true });

    if (modulesError) {
      console.error("Error fetching modules:", modulesError);
      // Continue with empty modules if there's an error
    }

    // Group modules by class_id
    const modulesByClass = new Map<string, typeof modules>();
    modules?.forEach((module) => {
      if (!modulesByClass.has(module.class_id)) {
        modulesByClass.set(module.class_id, []);
      }
      modulesByClass.get(module.class_id)!.push(module);
    });

    // Transform to ClassWithModules type
    const transformedClasses: ClassWithModules[] = classes.map((classData) => {
      const classModules = modulesByClass.get(classData.id) || [];
      const transformedModules: ClassModule[] = classModules.map(normalizeModule);

      return {
        ...normalizeClass(classData),
        modules: transformedModules,
      };
    });

    return transformedClasses;
  } catch (error) {
    console.error("Error in getAllClassesWithModules:", error);
    return [];
  }
}

/**
 * Get class by ID with modules (similar to getCourseById)
 */
export async function getClassByIdWithModules(
  id: string,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassWithModules | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    
    // Fetch class
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("*")
      .eq("id", id)
      .single();

    if (classError || !classData) {
      console.error("Error fetching class:", classError);
      return null;
    }

    // Fetch modules
    const { data: modules, error: modulesError } = await supabase
      .from("class_modules")
      .select("*")
      .eq("class_id", id)
      .order("week_number", { ascending: true });

    if (modulesError) {
      console.error("Error fetching modules:", modulesError);
      // Continue with empty modules
    }

    // Transform to ClassWithModules type
    const transformedModules: ClassModule[] = (modules || []).map(normalizeModule);

    return {
      ...normalizeClass(classData),
      modules: transformedModules,
    };
  } catch (error) {
    console.error("Error in getClassByIdWithModules:", error);
    return null;
  }
}

/**
 * Create a new class
 */
export async function createClass(
  input: CreateClassInput,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<Class | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("classes")
      .insert({
        title: input.title,
        description: input.description,
        thumbnail: input.thumbnail,
        category: input.category,
        semester: input.semester,
        start_date: input.startDate,
        end_date: input.endDate,
        max_capacity: input.maxCapacity,
        published: input.published || false,
        enrollment_locked: input.enrollmentLocked || false,
        instructor_id: input.mentorId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating class:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error hint:", error.hint);
      throw new Error(error.message || `Failed to create class: ${error.code || "Unknown error"}`);
    }

    // Also create mentor relationship
    await supabase.from("class_instructors").insert({
      class_id: data.id,
      instructor_id: input.mentorId,
      role: "mentor",
    });

    return normalizeClass(data);
  } catch (error) {
    console.error("Error in createClass:", error);
    return null;
  }
}

/**
 * Update a class
 */
export async function updateClass(
  input: UpdateClassInput,
  supabaseClient?: SupabaseClient<any>
): Promise<Class | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.thumbnail !== undefined) updateData.thumbnail = input.thumbnail;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.semester !== undefined) updateData.semester = input.semester;
    if (input.startDate !== undefined) updateData.start_date = input.startDate;
    if (input.endDate !== undefined) updateData.end_date = input.endDate;
    if (input.maxCapacity !== undefined) updateData.max_capacity = input.maxCapacity;
    if (input.published !== undefined) updateData.published = input.published;
    if (input.enrollmentLocked !== undefined) updateData.enrollment_locked = input.enrollmentLocked;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.mentorId !== undefined) updateData.instructor_id = input.mentorId;

    const { data, error } = await supabase
      .from("classes")
      .update(updateData)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating class:", error);
      return null;
    }

    return normalizeClass(data);
  } catch (error) {
    console.error("Error in updateClass:", error);
    return null;
  }
}

/**
 * Delete a class
 */
export async function deleteClass(
  id: string,
  supabaseClient?: SupabaseClient<any>
): Promise<boolean> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { error } = await supabase.from("classes").delete().eq("id", id);

    if (error) {
      console.error("Error deleting class:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteClass:", error);
    return false;
  }
}

/**
 * Get modules for a class
 */
export async function getClassModules(
  classId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassModule[]> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_modules")
      .select("*")
      .eq("class_id", classId)
      .order("week_number", { ascending: true });

    if (error) {
      console.error("Error fetching modules:", error);
      return [];
    }

    return (data || []).map(normalizeModule);
  } catch (error) {
    console.error("Error in getClassModules:", error);
    return [];
  }
}

/**
 * Create a module
 */
export async function createModule(
  input: CreateModuleInput,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassModule | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_modules")
      .insert({
        class_id: input.classId,
        week_number: input.weekNumber,
        title: input.title,
        description: input.description,
        start_date: input.startDate,
        end_date: input.endDate,
        live_session_link: input.liveSessionLink,
        embed_video_url: input.embedVideoUrl,
        learning_materials: input.learningMaterials || [],
        // Support structured content (e.g. sections with description + YouTube URL)
        content: (input as any).content,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating module:", error);
      return null;
    }

    return normalizeModule(data);
  } catch (error) {
    console.error("Error in createModule:", error);
    return null;
  }
}

/**
 * Update a module
 */
export async function updateModule(
  id: string,
  updates: Partial<CreateModuleInput>,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassModule | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
    if (updates.liveSessionLink !== undefined) updateData.live_session_link = updates.liveSessionLink;
     if (updates.embedVideoUrl !== undefined) updateData.embed_video_url = updates.embedVideoUrl;
    if (updates.learningMaterials !== undefined) updateData.learning_materials = updates.learningMaterials;
    // Support content and releaseDate from classroom system
    if ((updates as any).content !== undefined) updateData.content = (updates as any).content;
    if ((updates as any).releaseDate !== undefined) updateData.release_date = (updates as any).releaseDate;

    const { data, error } = await supabase
      .from("class_modules")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating module:", error);
      return null;
    }

    return normalizeModule(data);
  } catch (error) {
    console.error("Error in updateModule:", error);
    return null;
  }
}

/**
 * Delete a module
 */
export async function deleteModule(
  id: string,
  supabaseClient?: SupabaseClient<any>
): Promise<boolean> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { error } = await supabase.from("class_modules").delete().eq("id", id);

    if (error) {
      console.error("Error deleting module:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteModule:", error);
    return false;
  }
}

/**
 * Get live sessions for a module
 */
export async function getModuleSessions(
  moduleId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<LiveSession[]> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("live_sessions")
      .select("*")
      .eq("module_id", moduleId)
      .order("session_date", { ascending: true });

    if (error) {
      console.error("Error fetching sessions:", error);
      return [];
    }

    return (data || []).map(normalizeSession);
  } catch (error) {
    console.error("Error in getModuleSessions:", error);
    return [];
  }
}

/**
 * Create a live session
 */
export async function createSession(
  input: CreateSessionInput,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<LiveSession | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("live_sessions")
      .insert({
        module_id: input.moduleId,
        class_id: input.classId,
        title: input.title,
        description: input.description,
        session_date: input.sessionDate,
        location_type: input.locationType,
        location: input.location,
        meeting_link: input.meetingLink,
        attendance_tracking: input.attendanceTracking !== false,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return null;
    }

    return normalizeSession(data);
  } catch (error) {
    console.error("Error in createSession:", error);
    return null;
  }
}

/**
 * Get enrollments for a class
 */
export async function getClassEnrollments(
  classId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassEnrollment[]> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_enrollments")
      .select("*")
      .eq("class_id", classId)
      .order("enrolled_at", { ascending: false });

    if (error) {
      console.error("Error fetching enrollments:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      classId: item.class_id,
      userId: item.user_id,
      enrolledAt: new Date(item.enrolled_at),
      enrolledBy: item.enrolled_by,
      status: item.status,
    }));
  } catch (error) {
    console.error("Error in getClassEnrollments:", error);
    return [];
  }
}

/**
 * Enroll a user in a class
 */
export async function enrollUser(
  classId: string,
  userId: string,
  enrolledBy?: string,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassEnrollment | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_enrollments")
      .insert({
        class_id: classId,
        user_id: userId,
        enrolled_by: enrolledBy,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Error enrolling user:", error);
      return null;
    }

    return {
      id: data.id,
      classId: data.class_id,
      userId: data.user_id,
      enrolledAt: new Date(data.enrolled_at),
      enrolledBy: data.enrolled_by,
      status: data.status,
    };
  } catch (error) {
    console.error("Error in enrollUser:", error);
    return null;
  }
}

/**
 * Remove enrollment
 */
export async function removeEnrollment(
  classId: string,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<boolean> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { error } = await supabase
      .from("class_enrollments")
      .delete()
      .eq("class_id", classId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing enrollment:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in removeEnrollment:", error);
    return false;
  }
}

/**
 * Get assignments for a module
 */
export async function getModuleAssignments(
  moduleId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassAssignment[]> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_assignments")
      .select("*")
      .eq("module_id", moduleId)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching assignments:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      moduleId: item.module_id,
      classId: item.class_id,
      title: item.title,
      description: item.description,
      instructions: item.instructions,
      dueDate: new Date(item.due_date),
      submissionType: item.submission_type,
      maxFileSize: item.max_file_size,
      allowedFileTypes: item.allowed_file_types,
      lockAfterDeadline: item.lock_after_deadline,
      xpReward: item.xp_reward,
      createdBy: item.created_by,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error) {
    console.error("Error in getModuleAssignments:", error);
    return [];
  }
}

/**
 * Create an assignment
 */
export async function createAssignment(
  input: CreateAssignmentInput,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassAssignment | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_assignments")
      .insert({
        module_id: input.moduleId,
        class_id: input.classId,
        title: input.title,
        description: input.description,
        instructions: input.instructions,
        due_date: input.dueDate,
        submission_type: input.submissionType,
        max_file_size: input.maxFileSize,
        allowed_file_types: input.allowedFileTypes,
        lock_after_deadline: input.lockAfterDeadline || false,
        xp_reward: input.xpReward || 0,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating assignment:", error);
      return null;
    }

    return {
      id: data.id,
      moduleId: data.module_id,
      classId: data.class_id,
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      dueDate: new Date(data.due_date),
      submissionType: data.submission_type,
      maxFileSize: data.max_file_size,
      allowedFileTypes: data.allowed_file_types,
      lockAfterDeadline: data.lock_after_deadline,
      xpReward: data.xp_reward,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error("Error in createAssignment:", error);
    return null;
  }
}

/**
 * Update an existing assignment
 */
export async function updateAssignment(
  assignmentId: string,
  input: Partial<CreateAssignmentInput> & { dueDate?: string },
  supabaseClient?: SupabaseClient<any>
): Promise<ClassAssignment | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const updateData: any = {};
    
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.instructions !== undefined) updateData.instructions = input.instructions;
    if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
    if (input.submissionType !== undefined) updateData.submission_type = input.submissionType;
    if (input.maxFileSize !== undefined) updateData.max_file_size = input.maxFileSize;
    if (input.allowedFileTypes !== undefined) updateData.allowed_file_types = input.allowedFileTypes;
    if (input.lockAfterDeadline !== undefined) updateData.lock_after_deadline = input.lockAfterDeadline;
    if (input.xpReward !== undefined) updateData.xp_reward = input.xpReward;

    const { data, error } = await supabase
      .from("class_assignments")
      .update(updateData)
      .eq("id", assignmentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating assignment:", error);
      return null;
    }

    return {
      id: data.id,
      moduleId: data.module_id,
      classId: data.class_id,
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      dueDate: new Date(data.due_date),
      submissionType: data.submission_type,
      maxFileSize: data.max_file_size,
      allowedFileTypes: data.allowed_file_types,
      lockAfterDeadline: data.lock_after_deadline,
      xpReward: data.xp_reward,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error("Error in updateAssignment:", error);
    return null;
  }
}

/**
 * Get announcements for a class
 */
export async function getClassAnnouncements(
  classId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassAnnouncement[]> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_announcements")
      .select("*")
      .eq("class_id", classId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching announcements:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      classId: item.class_id,
      moduleId: item.module_id,
      title: item.title,
      content: item.content,
      pinned: item.pinned,
      createdBy: item.created_by,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error) {
    console.error("Error in getClassAnnouncements:", error);
    return [];
  }
}

/**
 * Create an announcement
 */
export async function createAnnouncement(
  input: CreateAnnouncementInput,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassAnnouncement | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_announcements")
      .insert({
        class_id: input.classId,
        module_id: input.moduleId,
        title: input.title,
        content: input.content,
        pinned: input.pinned || false,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating announcement:", error);
      return null;
    }

    return {
      id: data.id,
      classId: data.class_id,
      moduleId: data.module_id,
      title: data.title,
      content: data.content,
      pinned: data.pinned,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error("Error in createAnnouncement:", error);
    return null;
  }
}

/**
 * Get class statistics
 */
export async function getClassStats(
  classId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassStats | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);

    // Get enrollment stats
    const { count: totalEnrollments } = await supabase
      .from("class_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classId);

    const { count: activeEnrollments } = await supabase
      .from("class_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("status", "active");

    // Get average XP
    const averageXP = 0; // TODO: Calculate from user XP

    // Calculate attendance rate
    const { data: sessions } = await supabase
      .from("live_sessions")
      .select("id")
      .eq("class_id", classId);
    
    let totalPossibleAttendances = 0;
    let totalActualAttendances = 0;
    
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id);
      const { count: totalAttendances } = await supabase
        .from("session_attendance")
        .select("*", { count: "exact", head: true })
        .in("session_id", sessionIds);
      
      totalActualAttendances = totalAttendances || 0;
      totalPossibleAttendances = (activeEnrollments || 0) * sessions.length;
    }
    
    const attendanceRate = totalPossibleAttendances > 0 
      ? totalActualAttendances / totalPossibleAttendances 
      : 0;

    // Calculate assignment completion rate
    const { data: assignments } = await supabase
      .from("class_assignments")
      .select("id")
      .eq("class_id", classId);
    
    let totalPossibleSubmissions = 0;
    let totalActualSubmissions = 0;
    
    if (assignments && assignments.length > 0) {
      const assignmentIds = assignments.map((a) => a.id);
      const { count: totalSubmissions } = await supabase
        .from("assignment_submissions")
        .select("*", { count: "exact", head: true })
        .in("assignment_id", assignmentIds);
      
      totalActualSubmissions = totalSubmissions || 0;
      totalPossibleSubmissions = (activeEnrollments || 0) * assignments.length;
    }
    
    const assignmentCompletionRate = totalPossibleSubmissions > 0 
      ? totalActualSubmissions / totalPossibleSubmissions 
      : 0;

    return {
      totalEnrollments: totalEnrollments || 0,
      activeEnrollments: activeEnrollments || 0,
      attendanceRate,
      assignmentCompletionRate,
      averageXP,
    };
  } catch (error) {
    console.error("Error in getClassStats:", error);
    return null;
  }
}

/**
 * Generate QR token for a session
 */
export async function generateSessionQR(
  sessionId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<string | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const qrToken = `qr_${sessionId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const { data, error } = await supabase
      .from("live_sessions")
      .update({
        qr_token: qrToken,
        qr_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) {
      console.error("Error generating QR token:", error);
      return null;
    }

    return qrToken;
  } catch (error) {
    console.error("Error in generateSessionQR:", error);
    return null;
  }
}

/**
 * Get attendance for a session
 */
export async function getSessionAttendance(
  sessionId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<SessionAttendance[]> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("session_attendance")
      .select("*")
      .eq("session_id", sessionId)
      .order("checkin_time", { ascending: false });

    if (error) {
      console.error("Error fetching attendance:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      sessionId: item.session_id,
      userId: item.user_id,
      classId: item.class_id,
      checkinTime: new Date(item.checkin_time),
      method: item.method,
      checkedInBy: item.checked_in_by,
    }));
  } catch (error) {
    console.error("Error in getSessionAttendance:", error);
    return [];
  }
}

/**
 * Mark attendance manually
 */
export async function markAttendance(
  sessionId: string,
  userId: string,
  classId: string,
  checkedBy: string,
  supabaseClient?: SupabaseClient<any>
): Promise<SessionAttendance | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("session_attendance")
      .insert({
        session_id: sessionId,
        user_id: userId,
        class_id: classId,
        method: "manual",
        checked_in_by: checkedBy,
      })
      .select()
      .single();

    if (error) {
      console.error("Error marking attendance:", error);
      return null;
    }

    return {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      classId: data.class_id,
      checkinTime: new Date(data.checkin_time),
      method: data.method,
      checkedInBy: data.checked_in_by,
    };
  } catch (error) {
    console.error("Error in markAttendance:", error);
    return null;
  }
}

/**
 * Remove attendance record
 */
export async function removeAttendance(
  attendanceId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<boolean> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { error } = await supabase
      .from("session_attendance")
      .delete()
      .eq("id", attendanceId);

    if (error) {
      console.error("Error removing attendance:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in removeAttendance:", error);
    return false;
  }
}

/**
 * Check in via QR code
 */
export async function checkInViaQR(
  qrToken: string,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<SessionAttendance | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    
    // Find session by QR token
    const { data: session, error: sessionError } = await supabase
      .from("live_sessions")
      .select("*")
      .eq("qr_token", qrToken)
      .single();

    if (sessionError || !session) {
      console.error("Invalid QR token or session not found");
      return null;
    }

    // Check if QR is expired
    if (session.qr_expires_at && new Date(session.qr_expires_at) < new Date()) {
      console.error("QR token expired");
      return null;
    }

    // Check if already checked in
    const { data: existing } = await supabase
      .from("session_attendance")
      .select("*")
      .eq("session_id", session.id)
      .eq("user_id", userId)
      .single();

    if (existing) {
      console.error("Already checked in");
      return null;
    }

    // Create attendance record
    const { data, error } = await supabase
      .from("session_attendance")
      .insert({
        session_id: session.id,
        user_id: userId,
        class_id: session.class_id,
        method: "qr",
      })
      .select()
      .single();

    if (error) {
      console.error("Error checking in:", error);
      return null;
    }

    return {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      classId: data.class_id,
      checkinTime: new Date(data.checkin_time),
      method: data.method,
      checkedInBy: data.checked_in_by,
    };
  } catch (error) {
    console.error("Error in checkInViaQR:", error);
    return null;
  }
}

/**
 * Get assignment submissions
 */
export async function getAssignmentSubmissions(
  assignmentId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<AssignmentSubmission[]> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("assignment_id", assignmentId)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching submissions:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      assignmentId: item.assignment_id,
      userId: item.user_id,
      classId: item.class_id,
      submissionContent: item.submission_content,
      submissionUrl: item.submission_url,
      submissionFileUrl: item.submission_file_url,
      gitUrl: item.git_url,
      repoDirectory: item.repo_directory,
      status: item.status,
      isLate: item.is_late,
      feedback: item.feedback,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at ? new Date(item.reviewed_at) : undefined,
      submittedAt: new Date(item.submitted_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error) {
    console.error("Error in getAssignmentSubmissions:", error);
    return [];
  }
}

/**
 * Update submission status
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  feedback?: string,
  reviewedBy?: string,
  supabaseClient?: SupabaseClient<any>
): Promise<AssignmentSubmission | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const updateData: any = {
      status,
    };

    if (feedback !== undefined) updateData.feedback = feedback;
    if (reviewedBy) {
      updateData.reviewed_by = reviewedBy;
      updateData.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("assignment_submissions")
      .update(updateData)
      .eq("id", submissionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating submission:", error);
      return null;
    }

    return {
      id: data.id,
      assignmentId: data.assignment_id,
      userId: data.user_id,
      classId: data.class_id,
      submissionContent: data.submission_content,
      submissionUrl: data.submission_url,
      submissionFileUrl: data.submission_file_url,
      gitUrl: data.git_url,
      repoDirectory: data.repo_directory,
      status: data.status,
      isLate: data.is_late,
      feedback: data.feedback,
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      submittedAt: new Date(data.submitted_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error("Error in updateSubmissionStatus:", error);
    return null;
  }
}

/**
 * Update announcement
 */
export async function updateAnnouncement(
  id: string,
  updates: Partial<CreateAnnouncementInput>,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassAnnouncement | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.pinned !== undefined) updateData.pinned = updates.pinned;
    if (updates.moduleId !== undefined) updateData.module_id = updates.moduleId;

    const { data, error } = await supabase
      .from("class_announcements")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating announcement:", error);
      return null;
    }

    return {
      id: data.id,
      classId: data.class_id,
      moduleId: data.module_id,
      title: data.title,
      content: data.content,
      pinned: data.pinned,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error("Error in updateAnnouncement:", error);
    return null;
  }
}

/**
 * Delete announcement
 */
export async function deleteAnnouncement(
  id: string,
  supabaseClient?: SupabaseClient<any>
): Promise<boolean> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { error } = await supabase
      .from("class_announcements")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting announcement:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteAnnouncement:", error);
    return false;
  }
}

/**
 * Get XP config for a class
 */
export async function getClassXPConfig(
  classId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassXPConfig[]> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_xp_config")
      .select("*")
      .eq("class_id", classId);

    if (error) {
      console.error("Error fetching XP config:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      classId: item.class_id,
      actionType: item.action_type,
      xpAmount: item.xp_amount,
      enabled: item.enabled,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error) {
    console.error("Error in getClassXPConfig:", error);
    return [];
  }
}

/**
 * Update or create XP config
 */
export async function upsertXPConfig(
  classId: string,
  actionType: XPActionType,
  xpAmount: number,
  enabled: boolean,
  supabaseClient?: SupabaseClient<any>
): Promise<ClassXPConfig | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_xp_config")
      .upsert({
        class_id: classId,
        action_type: actionType,
        xp_amount: xpAmount,
        enabled,
      }, {
        onConflict: "class_id,action_type",
      })
      .select()
      .single();

    if (error) {
      console.error("Error upserting XP config:", error);
      return null;
    }

    return {
      id: data.id,
      classId: data.class_id,
      actionType: data.action_type,
      xpAmount: data.xp_amount,
      enabled: data.enabled,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error("Error in upsertXPConfig:", error);
    return null;
  }
}

/**
 * Update module learning materials
 */
export async function updateModuleLearningMaterials(
  moduleId: string,
  learningMaterials: LearningMaterial[],
  supabaseClient?: SupabaseClient<any>
): Promise<ClassModule | null> {
  try {
    const supabase = ensureSupabaseClient(supabaseClient);
    const { data, error } = await supabase
      .from("class_modules")
      .update({
        learning_materials: learningMaterials,
      })
      .eq("id", moduleId)
      .select()
      .single();

    if (error) {
      console.error("Error updating learning materials:", error);
      return null;
    }

    return normalizeModule(data);
  } catch (error) {
    console.error("Error in updateModuleLearningMaterials:", error);
    return null;
  }
}

