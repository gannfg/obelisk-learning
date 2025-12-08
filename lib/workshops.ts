/**
 * Workshop Calendar & Attendance System - Data Access Layer
 */

import { createLearningClient } from "@/lib/supabase/learning-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Workshop,
  WorkshopRegistration,
  WorkshopAttendance,
  ProofOfAttendance,
  CreateWorkshopInput,
  UpdateWorkshopInput,
  WorkshopStats,
  TeamAttendanceKPIs,
} from "@/types/workshops";

/**
 * Normalize workshop data from Supabase
 */
function normalizeWorkshop(data: any): Workshop {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    datetime: new Date(data.datetime),
    locationType: data.location_type,
    venueName: data.venue_name,
    meetingLink: data.meeting_link,
    hostName: data.host_name,
    capacity: data.capacity,
    imageUrl: data.image_url,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    qrToken: data.qr_token,
    qrExpiresAt: data.qr_expires_at ? new Date(data.qr_expires_at) : null,
  };
}

/**
 * Get all workshops (upcoming and past)
 */
export async function getAllWorkshops(
  options?: {
    upcomingOnly?: boolean;
    limit?: number;
  },
  supabaseClient?: SupabaseClient<any>
): Promise<Workshop[]> {
  try {
    const supabase = supabaseClient || createLearningClient();
    let query = supabase
      .from("workshops")
      .select("*")
      .order("datetime", { ascending: true });

    if (options?.upcomingOnly === true) {
      query = query.gte("datetime", new Date().toISOString());
    } else if (options?.upcomingOnly === false) {
      query = query.lt("datetime", new Date().toISOString());
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching workshops:", error);
      return [];
    }

    return (data || []).map(normalizeWorkshop);
  } catch (error) {
    console.error("Error in getAllWorkshops:", error);
    return [];
  }
}

/**
 * Get workshop by ID
 */
export async function getWorkshopById(
  id: string,
  supabaseClient?: SupabaseClient<any>
): Promise<Workshop | null> {
  try {
    const supabase = supabaseClient || createLearningClient();
    const { data, error } = await supabase
      .from("workshops")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching workshop:", error);
      return null;
    }

    return data ? normalizeWorkshop(data) : null;
  } catch (error) {
    console.error("Error in getWorkshopById:", error);
    return null;
  }
}

/**
 * Create a new workshop
 */
