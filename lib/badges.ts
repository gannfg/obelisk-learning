import { SupabaseClient } from "@supabase/supabase-js";

export interface Badge {
  id: string;
  user_id: string;
  course_id: string | null;
  badge_name: string;
  badge_type?: string;
  description?: string;
  earned_at: string;
  metadata?: {
    class_id?: string;
    class_title?: string;
    badge_image_url?: string;
    workshop_id?: string;
    mission_id?: string;
    [key: string]: any;
  };
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(
  supabaseClient: SupabaseClient<any>,
  userId: string
): Promise<Badge[]> {
  try {
    const { data, error } = await supabaseClient
      .from("badges")
      .select("*")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    if (error) {
      console.error("Error fetching badges:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching badges:", error);
    return [];
  }
}

