import { createClient } from "@/lib/supabase/client";

export type ProjectComment = {
  id: string;
  project_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at?: string;
  author?: {
    id: string;
    name: string;
    avatar?: string | null;
    username?: string | null;
  };
};

/**
 * Fetch comments via API route (includes author info)
 */
export async function fetchProjectComments(projectId: string): Promise<ProjectComment[]> {
  const res = await fetch(`/api/comments/project?projectId=${projectId}`);
  if (!res.ok) return [];
  return (await res.json()) as ProjectComment[];
}

/**
 * Add a comment via API route
 */
export async function addProjectComment(projectId: string, body: string): Promise<ProjectComment | null> {
  const res = await fetch("/api/comments/project", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, body }),
  });
  if (!res.ok) return null;
  return (await res.json()) as ProjectComment;
}