export async function createWorkshop(
  input: CreateWorkshopInput,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<Workshop | null> {
  try {
    const supabase = supabaseClient || createLearningClient();
    const { data, error } = await supabase
      .from("workshops")
      .insert({
        title: input.title,
        description: input.description || null,
        datetime: input.datetime,
        location_type: input.locationType,
        venue_name: input.venueName || null,
        meeting_link: input.meetingLink || null,
        host_name: input.hostName,
        capacity: input.capacity || null,
        image_url: input.imageUrl || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating workshop:", error);
      return null;
    }

    return data ? normalizeWorkshop(data) : null;
  } catch (error) {
    console.error("Error in createWorkshop:", error);
    return null;
  }
}

/**
 * Update a workshop
 */
export async function updateWorkshop(
  input: UpdateWorkshopInput,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<Workshop | null> {
  try {
    const supabase = supabaseClient || createLearningClient();
    const updates: any = {};

    if (input.title) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.datetime) updates.datetime = input.datetime;
    if (input.locationType) updates.location_type = input.locationType;
    if (input.venueName !== undefined) updates.venue_name = input.venueName;
    if (input.meetingLink !== undefined) updates.meeting_link = input.meetingLink;
    if (input.hostName) updates.host_name = input.hostName;
    if (input.capacity !== undefined) updates.capacity = input.capacity;
    if (input.imageUrl !== undefined) updates.image_url = input.imageUrl;

    const { data, error } = await supabase
      .from("workshops")
      .update(updates)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating workshop:", error);
      return null;
    }

    return data ? normalizeWorkshop(data) : null;
  } catch (error) {
    console.error("Error in updateWorkshop:", error);
    return null;
  }
}

/**
 * Delete a workshop
 */
export async function deleteWorkshop(
  id: string,
  supabaseClient?: SupabaseClient<any>
): Promise<boolean> {
  try {
    const supabase = supabaseClient || createLearningClient();
    const { error } = await supabase.from("workshops").delete().eq("id", id);

    if (error) {
      console.error("Error deleting workshop:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteWorkshop:", error);
    return false;
  }
}

/**
 * Register user for a workshop
 */
export async function registerForWorkshop(
  workshopId: string,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<WorkshopRegistration | null> {
  try {
    const supabase = supabaseClient || createLearningClient();

    // Check capacity using helper function
    const { data: canRegister } = await supabase.rpc("can_register_for_workshop", {
      p_workshop_id: workshopId,
      p_user_id: userId,
    });

    if (!canRegister) {
      throw new Error("Cannot register: already registered or capacity full");
    }

    const { data, error } = await supabase
      .from("workshop_registrations")
      .insert({
        workshop_id: workshopId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error registering for workshop:", error);
      return null;
    }

    return {
      id: data.id,
      workshopId: data.workshop_id,
      userId: data.user_id,
      registeredAt: new Date(data.registered_at),
    };
  } catch (error) {
    console.error("Error in registerForWorkshop:", error);
    return null;
  }
}

/**
 * Check if user is registered for a workshop
 */
export async function isUserRegistered(
  workshopId: string,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<boolean> {
  try {
    const supabase = supabaseClient || createLearningClient();
    const { data, error } = await supabase
      .from("workshop_registrations")
      .select("id")
      .eq("workshop_id", workshopId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error checking registration:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error in isUserRegistered:", error);
    return false;
  }
}

/**
 * Check in user for workshop (QR code)
 */
export async function checkInWithQR(
  workshopId: string,
  qrToken: string,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<WorkshopAttendance | null> {
  try {
    const supabase = supabaseClient || createLearningClient();

    // Verify QR token matches workshop and hasn't expired
    const { data: workshop, error: workshopError } = await supabase
      .from("workshops")
      .select("id, qr_token, qr_expires_at, datetime")
      .eq("id", workshopId)
      .eq("qr_token", qrToken)
      .single();

    if (workshopError || !workshop) {
      throw new Error("Invalid QR code");
    }

    // Check if QR expired
    if (workshop.qr_expires_at && new Date(workshop.qr_expires_at) < new Date()) {
      throw new Error("QR code has expired");
    }

    // Check if already attended
    const { data: existing } = await supabase
      .from("workshop_attendance")
      .select("id")
      .eq("workshop_id", workshopId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      throw new Error("Already checked in");
    }

    const { data, error } = await supabase
      .from("workshop_attendance")
      .insert({
        workshop_id: workshopId,
        user_id: userId,
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
      workshopId: data.workshop_id,
      userId: data.user_id,
      checkinTime: new Date(data.checkin_time),
      method: data.method,
      checkedInBy: data.checked_in_by,
    };
  } catch (error: any) {
    console.error("Error in checkInWithQR:", error);
    throw error;
  }
}

/**
 * Manual check-in (admin only)
 */
export async function manualCheckIn(
  workshopId: string,
  userId: string,
  adminId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<WorkshopAttendance | null> {
  try {
    const supabase = supabaseClient || createLearningClient();

    // Check if already attended
    const { data: existing } = await supabase
      .from("workshop_attendance")
      .select("id")
      .eq("workshop_id", workshopId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      throw new Error("User already checked in");
    }

    const { data, error } = await supabase
      .from("workshop_attendance")
      .insert({
        workshop_id: workshopId,
        user_id: userId,
        method: "manual",
        checked_in_by: adminId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error with manual check-in:", error);
      return null;
    }

    return {
      id: data.id,
      workshopId: data.workshop_id,
      userId: data.user_id,
      checkinTime: new Date(data.checkin_time),
      method: data.method,
      checkedInBy: data.checked_in_by,
    };
  } catch (error: any) {
    console.error("Error in manualCheckIn:", error);
    throw error;
  }
}

/**
 * Check if user has attended a workshop
 */
export async function hasUserAttended(
  workshopId: string,
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<boolean> {
  try {
    const supabase = supabaseClient || createLearningClient();
    const { data, error } = await supabase
      .from("workshop_attendance")
      .select("id")
      .eq("workshop_id", workshopId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking attendance:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error in hasUserAttended:", error);
    return false;
  }
}

/**
 * Get workshop statistics
 */
export async function getWorkshopStats(
  workshopId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<WorkshopStats | null> {
  try {
    const supabase = supabaseClient || createLearningClient();
    const { data, error } = await supabase.rpc("get_workshop_stats", {
      p_workshop_id: workshopId,
    });

    if (error) {
      console.error("Error fetching workshop stats:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        totalRegistrations: 0,
        totalAttendance: 0,
        onlineAttendance: 0,
        offlineAttendance: 0,
      };
    }

    const stats = data[0];
    return {
      totalRegistrations: stats.total_registrations || 0,
      totalAttendance: stats.total_attendance || 0,
      onlineAttendance: stats.online_attendance || 0,
      offlineAttendance: stats.offline_attendance || 0,
    };
  } catch (error) {
    console.error("Error in getWorkshopStats:", error);
    return null;
  }
}

/**
 * Get attendance list for a workshop
 */
export async function getWorkshopAttendance(
  workshopId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<WorkshopAttendance[]> {
  try {
    const supabase = supabaseClient || createLearningClient();
    const { data, error } = await supabase
      .from("workshop_attendance")
      .select("*")
      .eq("workshop_id", workshopId)
      .order("checkin_time", { ascending: false });

    if (error) {
      console.error("Error fetching attendance:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      workshopId: item.workshop_id,
      userId: item.user_id,
      checkinTime: new Date(item.checkin_time),
      method: item.method,
      checkedInBy: item.checked_in_by,
    }));
  } catch (error) {
    console.error("Error in getWorkshopAttendance:", error);
    return [];
  }
}

/**
 * Get user's proof of attendance records
 */
export async function getUserPOA(userId: string): Promise<ProofOfAttendance[]> {
  try {
    const supabase = createLearningClient();
    const { data, error } = await supabase
      .from("proof_of_attendance")
      .select("*, workshops(title, datetime, location_type)")
      .eq("user_id", userId)
      .order("issued_at", { ascending: false });

    if (error) {
      console.error("Error fetching POA:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      workshopId: item.workshop_id,
      userId: item.user_id,
      attendanceId: item.attendance_id,
      issuedAt: new Date(item.issued_at),
      metadata: item.metadata || {},
    }));
  } catch (error) {
    console.error("Error in getUserPOA:", error);
    return [];
  }
}

/**
 * Get team attendance KPIs
 */
export async function getTeamAttendanceKPIs(
  teamId: string
): Promise<TeamAttendanceKPIs | null> {
  try {
    const supabase = createLearningClient();
    const { data, error } = await supabase.rpc("get_team_attendance_kpis", {
      p_team_id: teamId,
    });

    if (error) {
      console.error("Error fetching team KPIs:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        totalWorkshopsAttended: 0,
        onlineAttendanceCount: 0,
        offlineAttendanceCount: 0,
        attendanceConsistencyScore: 0,
      };
    }

    const kpis = data[0];
    return {
      totalWorkshopsAttended: kpis.total_workshops_attended || 0,
      onlineAttendanceCount: kpis.online_attendance_count || 0,
      offlineAttendanceCount: kpis.offline_attendance_count || 0,
      attendanceConsistencyScore: kpis.attendance_consistency_score || 0,
    };
  } catch (error) {
    console.error("Error in getTeamAttendanceKPIs:", error);
    return null;
  }
}

/**
 * Get all workshops a user is registered for
 */
export async function getUserRegisteredWorkshops(
  userId: string,
  supabaseClient?: SupabaseClient<any>
): Promise<Workshop[]> {
  try {
    const supabase = supabaseClient || createLearningClient();
    
    // Get all registrations for the user
    const { data: registrations, error: regError } = await supabase
      .from("workshop_registrations")
      .select("workshop_id")
      .eq("user_id", userId);

    if (regError) {
      console.error("Error fetching registrations:", regError);
      return [];
    }

    if (!registrations || registrations.length === 0) {
      return [];
    }

    // Get workshop IDs
    const workshopIds = registrations.map((r) => r.workshop_id);

    // Fetch workshops
    const { data: workshops, error: workshopsError } = await supabase
      .from("workshops")
      .select("*")
      .in("id", workshopIds)
      .order("datetime", { ascending: true });

    if (workshopsError) {
      console.error("Error fetching workshops:", workshopsError);
      return [];
    }

    return (workshops || []).map(normalizeWorkshop);
  } catch (error) {
    console.error("Error in getUserRegisteredWorkshops:", error);
    return [];
  }
}

