"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, FolderKanban, UserPlus, Loader2, Trash2, Edit } from "lucide-react";
import { getTeamById, TeamWithDetails, deleteTeam, updateTeam } from "@/lib/teams";
import { getAllProjects, ProjectWithMembers } from "@/lib/projects";
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
  const [memberProfiles, setMemberProfiles] = useState<
    Record<string, { name: string; avatar?: string }>
  >({});
  const [teamProjects, setTeamProjects] = useState<ProjectWithMembers[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const supabase = createClient();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const isTeamMember = user && team?.members?.some(m => m.userId === user.id);

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

        // Fetch team projects
        setLoadingProjects(true);
        try {
          const projects = await getAllProjects(supabase);
          const filteredProjects = projects.filter(p => p.teamId === data.id);
          setTeamProjects(filteredProjects);
        } catch (error) {
          console.error("Error loading team projects:", error);
          setTeamProjects([]);
        } finally {
          setLoadingProjects(false);
        }

        // Fetch member avatars and names
        if (data.members && data.members.length > 0) {
          setLoadingAvatars(true);
          try {
            const profiles: Record<string, { name: string; avatar?: string }> = {};
            
            await Promise.all(
              data.members.map(async (member) => {
                try {
                  const profile = await getUserProfile(member.userId, undefined, supabase);
                  const fullName = [profile?.first_name, profile?.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim();
                  const username =
                    profile?.username ||
                    (fullName.length > 0 ? fullName : undefined) ||
                    profile?.email?.split("@")[0];

                  profiles[member.userId] = {
                    name: username || `User ${member.userId.slice(0, 8)}`,
                    avatar:
                      profile?.image_url ||
                      profile?.email?.charAt(0).toUpperCase(),
                  };
                } catch (error) {
                  console.error(`Error loading avatar for ${member.userId}:`, error);
                }
              })
            );
            
            setMemberProfiles(profiles);
          } catch (error) {
            console.error("Error loading member avatars:", error);
          } finally {
            setLoadingAvatars(false);
          }
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (notFound || !team) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/academy/teams"
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block transition-colors"
        >
          ← Back to Teams
        </Link>

        {/* Header with avatar and team info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4 flex-1">
            {team.avatar ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={team.avatar}
                  alt={team.name}
                  width={64}
                  height={64}
                  className="object-cover rounded-full"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-8 w-8 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="mb-2 text-3xl sm:text-4xl font-bold">
                {editMode ? (
                  <input
                    className="rounded-md border border-border bg-background px-3 py-2 text-2xl font-bold w-full max-w-md"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                ) : (
                  team.name
                )}
              </h1>
              {editMode ? (
                <textarea
                  className="w-full rounded-md border border-border bg-background p-3 text-sm mt-2"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              ) : (
                team.description && (
                  <p className="text-base text-muted-foreground">{team.description}</p>
                )
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
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
                  {editMode ? "Cancel" : "Edit"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  onClick={handleDeleteTeam}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Team Stats */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{team.memberCount || team.members.length} members</span>
          </div>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            <span>{team.projectCount || teamProjects.length} projects</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Members Section */}
        {team.members && team.members.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Members</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {team.members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-background flex-shrink-0">
                    {memberProfiles[member.userId]?.avatar ? (
                      typeof memberProfiles[member.userId]?.avatar === "string" &&
                      memberProfiles[member.userId]!.avatar!.startsWith("http") ? (
                        <Image
                          src={memberProfiles[member.userId]!.avatar as string}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {memberProfiles[member.userId]?.avatar}
                        </div>
                      )
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {memberProfiles[member.userId]?.name || `User ${member.userId.slice(0, 8)}`}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {member.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ongoing Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Ongoing Projects</h3>
            {canManageTeam && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/academy/projects/new?teamId=${team.id}`}>
                  <FolderKanban className="h-4 w-4 mr-2" />
                  Create Project
                </Link>
              </Button>
            )}
          </div>
          {loadingProjects ? (
            <div className="text-sm text-muted-foreground">Loading projects...</div>
          ) : teamProjects.length > 0 ? (
            <div className="space-y-3">
              {teamProjects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      {project.thumbnail ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                          <Image
                            src={project.thumbnail}
                            alt={project.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 border border-border">
                          <FolderKanban className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">
                          <Link
                            href={`/academy/projects/${project.id}`}
                            className="hover:underline"
                          >
                            {project.title}
                          </Link>
                        </CardTitle>
                        {project.description && (
                          <CardDescription className="line-clamp-2 mt-1">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        project.status === "in-progress"
                          ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                          : project.status === "completed"
                          ? "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                          : "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
                      }`}>
                        {project.status}
                      </span>
                      {project.memberCount !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{project.memberCount} members</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-4">
              No ongoing projects for this team.
            </div>
          )}
        </div>

        {/* Invite Members Button (only for team members) */}
        {isTeamMember && (
          <div className="pt-4 border-t border-border">
            <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors" asChild>
              <Link href={`/academy/teams/${team.id}/invite`}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

