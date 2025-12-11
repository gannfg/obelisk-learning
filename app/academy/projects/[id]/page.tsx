"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  ExternalLink, 
  Github, 
  Loader2, 
  Lock, 
  Share2, 
  Link as LinkIcon,
  MessageSquare,
  FolderKanban,
  User
} from "lucide-react";
import { getProjectById, ProjectWithMembers } from "@/lib/projects";
import { getTeamById, TeamWithDetails } from "@/lib/teams";
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
  const [team, setTeam] = useState<TeamWithDetails | null>(null);
  const [teamMemberProfiles, setTeamMemberProfiles] = useState<
    Array<{ userId: string; name: string; avatar?: string }>
  >([]);
  const [projectMemberProfiles, setProjectMemberProfiles] = useState<
    Array<{ userId: string; name: string; avatar?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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

        // Fetch project member profiles for avatars
        // For individual projects, load all members; for team projects, just first 3 for header
        if (data.members && data.members.length > 0) {
          const membersToLoad = data.teamId ? data.members.slice(0, 3) : data.members;
          const profiles = await Promise.all(
            membersToLoad.map(async (member) => {
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

                return {
                  userId: member.userId,
                  name: username || `User ${member.userId.slice(0, 8)}`,
                  avatar: profile?.image_url || undefined,
                };
              } catch (error) {
                console.error(`Error loading profile for ${member.userId}:`, error);
                return {
                  userId: member.userId,
                  name: `User ${member.userId.slice(0, 8)}`,
                  avatar: undefined,
                };
              }
            })
          );
          setProjectMemberProfiles(profiles);
        }

        // Fetch team information if teamId exists
        if (data.teamId) {
          const teamData = await getTeamById(data.teamId, supabase);
          if (teamData) {
            setTeam(teamData);
            
            // Fetch team member profiles for avatars
            if (teamData.members && teamData.members.length > 0) {
              const profiles = await Promise.all(
                teamData.members.slice(0, 5).map(async (member) => {
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

                    return {
                      userId: member.userId,
                      name: username || `User ${member.userId.slice(0, 8)}`,
                      avatar: profile?.image_url || undefined,
                    };
                  } catch (error) {
                    console.error(`Error loading profile for ${member.userId}:`, error);
                    return {
                      userId: member.userId,
                      name: `User ${member.userId.slice(0, 8)}`,
                      avatar: undefined,
                    };
                  }
                })
              );
              setTeamMemberProfiles(profiles);
            }
          }
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.title,
          text: project.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header Section */}
        <div className="mb-8">
          <Link
            href="/academy/projects"
            className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block transition-colors"
          >
            ← Back to Projects
          </Link>

          {/* Project Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            {project.thumbnail ? (
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-lg overflow-hidden flex-shrink-0 border-2 border-border">
                <Image
                  src={project.thumbnail}
                  alt={project.title}
                  fill
                  className="object-cover"
                  sizes="128px"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                <FolderKanban className="h-14 w-14 sm:h-16 sm:w-16 text-white" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
                    {project.title}
                  </h1>
                  {/* Category Badge - moved below title */}
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground capitalize">
                      {project.difficulty}
                    </span>
                  </div>
                  {/* Tags/Categories */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="px-3 py-1 text-xs font-medium"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {/* Share Button - aligned with title */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex-shrink-0"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Description Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Description</h2>
          {editMode ? (
            <textarea
              className="w-full rounded-md border border-border bg-background p-4 text-sm min-h-[120px]"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          ) : (
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
              {project.liveUrl && (
                <p className="mt-4">
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Try it out: {project.liveUrl}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Team Details Section (only for team projects) */}
        {team && project.teamId && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Details
            </h2>
            <Link href={`/academy/teams/${team.id}`}>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {team.avatar ? (
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={team.avatar}
                          alt={team.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{team.name}</h3>
                      {team.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {team.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        {/* Overlapping avatars */}
                        {teamMemberProfiles.length > 0 && (
                          <div className="flex items-center -space-x-2">
                            {teamMemberProfiles.slice(0, 3).map((member, idx) => (
                              <div
                                key={member.userId}
                                className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-background flex-shrink-0"
                                style={{ zIndex: 10 - idx }}
                              >
                                {member.avatar ? (
                                  <Image
                                    src={member.avatar}
                                    alt={member.name}
                                    fill
                                    className="object-cover"
                                    sizes="32px"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="h-full w-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                    {member.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Project count */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FolderKanban className="h-4 w-4" />
                          <span>{team.projectCount || 0} projects</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Member Details Section (only for individual projects) */}
        {!project.teamId && project.members && project.members.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Member Details
            </h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {projectMemberProfiles.length > 0 ? (
                    projectMemberProfiles.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/30"
                      >
                        {member.avatar ? (
                          <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={member.avatar}
                              alt={member.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-semibold text-primary">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{member.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {project.members?.find((m) => m.userId === member.userId)?.role === "owner"
                              ? "Project Owner"
                              : "Project Member"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Loading member details...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Links Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Links
          </h2>
          <div className="space-y-3">
            {project.repositoryUrl && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Github className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Repository</p>
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {project.repositoryUrl}
                      </a>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )}
            {project.liveUrl && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Live Demo</p>
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {project.liveUrl}
                      </a>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )}
            {!project.repositoryUrl && !project.liveUrl && (
              <p className="text-muted-foreground">No links available.</p>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Add Comment</p>
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2 mb-4 border-b border-border pb-2">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <span className="font-bold">B</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <span className="italic">I</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <span className="underline">U</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <span>•</span>
                </Button>
              </div>
              <textarea
                className="w-full bg-transparent border-0 resize-none focus:outline-none min-h-[150px] text-sm"
                placeholder="Write your comment here..."
              />
              <div className="flex justify-end pt-4 border-t border-border">
                <Button size="sm">Comment</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Mode Save Button */}
        {editMode && (
          <div className="flex justify-end gap-3 mb-8">
            <Button variant="outline" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {/* Admin/Delete Actions */}
        {canManage && !editMode && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete Project"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

