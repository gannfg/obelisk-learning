/**
 * Team utilities for fetching and managing teams from Supabase
 */

import { createClient } from "@/lib/supabase/client";
import type { Team, TeamMember } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY || '';

export interface TeamWithDetails extends Team {
  memberCount?: number;
  projectCount?: number;
}

/**
 * Get all teams
 */
export async function getAllTeams(supabaseClient?: any): Promise<TeamWithDetails[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return [];
  }

  try {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (
          user_id,
          role,
          joined_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teams:', error);
      return [];
    }

    // Get project counts for each team
    const teamsWithProjects = await Promise.all(
      (data || []).map(async (team: any) => {
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('team_id', team.id);
        
        return {
          id: team.id,
          name: team.name,
          description: team.description || undefined,
          avatar: team.avatar || undefined,
          createdBy: team.created_by,
          createdAt: new Date(team.created_at),
          members: team.team_members?.map((m: any) => ({
            userId: m.user_id,
            role: m.role,
            joinedAt: new Date(m.joined_at),
          })) || [],
          projects: projects?.map((p: any) => p.id) || [],
          memberCount: team.team_members?.length || 0,
          projectCount: projects?.length || 0,
        };
      })
    );

    return teamsWithProjects;
  } catch (error) {
    console.error('Error in getAllTeams:', error);
    return [];
  }
}

/**
 * Get team by ID
 */
export async function getTeamById(
  id: string,
  supabaseClient?: any
): Promise<TeamWithDetails | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  try {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (
          user_id,
          role,
          joined_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching team:', error);
      return null;
    }

    if (!data) return null;

    // Get projects for this team
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, status')
      .eq('team_id', id);

    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      avatar: data.avatar || undefined,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      members: data.team_members?.map((m: any) => ({
        userId: m.user_id,
        role: m.role,
        joinedAt: new Date(m.joined_at),
      })) || [],
      projects: projects?.map((p: any) => p.id) || [],
      memberCount: data.team_members?.length || 0,
      projectCount: projects?.length || 0,
    };
  } catch (error) {
    console.error('Error in getTeamById:', error);
    return null;
  }
}

/**
 * Create a new team
 */
export async function createTeam(
  teamData: {
    name: string;
    description?: string;
    avatar?: string;
  },
  userId: string,
  supabaseClient?: any
): Promise<Team | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  try {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: teamData.name,
        description: teamData.description || null,
        avatar: teamData.avatar || null,
        created_by: userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return null;
    }

    // Add creator as owner
    if (data) {
      await supabase.from('team_members').insert({
        team_id: data.id,
        user_id: userId,
        role: 'owner',
        joined_at: new Date().toISOString(),
      });
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      avatar: data.avatar || undefined,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      members: [],
      projects: [],
    };
  } catch (error) {
    console.error('Error in createTeam:', error);
    return null;
  }
}

/**
 * Update a team
 */
export async function updateTeam(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    avatar: string;
  }>,
  supabaseClient?: any
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return false;
  }

  try {
    const supabase = supabaseClient || createClient();

    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar || null;

    const { error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating team:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTeam:', error);
    return false;
  }
}

/**
 * Delete a team
 */
export async function deleteTeam(id: string, supabaseClient?: any): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return false;
  }

  try {
    const supabase = supabaseClient || createClient();

    // Delete team members first (cascade should handle this, but being explicit)
    await supabase.from('team_members').delete().eq('team_id', id);

    const { error } = await supabase.from('teams').delete().eq('id', id);

    if (error) {
      console.error('Error deleting team:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTeam:', error);
    return false;
  }
}

/**
 * Add member to team
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamMember['role'] = 'member',
  supabaseClient?: any
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return false;
  }

  try {
    const supabase = supabaseClient || createClient();

    const { error } = await supabase.from('team_members').insert({
      team_id: teamId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error adding team member:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addTeamMember:', error);
    return false;
  }
}

/**
 * Remove member from team
 */
export async function removeTeamMember(
  teamId: string,
  userId: string,
  supabaseClient?: any
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return false;
  }

  try {
    const supabase = supabaseClient || createClient();

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing team member:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeTeamMember:', error);
    return false;
  }
}

