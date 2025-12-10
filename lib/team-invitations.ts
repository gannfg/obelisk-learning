/**
 * Team invitation utilities
 */

import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/notifications";
import { addTeamMember } from "./teams";

export interface TeamInvitation {
  id: string;
  team_id: string;
  inviter_id: string;
  invitee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
}

/**
 * Search for users by email or username
 */
export async function searchUsers(
  query: string,
  supabaseClient?: any
): Promise<Array<{ id: string; email: string; username?: string; name?: string; avatar?: string }>> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const supabase = supabaseClient || createClient();

    const searchTerm = `%${query.trim()}%`;

    // Try searching in 'users' table first (as used in profile.ts)
    // If that doesn't work, fall back to 'profiles' table
    let data: any[] | null = null;

    // Try users table first
    // Using .or() with proper escaping - PostgREST format: column.operator."value"
    const escapedSearch = searchTerm.replace(/"/g, '\\"');
    const usersResult = await supabase
      .from("users")
      .select("id, email, username, first_name, last_name, image_url")
      .or(`email.ilike."${escapedSearch}",username.ilike."${escapedSearch}",first_name.ilike."${escapedSearch}",last_name.ilike."${escapedSearch}"`)
      .limit(10);
    
    if (usersResult.error) {
      // If users table fails, try profiles table
      const profilesResult = await supabase
        .from("profiles")
        .select("id, email, username, first_name, last_name, image_url")
        .or(`email.ilike."${escapedSearch}",username.ilike."${escapedSearch}",first_name.ilike."${escapedSearch}",last_name.ilike."${escapedSearch}"`)
        .limit(10);
      
      if (profilesResult.error) {
        console.error("Error searching users:", profilesResult.error);
        return [];
      }
      
      data = profilesResult.data;
    } else {
      data = usersResult.data;
    }

    if (!data) {
      return [];
    }

    return (data || []).map((profile: any) => ({
      id: profile.id,
      email: profile.email,
      username: profile.username || undefined,
      name:
        [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
        profile.username ||
        profile.email?.split("@")[0],
      avatar: profile.image_url || undefined,
    }));
  } catch (error) {
    console.error("Error in searchUsers:", error);
    return [];
  }
}

/**
 * Create a team invitation
 */
