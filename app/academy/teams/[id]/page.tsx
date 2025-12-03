"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, FolderKanban, UserPlus, Loader2, Trash2, Edit } from "lucide-react";
import { getTeamById, TeamWithDetails, deleteTeam, updateTeam } from "@/lib/teams";
import { getProjectById } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/profile";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAdmin } from "@/lib/hooks/use-admin";

export default function TeamPage() {
  const params = useParams();
  const id = params.id as string;
  const [team, setTeam] = useState<TeamWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [teamProjects, setTeamProjects] = useState<Array<{ id: string; title: string; status: string }>>([]);
  const supabase = createClient();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    const loadTeam = async () => {
      setLoading(true);
      try {
        const data = await getTeamById(id, supabase);
        if (!data) {
          setNotFound(true);
          return;
        }
        setTeam(data);
        setEditName(data.name);
        setEditDescription(data.description || "");

        // Fetch member names
        if (data.members && data.members.length > 0) {
          const names: Record<string, string> = {};
          for (const member of data.members) {
            const profile = await getUserProfile(member.userId, undefined, supabase);
            if (profile) {
              names[member.userId] = profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile.username || profile.email.split('@')[0] || 'User';
            }
          }
          setMemberNames(names);
        }

        // Fetch project details
        if (data.projects && data.projects.length > 0) {
          const projects = await Promise.all(
            data.projects.map(async (projectId) => {
              const project = await getProjectById(projectId, supabase);
              return project
                ? { id: project.id, title: project.title, status: project.status }
                : null;
            })
          );

          // Filter out any nulls in a type-safe way without confusing TS
          const validProjects: Array<{ id: string; title: string; status: string }> = [];
          for (const p of projects) {
            if (p) {
              validProjects.push(p);
            }
          }
          setTeamProjects(validProjects);
        }
      } catch (error) {
        console.error("Error loading team:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
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

  if (notFound || !team) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
          <p className="text-muted-foreground mb-4">The team you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/academy/teams">Back to Teams</Link>
          </Button>
        </div>
      </div>
    );
  }

  const canManageTeam =
    !!user &&
    (isAdmin ||
      team.createdBy === user.id ||
      team.members.some(
        (m) =>
          m.userId === user.id && (m.role === "owner" || m.role === "admin")
      ));

  const handleDeleteTeam = async () => {
    if (!canManageTeam) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this team? This cannot be undone."
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const ok = await deleteTeam(team.id, supabase);
      if (ok) {
        window.location.href = "/academy/teams";
      } else {
        setSaving(false);
      }
    } catch (e) {
      console.error("Error deleting team:", e);
      setSaving(false);
    }
  };

  const handleSaveTeam = async () => {
    if (!canManageTeam) return;
    setSaving(true);
    try {
      const ok = await updateTeam(
        team.id,
        {
          name: editName,
          description: editDescription,
        },
        supabase
      );
      if (ok) {
        setTeam({
          ...team,
          name: editName,
          description: editDescription || undefined,
        });
        setEditMode(false);
      }
    } catch (e) {
      console.error("Error updating team:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <Link
          href="/academy/teams"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block transition-colors"
        >
          ← Back to Teams
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="mb-3 text-3xl sm:text-4xl font-bold flex items-center gap-3">
              {editMode ? (
                <input
                  className="rounded-md border border-border bg-background px-2 py-1 text-lg font-semibold"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              ) : (
                team.name
              )}
            </h1>
            {editMode ? (
              <textarea
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            ) : (
              <p className="text-base sm:text-lg text-muted-foreground">
                {team.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Members
            </Button>
            {canManageTeam && (
              <>
                {editMode && (
                  <Button
                    size="sm"
                    onClick={handleSaveTeam}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode((v) => !v)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {editMode ? "Cancel" : "Edit Team"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  onClick={handleDeleteTeam}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {saving ? "Deleting..." : "Delete"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{team.memberCount || team.members.length} members</span>
          </div>
          <div className="flex items-center gap-1">
            <FolderKanban className="h-4 w-4" />
            <span>{team.projectCount || team.projects.length} projects</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Created {team.createdAt.toLocaleDateString()}</span>
          </div>
        </div>
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
            <div className="space-y-3">
              {team.members && team.members.length > 0 ? (
                team.members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{memberNames[member.userId] || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {member.joinedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
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
              <FolderKanban className="h-5 w-5" />
              Team Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-3">
              {canManageTeam && (
                <Button
                  asChild
                  size="sm"
                >
                  <Link href={`/academy/projects/new?teamId=${team.id}`}>
                    <FolderKanban className="h-4 w-4 mr-1" />
                    Create Project in Team
                  </Link>
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {teamProjects.length > 0 ? (
                teamProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/academy/projects/${project.id}`}
                    className="block p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{project.title}</p>
                      <Badge
                        variant={
                          project.status === "in-progress"
                            ? "default"
                            : project.status === "completed"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No projects yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

