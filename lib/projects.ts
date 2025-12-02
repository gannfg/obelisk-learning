/**
 * Project utilities for fetching and managing projects from Supabase
 */

import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectMember } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY || '';

export interface ProjectWithMembers extends Project {
  members?: ProjectMember[];
  memberCount?: number;
}

/**
 * Get all projects
 */
export async function getAllProjects(supabaseClient?: any): Promise<ProjectWithMembers[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return [];
  }

  try {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_members (
          user_id,
          role,
          joined_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return (data || []).map((project: any) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      thumbnail: project.thumbnail || undefined,
      status: project.status,
      difficulty: project.difficulty,
      tags: project.tags || [],
      teamId: project.team_id || undefined,
      createdBy: project.created_by,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
      repositoryUrl: project.repository_url || undefined,
      liveUrl: project.live_url || undefined,
      members: project.project_members?.map((m: any) => ({
        userId: m.user_id,
        role: m.role,
        joinedAt: new Date(m.joined_at),
      })) || [],
      memberCount: project.project_members?.length || 0,
    }));
  } catch (error) {
    console.error('Error in getAllProjects:', error);
    return [];
  }
}

/**
 * Get project by ID
 */
export async function getProjectById(
  id: string,
  supabaseClient?: any
): Promise<ProjectWithMembers | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  try {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_members (
          user_id,
          role,
          joined_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail || undefined,
      status: data.status,
      difficulty: data.difficulty,
      tags: data.tags || [],
      teamId: data.team_id || undefined,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      repositoryUrl: data.repository_url || undefined,
      liveUrl: data.live_url || undefined,
      members: data.project_members?.map((m: any) => ({
        userId: m.user_id,
        role: m.role,
        joinedAt: new Date(m.joined_at),
      })) || [],
      memberCount: data.project_members?.length || 0,
    };
  } catch (error) {
    console.error('Error in getProjectById:', error);
    return null;
  }
}

/**
 * Create a new project
 */
export async function createProject(
  projectData: {
    title: string;
    description: string;
    status: Project['status'];
    difficulty: Project['difficulty'];
    tags: string[];
    teamId?: string;
    repositoryUrl?: string;
    liveUrl?: string;
  },
  userId: string,
  supabaseClient?: any
): Promise<Project | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  try {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: projectData.title,
        description: projectData.description,
        status: projectData.status,
        difficulty: projectData.difficulty,
        tags: projectData.tags,
        team_id: projectData.teamId || null,
        created_by: userId,
        repository_url: projectData.repositoryUrl || null,
        live_url: projectData.liveUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }

    // Add creator as owner
    if (data) {
      await supabase.from('project_members').insert({
        project_id: data.id,
        user_id: userId,
        role: 'owner',
        joined_at: new Date().toISOString(),
      });
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail || undefined,
      status: data.status,
      difficulty: data.difficulty,
      tags: data.tags || [],
      teamId: data.team_id || undefined,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      repositoryUrl: data.repository_url || undefined,
      liveUrl: data.live_url || undefined,
    };
  } catch (error) {
    console.error('Error in createProject:', error);
    return null;
  }
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    status: Project['status'];
    difficulty: Project['difficulty'];
    tags: string[];
    teamId: string;
    repositoryUrl: string;
    liveUrl: string;
  }>,
  supabaseClient?: any
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return false;
  }

  try {
    const supabase = supabaseClient || createClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.teamId !== undefined) updateData.team_id = updates.teamId || null;
    if (updates.repositoryUrl !== undefined) updateData.repository_url = updates.repositoryUrl || null;
    if (updates.liveUrl !== undefined) updateData.live_url = updates.liveUrl || null;

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateProject:', error);
    return false;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string, supabaseClient?: any): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return false;
  }

  try {
    const supabase = supabaseClient || createClient();

    // Delete project members first (cascade should handle this, but being explicit)
    await supabase.from('project_members').delete().eq('project_id', id);

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteProject:', error);
    return false;
  }
}

