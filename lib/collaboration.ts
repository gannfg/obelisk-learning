import { createClient } from "@/lib/supabase/client";

/**
 * Collaboration status for a user
 */
export type CollaborationStatus = {
  userId: string;
  lookingForCollaborators: boolean;
  collaborationInterests: string[];
  availabilityStatus: "available" | "busy" | "away";
  updatedAt: string;
};

/**
 * Get collaboration status for a user
 */
export async function getCollaborationStatus(
  userId: string,
  supabaseClient?: any
): Promise<CollaborationStatus | null> {
  const supabase = supabaseClient || createClient();
  
  if (!supabase) {
    console.error("Supabase client not available");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("user_collaboration_status")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No row found, return default
        return {
          userId,
          lookingForCollaborators: false,
          collaborationInterests: [],
          availabilityStatus: "available",
          updatedAt: new Date().toISOString(),
        };
      }
      console.error("Error fetching collaboration status:", error);
      return null;
    }

    return {
      userId: data.user_id,
      lookingForCollaborators: data.looking_for_collaborators || false,
      collaborationInterests: data.collaboration_interests || [],
      availabilityStatus: data.availability_status || "available",
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Error in getCollaborationStatus:", error);
    return null;
  }
}

/**
 * Update collaboration status for the current user
 */
export async function updateCollaborationStatus(
  updates: {
    lookingForCollaborators?: boolean;
    collaborationInterests?: string[];
    availabilityStatus?: "available" | "busy" | "away";
  },
  supabaseClient?: any
): Promise<boolean> {
  const supabase = supabaseClient || createClient();
  
  if (!supabase) {
    console.error("Supabase client not available");
    return false;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated");
      return false;
    }

    // Prepare update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.lookingForCollaborators !== undefined) {
      updateData.looking_for_collaborators = updates.lookingForCollaborators;
    }
    if (updates.collaborationInterests !== undefined) {
      updateData.collaboration_interests = updates.collaborationInterests;
    }
    if (updates.availabilityStatus !== undefined) {
      updateData.availability_status = updates.availabilityStatus;
    }

    // Use upsert to create if doesn't exist, update if it does
    const { error } = await supabase
      .from("user_collaboration_status")
      .upsert(
        {
          user_id: user.id,
          ...updateData,
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      console.error("Error updating collaboration status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateCollaborationStatus:", error);
    return false;
  }
}

/**
 * Get all users looking for collaborators
 */
export async function getUsersLookingForCollaborators(
  supabaseClient?: any
): Promise<string[]> {
  const supabase = supabaseClient || createClient();
  
  if (!supabase) {
    console.error("Supabase client not available");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("user_collaboration_status")
      .select("user_id")
      .eq("looking_for_collaborators", true);

    if (error) {
      console.error("Error fetching users looking for collaborators:", error);
      return [];
    }

    return (data || []).map((row: any) => row.user_id);
  } catch (error) {
    console.error("Error in getUsersLookingForCollaborators:", error);
    return [];
  }
}

