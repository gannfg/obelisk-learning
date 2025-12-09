"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamWithDetails } from "@/lib/teams";
import { getAllProjects, ProjectWithMembers } from "@/lib/projects";
import { getUserProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import { Users, FolderKanban, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

interface TeamModalProps {
  team: TeamWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamModal({ team, open, onOpenChange }: TeamModalProps) {
  const { user } = useAuth();
  const [teamProjects, setTeamProjects] = useState<ProjectWithMembers[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<
    Record<string, { name: string; avatar?: string }>
  >({});
  const [loadingAvatars, setLoadingAvatars] = useState(false);

  const isTeamMember = user && team?.members?.some(m => m.userId === user.id);

  useEffect(() => {
    if (!team || !open) return;

    // Fetch team projects
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const supabase = createClient();
        const projects = await getAllProjects(supabase);
        const teamProjects = projects.filter(p => p.teamId === team.id);
        setTeamProjects(teamProjects);
      } catch (error) {
        console.error("Error loading team projects:", error);
        setTeamProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    // Fetch member avatars and names (for all viewers, including guests)
    const loadAvatars = async () => {
      if (!team.members || team.members.length === 0) return;
      setLoadingAvatars(true);
      try {
        const authSupabase = createClient();
        const profiles: Record<string, { name: string; avatar?: string }> = {};
        
        await Promise.all(
          team.members.map(async (member) => {
            try {
              const profile = await getUserProfile(member.userId, undefined, authSupabase);
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
    };

    loadProjects();
    loadAvatars();
  }, [team, open]);

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {team.avatar ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={team.avatar}
                  alt={team.name}
                  width={48}
                  height={48}
                  className="object-cover rounded-full"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <DialogTitle>{team.name}</DialogTitle>
              {team.description && (
                <DialogDescription>{team.description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Team Stats */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{team.memberCount || 0} members</span>
            </div>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              <span>{team.projectCount || 0} projects</span>
            </div>
          </div>

          {/* Members Section */}
          {team.members && team.members.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Members</h3>
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
            <h3 className="text-lg font-semibold mb-3">Ongoing Projects</h3>
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
                          <CardTitle className="text-base">{project.title}</CardTitle>
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
              <Button variant="outline" className="w-full" asChild>
                <a href={`/academy/teams/${team.id}/invite`}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Members
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

