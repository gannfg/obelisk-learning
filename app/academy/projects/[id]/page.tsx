"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Code, ExternalLink, Github, Loader2 } from "lucide-react";
import { getProjectById, ProjectWithMembers } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/profile";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAdmin } from "@/lib/hooks/use-admin";
import { deleteProject, updateProject } from "@/lib/projects";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [project, setProject] = useState<ProjectWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<
    Record<string, { name: string; avatarUrl?: string | null }>
  >({});
  const supabase = createClient();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editProgressLog, setEditProgressLog] = useState("");

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      try {
        const data = await getProjectById(id, supabase);
        if (!data) {
          setNotFound(true);
          return;
        }
        setProject(data);
        setEditDescription(data.description);
        setEditProgressLog(data.progressLog || "");

        // Fetch member profiles (name + avatar)
        if (data.members && data.members.length > 0) {
          const profiles: Record<string, { name: string; avatarUrl?: string | null }> = {};

          for (const member of data.members) {
            const profile = await getUserProfile(member.userId, undefined, supabase);
            if (profile) {
              const name =
                (profile.first_name && profile.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile.username || profile.email.split("@")[0]) || "User";
              profiles[member.userId] = {
                name,
                avatarUrl: profile.image_url || null,
              };
            }
          }

          setMemberProfiles(profiles);
        }
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/academy/projects">Back to Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  const canManage =
    !!user && (isAdmin || project.createdBy === user.id);

  const handleDelete = async () => {
    if (!canManage) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This cannot be undone."
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const ok = await deleteProject(project.id, supabase);
      if (ok) {
        router.push("/academy/projects");
      } else {
        setSaving(false);
      }
    } catch (e) {
      console.error("Error deleting project:", e);
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!canManage) return;
    setSaving(true);
    try {
      const ok = await updateProject(
        project.id,
        {
          description: editDescription,
          progressLog: editProgressLog,
        },
        supabase
      );
      if (ok) {
        setProject({
          ...project,
          description: editDescription,
          progressLog: editProgressLog,
        });
        setEditMode(false);
      }
    } catch (e) {
      console.error("Error updating project:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <Link
          href="/academy/projects"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block transition-colors"
        >
          ← Back to Projects
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="mb-3 text-3xl sm:text-4xl font-bold">{project.title}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{project.description}</p>
          </div>
          <Badge
            className={
              project.status === "in-progress"
                ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30"
                : project.status === "completed"
                ? "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300 border border-green-500/20 dark:border-green-500/30"
                : "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border border-yellow-500/20 dark:border-yellow-500/30"
            }
          >
            {project.status}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          {project.repositoryUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                Repository
              </a>
            </Button>
          )}
          {project.liveUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Live Demo
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mb-4">
        {canManage && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? "Cancel" : "Edit Project"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete Project"}
            </Button>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {project.members && project.members.length > 0 ? (
                project.members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {memberProfiles[member.userId]?.avatarUrl ? (
                        <div className="relative h-8 w-8 rounded-full overflow-hidden">
                          <Image
                            src={memberProfiles[member.userId].avatarUrl as string}
                            alt={memberProfiles[member.userId].name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {memberProfiles[member.userId]?.name
                            ?.charAt(0)
                            .toUpperCase() || "U"}
                        </div>
                      )}
                      <span className="text-sm">
                        {memberProfiles[member.userId]?.name || "Unknown User"}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {member.role}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No members yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Difficulty</p>
              <p className="font-medium capitalize">{project.difficulty}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Created</p>
              <p className="font-medium">{project.createdAt.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              {editMode ? (
                <textarea
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              ) : (
                <p className="text-sm">{project.description}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Progress Log</p>
              {editMode ? (
                <textarea
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                  rows={4}
                  value={editProgressLog}
                  onChange={(e) => setEditProgressLog(e.target.value)}
                  placeholder="Add notes, milestones, or progress updates..."
                />
              ) : project.progressLog ? (
                <p className="whitespace-pre-wrap text-sm">
                  {project.progressLog}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No progress log yet.
                </p>
              )}
            </div>
            {editMode && (
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