export async function createTeamInvitation(
  teamId: string,
  inviteeId: string,
  inviterId: string,
  supabaseClient?: any
): Promise<TeamInvitation | null> {
  try {
    const supabase = supabaseClient || createClient();

    // Check if invitation already exists
    const { data: existing } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("team_id", teamId)
      .eq("invitee_id", inviteeId)
      .eq("status", "pending")
      .single();

    if (existing) {
      console.error("Invitation already exists");
      return null;
    }

    // Check if user is already a member
    const { data: member } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .eq("user_id", inviteeId)
      .single();

    if (member) {
      console.error("User is already a team member");
      return null;
    }

    // Get team info
    const { data: team } = await supabase
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .single();

    // Get inviter info
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("username, first_name, last_name, email")
      .eq("id", inviterId)
      .single();

    const inviterName =
      [inviterProfile?.first_name, inviterProfile?.last_name].filter(Boolean).join(" ") ||
      inviterProfile?.username ||
      inviterProfile?.email?.split("@")[0] ||
      "Someone";

    // Create invitation
    const { data: invitation, error } = await supabase
      .from("team_invitations")
      .insert({
        team_id: teamId,
        inviter_id: inviterId,
        invitee_id: inviteeId,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invitation:", error);
      return null;
    }

    // Create notification using database function (bypasses RLS)
    try {
      const { data: notificationId, error: notifError } = await supabase.rpc(
        "create_team_invitation_notification",
        {
          invitee_user_id: inviteeId,
          team_id: teamId,
          inviter_user_id: inviterId,
          invitation_id: invitation.id,
          team_name: team?.name || "a team",
          inviter_name: inviterName,
        }
      );

      if (notifError) {
        console.warn("Failed to create notification via RPC, trying direct insert:", notifError);
        
        // Fallback to direct notification creation
        const notification = await createNotification(
          {
            userId: inviteeId,
            type: "team",
            title: "Team Invitation",
            message: `${inviterName} invited you to join ${team?.name || "a team"}`,
            link: `/notifications`,
            metadata: {
              invitation_id: invitation.id,
              team_id: teamId,
              inviter_id: inviterId,
              type: "team_invitation",
            },
          },
          supabase
        );

        if (!notification) {
          console.warn("Failed to create notification for invitation, but invitation was created successfully");
          // Don't fail the invitation creation if notification fails
        }
      }
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Don't fail the invitation creation if notification fails
    }

    return invitation as TeamInvitation;
  } catch (error) {
    console.error("Error in createTeamInvitation:", error);
    return null;
  }
}

/**
 * Accept a team invitation
 */
export async function acceptTeamInvitation(
  invitationId: string,
  userId: string,
  supabaseClient?: any
): Promise<boolean> {
  try {
    const supabase = supabaseClient || createClient();

    // Try using the database function first (bypasses RLS)
    const { data: success, error: rpcError } = await supabase.rpc(
      "accept_team_invitation",
      { invitation_id: invitationId }
    );

    if (!rpcError && success) {
      return true;
    }

    // If RPC function doesn't exist or failed, handle the error
    if (rpcError) {
      if (rpcError.code === '42883') {
        // Function does not exist - use fallback
        console.warn("RPC function accept_team_invitation does not exist. Using fallback method. Please run the SQL file: supabase/accept-team-invitation-function.sql");
      } else if (rpcError.code === '23505') {
        // Unique constraint violation - invitation might already be processed
        // Check if user is already a member
        const { data: invitation } = await supabase
          .from("team_invitations")
          .select("team_id")
          .eq("id", invitationId)
          .single();
        
        if (invitation) {
          const { data: member } = await supabase
            .from("team_members")
            .select("id")
            .eq("team_id", invitation.team_id)
            .eq("user_id", userId)
            .single();
          
          if (member) {
            // User is already a member, consider it successful
            return true;
          }
        }
        
        console.warn("RPC function error (unique constraint):", rpcError);
        // Fall through to fallback
      } else {
        console.warn("RPC function error:", {
          code: rpcError.code,
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
        });
      }
    }

    // Fallback to manual process
    // First check if invitation exists and its current status
    const { data: invitation, error: fetchError } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("invitee_id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching invitation:", fetchError);
      return false;
    }

    if (!invitation) {
      console.error("Invitation not found");
      return false;
    }

    // If invitation is already accepted, check if user is already a member
    if (invitation.status === "accepted") {
      const { data: member } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", invitation.team_id)
        .eq("user_id", userId)
        .single();
      
      if (member) {
        // Already accepted and member exists, return success
        return true;
      }
      // Accepted but member missing - try to add them
      const added = await addTeamMember(
        invitation.team_id,
        userId,
        "member",
        supabase
      );
      return added;
    }

    // If invitation is rejected, can't accept it
    if (invitation.status === "rejected") {
      console.error("Invitation was already rejected");
      return false;
    }

    // If still pending, process it
    if (invitation.status !== "pending") {
      console.error("Invitation has unexpected status:", invitation.status);
      return false;
    }

    // Before updating, delete any existing accepted invitations for this team/user
    // This handles the unique constraint on (team_id, invitee_id, status)
    await supabase
      .from("team_invitations")
      .delete()
      .eq("team_id", invitation.team_id)
      .eq("invitee_id", userId)
      .eq("status", "accepted")
      .neq("id", invitationId); // Don't delete the one we're trying to update

    // Also delete other pending invitations for this team/user
    // (Keep only the one being accepted)
    await supabase
      .from("team_invitations")
      .delete()
      .eq("team_id", invitation.team_id)
      .eq("invitee_id", userId)
      .eq("status", "pending")
      .neq("id", invitationId);

    // Update invitation status
    // Note: updated_at is handled by trigger, so we don't need to set it manually
    const { error: updateError, data: updateData } = await supabase
      .from("team_invitations")
      .update({
        status: "accepted",
      })
      .eq("id", invitationId)
      .eq("invitee_id", userId) // Ensure we can only update our own invitations
      .eq("status", "pending") // Only update if still pending
      .select(); // Return the updated row to verify

    if (updateError) {
      // Handle unique constraint violation
      if (updateError.code === '23505') {
        // Check if there's already an accepted invitation
        const { data: acceptedInvitation } = await supabase
          .from("team_invitations")
          .select("id, team_id")
          .eq("team_id", invitation.team_id)
          .eq("invitee_id", userId)
          .eq("status", "accepted")
          .single();
        
        if (acceptedInvitation) {
          // There's already an accepted invitation, check if user is member
          const { data: member } = await supabase
            .from("team_members")
            .select("id")
            .eq("team_id", invitation.team_id)
            .eq("user_id", userId)
            .single();
          
          if (member) {
            return true; // Already processed successfully
          }
          
          // User is not a member yet, try to add them using the existing accepted invitation
          const added = await addTeamMember(
            invitation.team_id,
            userId,
            "member",
            supabase
          );
          return added;
        }
      }
      
      console.error("Error updating invitation:", {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        userId: userId,
        invitationId: invitationId,
      });
      
      // If update failed, check if it was already accepted
      const { data: currentInvitation } = await supabase
        .from("team_invitations")
        .select("status")
        .eq("id", invitationId)
        .single();
      
      if (currentInvitation?.status === "accepted") {
        // Already accepted, check if user is member
        const { data: member } = await supabase
          .from("team_members")
          .select("id")
          .eq("team_id", invitation.team_id)
          .eq("user_id", userId)
          .single();
        
        if (member) {
          return true; // Already processed successfully
        }
      }
      
      return false;
    }

    // Check if user is already a member before trying to add
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", invitation.team_id)
      .eq("user_id", userId)
      .single();

    if (existingMember) {
      // User is already a member, invitation was likely already processed
      return true;
    }

    // Add user to team
    const added = await addTeamMember(
      invitation.team_id,
      userId,
      "member",
      supabase
    );

    if (!added) {
      console.error("Error adding user to team");
      return false;
    }

    return true;
  } catch (error: any) {
    console.error("Error in acceptTeamInvitation:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return false;
  }
}

/**
 * Reject a team invitation
 */
export async function rejectTeamInvitation(
  invitationId: string,
  userId: string,
  supabaseClient?: any
): Promise<boolean> {
  try {
    const supabase = supabaseClient || createClient();

    const { error } = await supabase
      .from("team_invitations")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId)
      .eq("invitee_id", userId)
      .eq("status", "pending");

    if (error) {
      console.error("Error rejecting invitation:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in rejectTeamInvitation:", error);
    return false;
  }
}

/**
 * Get pending invitations for a user
 */
export async function getUserTeamInvitations(
  userId: string,
  supabaseClient?: any
): Promise<TeamInvitation[]> {
  try {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("invitee_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitations:", error);
      return [];
    }

    return (data || []) as TeamInvitation[];
  } catch (error) {
    console.error("Error in getUserTeamInvitations:", error);
    return [];
  }
}

