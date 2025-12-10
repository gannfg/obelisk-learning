"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseCard } from "@/components/course-card";
import { CategoryFilter } from "@/components/category-filter";
import { CourseCategory, Course } from "@/types";
import { BookOpen, FolderKanban, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllProjects, ProjectWithMembers } from "@/lib/projects";
import { getAllTeams, TeamWithDetails } from "@/lib/teams";
import { getAllClasses } from "@/lib/classes";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { useAdmin } from "@/lib/hooks/use-admin";
import { Loader2 } from "lucide-react";
import { Class } from "@/types";
import { ClassCard } from "@/components/class-card";
import { TeamModal } from "@/components/team-modal";
import { getUserProfile } from "@/lib/profile";

export function AcademyPageClient() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") as
    | CourseCategory
    | undefined;
  const initialTab = (searchParams.get("tab") as "classes" | "projects" | "teams") || "classes";

  const [currentTab, setCurrentTab] = useState<"classes" | "projects" | "teams">(initialTab);
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithDetails | null>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  
  // Create clients safely - they may be placeholders if env vars are missing
  const supabase = createClient();
  const learningSupabase = createLearningClient();
  const { isAdmin } = useAdmin();

  const filteredClasses = selectedCategory
    ? classes.filter((classItem) => classItem.category === selectedCategory)
    : classes;

  useEffect(() => {
    if (currentTab === "classes") {
      if (!learningSupabase) {
        setClasses([]);
        setLoadingCourses(false);
        return;
      }
      setLoadingCourses(true);
      // Non-admin users should only see published classes
      getAllClasses({ publishedOnly: !isAdmin }, learningSupabase)
        .then(setClasses)
        .catch((error) => {
          console.error("Error loading classes:", error);
          setClasses([]);
        })
        .finally(() => setLoadingCourses(false));
    } else if (currentTab === "projects") {
      if (!supabase) {
        setProjects([]);
        setLoadingProjects(false);
        return;
      }
      setLoadingProjects(true);
      getAllProjects(supabase)
        .then(async (projectsData) => {
          // Fetch member avatars & names for projects
          try {
            const authSupabase = createClient();
            const projectsWithProfiles = await Promise.all(
              projectsData.map(async (project) => {
                if (!project.members || project.members.length === 0) {
                  return { ...project, memberProfiles: {} };
                }

                const profiles: Record<string, { name: string; avatar?: string }> = {};
                await Promise.all(
                  project.members.map(async (member) => {
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
                        avatar: profile?.image_url || profile?.email?.charAt(0).toUpperCase(),
                      };
                    } catch (error) {
                      console.error(`Error loading avatar for ${member.userId}:`, error);
                    }
                  })
                );

                return { ...project, memberProfiles: profiles };
              })
            );
            setProjects(projectsWithProfiles);
          } catch (error) {
            console.error("Error loading member avatars:", error);
            setProjects(projectsData);
          }
        })
        .catch((error) => {
          console.error("Error loading projects:", error);
          setProjects([]);
        })
        .finally(() => setLoadingProjects(false));
    } else if (currentTab === "teams") {
      if (!supabase) {
        setTeams([]);
        setLoadingTeams(false);
        return;
      }
      setLoadingTeams(true);
      getAllTeams(supabase)
        .then(setTeams)
        .catch((error) => {
          console.error("Error loading teams:", error);
          setTeams([]);
        })
        .finally(() => setLoadingTeams(false));
    }
  }, [currentTab, supabase, learningSupabase, isAdmin]);

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Academy Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Academy
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Your comprehensive learning space for Web3 development. Enroll in
          courses, collaborate on projects, and join teams.
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={currentTab} onValueChange={(val) => setCurrentTab(val as "classes" | "projects" | "teams")} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Classes</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            <span className="hidden sm:inline">Projects</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Teams</span>
          </TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          <CategoryFilter />
          {loadingCourses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((classItem) => (
                <ClassCard key={classItem.id} classItem={classItem} />
              ))}
            </div>
          ) : (
            <div className="py-8 sm:py-12 text-center">
              <p className="text-base sm:text-lg text-muted-foreground">
                {classes.length === 0
                  ? "No classes available yet. Check back soon!"
                  : "No classes found in this category."}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Projects</h2>
              <p className="text-muted-foreground">
                Collaborate on real-world Web3 projects
              </p>
            </div>
            <Button asChild>
              <Link href="/academy/projects/new">Create Project</Link>
            </Button>
          </div>

          {loadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/academy/projects/${project.id}`}
                  className="block w-full group"
                >
                  <Card className="overflow-hidden transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2 hover:shadow-2xl cursor-pointer h-full">
                    {project.thumbnail && (
                      <div className="relative w-full h-40 overflow-hidden">
                        <Image
                          src={project.thumbnail}
                          alt={project.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">
                          {project.title}
                        </CardTitle>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            project.status === "in-progress"
                              ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30"
                              : project.status === "completed"
                              ? "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300 border border-green-500/20 dark:border-green-500/30"
                              : "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border border-yellow-500/20 dark:border-yellow-500/30"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                      <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">
                          Difficulty:{" "}
                          <span className="font-medium capitalize">
                            {project.difficulty}
                          </span>
                        </span>
                      </div>
                      {project.members && project.members.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {project.members.slice(0, 5).map((member) => {
                              const profile = project.memberProfiles?.[member.userId];
                              const avatar = profile?.avatar;
                              const name = profile?.name || `User ${member.userId.slice(0, 8)}`;
                              return (
                                <div
                                  key={member.userId}
                                  className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground overflow-hidden"
                                  title={name}
                                >
                                  {avatar ? (
                                    typeof avatar === "string" && avatar.startsWith("http") ? (
                                      <Image
                                        src={avatar}
                                        alt={name}
                                        fill
                                        className="object-cover"
                                        sizes="32px"
                                        unoptimized
                                      />
                                    ) : (
                                      <span>{avatar}</span>
                                    )
                                  ) : (
                                    <Users className="h-4 w-4" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {project.members.length > 5 && (
                            <span className="text-xs text-muted-foreground">
                              +{project.members.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 sm:py-12 text-center">
              <p className="text-base sm:text-lg text-muted-foreground mb-4">
                No projects yet. Create your first project to get started!
              </p>
              <Button asChild>
                <Link href="/academy/projects/new">Create Project</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Teams</h2>
              <p className="text-muted-foreground">
                Join or create teams to collaborate on projects
              </p>
            </div>
            <Button asChild>
              <Link href="/academy/teams/new">Create Team</Link>
            </Button>
          </div>

          {loadingTeams ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : teams.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  onClick={() => {
                    setSelectedTeam(team);
                    setTeamModalOpen(true);
                  }}
                  className="overflow-hidden transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                >
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {team.avatar ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={team.avatar}
                            alt={team.name}
                            className="w-10 h-10 object-cover rounded-full"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      {team.name}
                    </CardTitle>
                    <CardDescription>{team.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{team.memberCount} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FolderKanban className="h-4 w-4" />
                        <span>{team.projectCount} projects</span>
                      </div>
                    </div>
                    {team.members && team.members.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex -space-x-2">
                          {team.members.slice(0, 5).map((member) => (
                            <div
                              key={member.userId}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground"
                            >
                              {member.role === "owner" ? "O" : member.role === "admin" ? "A" : "M"}
                            </div>
                          ))}
                        </div>
                        {team.members.length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{team.members.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-8 sm:py-12 text-center">
              <p className="text-base sm:text-lg text-muted-foreground mb-4">
                No teams yet. Create your first team to start collaborating!
              </p>
              <Button asChild>
                <Link href="/academy/teams/new">Create Team</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <TeamModal
        team={selectedTeam}
        open={teamModalOpen}
        onOpenChange={setTeamModalOpen}
      />
    </div>
  );
}


