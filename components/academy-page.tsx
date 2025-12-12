"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { CategoryFilter } from "@/components/category-filter";
import { CourseCategory, Course } from "@/types";
import { BookOpen, FolderKanban, Users, ArrowLeft, ArrowRight } from "lucide-react";
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
import { getAllClasses, getClassModules, getClassEnrollments } from "@/lib/classes";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { useAdmin } from "@/lib/hooks/use-admin";
import { Loader2 } from "lucide-react";
import { Class } from "@/types";
import { ClassCard } from "@/components/class-card";
import { getUserProfile } from "@/lib/profile";

export function AcademyPageClient() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") as
    | CourseCategory
    | undefined;
  const initialTab = (searchParams.get("tab") as "classes" | "projects" | "teams") || null;

  const [currentTab, setCurrentTab] = useState<"classes" | "projects" | "teams" | null>(initialTab);
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [teamMemberProfiles, setTeamMemberProfiles] = useState<Record<string, Record<string, { name: string; avatar?: string }>>>({});
  const [teamProjects, setTeamProjects] = useState<Record<string, ProjectWithMembers[]>>({});
  const [classes, setClasses] = useState<Class[]>([]);
  const [classStats, setClassStats] = useState<Record<string, { moduleCount: number; studentCount: number }>>({});
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  
  // Create clients safely - they may be placeholders if env vars are missing
  const supabase = createClient();
  const learningSupabase = createLearningClient();
  const { isAdmin } = useAdmin();

  const filteredClasses = selectedCategory
    ? classes.filter((classItem) => classItem.category === selectedCategory)
    : classes;

  // Sync currentTab with URL parameter
  useEffect(() => {
    const tab = searchParams.get("tab") as "classes" | "projects" | "teams" | null;
    setCurrentTab(tab);
  }, [searchParams]);

  // Load all data for ticker icons (always load, not just when tab is selected)
  useEffect(() => {
    // Load classes for ticker
    if (learningSupabase) {
      getAllClasses({ publishedOnly: !isAdmin }, learningSupabase)
        .then(setClasses)
        .catch((error) => {
          console.error("Error loading classes:", error);
          setClasses([]);
        });
    }
    
    // Load projects for ticker
    if (supabase) {
      getAllProjects(supabase)
        .then(setProjects)
        .catch((error) => {
          console.error("Error loading projects:", error);
          setProjects([]);
        });
    }
    
    // Load teams for ticker
    if (supabase) {
      getAllTeams(supabase)
        .then(setTeams)
        .catch((error) => {
          console.error("Error loading teams:", error);
          setTeams([]);
        });
    }
  }, [supabase, learningSupabase, isAdmin]);

  useEffect(() => {
    const shouldLoadClasses = currentTab === "classes" || currentTab === null;
    const shouldLoadProjects = currentTab === "projects" || currentTab === null;
    const shouldLoadTeams = currentTab === "teams" || currentTab === null;

    if (shouldLoadClasses) {
      if (!learningSupabase) {
        setClasses([]);
        setLoadingCourses(false);
      } else {
        setLoadingCourses(true);
        getAllClasses({ publishedOnly: !isAdmin }, learningSupabase)
          .then(async (classesData) => {
            setClasses(classesData);
            // Fetch module and enrollment counts for each class
            const stats: Record<string, { moduleCount: number; studentCount: number }> = {};
            await Promise.all(
              classesData.map(async (classItem) => {
                try {
                  const [modules, enrollments] = await Promise.all([
                    getClassModules(classItem.id, learningSupabase),
                    getClassEnrollments(classItem.id, learningSupabase),
                  ]);
                  stats[classItem.id] = {
                    moduleCount: modules.length,
                    studentCount: enrollments.filter(e => e.status === "active").length,
                  };
                } catch (error) {
                  console.error(`Error loading stats for class ${classItem.id}:`, error);
                  stats[classItem.id] = { moduleCount: 0, studentCount: 0 };
                }
              })
            );
            setClassStats(stats);
          })
          .catch((error) => {
            console.error("Error loading classes:", error);
            setClasses([]);
          })
          .finally(() => setLoadingCourses(false));
      }
    }

    if (shouldLoadProjects) {
      if (!supabase) {
        setProjects([]);
        setLoadingProjects(false);
      } else {
        setLoadingProjects(true);
        getAllProjects(supabase)
          .then(async (projectsData) => {
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
      }
    }

    if (shouldLoadTeams) {
      if (!supabase) {
        setTeams([]);
        setLoadingTeams(false);
      } else {
        setLoadingTeams(true);
        getAllTeams(supabase)
          .then(async (teamsData) => {
            // Fetch member avatars & names for teams
            try {
              const authSupabase = createClient();
              const profilesMap: Record<string, Record<string, { name: string; avatar?: string }>> = {};
              
              await Promise.all(
                teamsData.map(async (team) => {
                  if (!team.members || team.members.length === 0) {
                    return;
                  }

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
                          avatar: profile?.image_url || profile?.email?.charAt(0).toUpperCase(),
                        };
                      } catch (error) {
                        console.error(`Error loading avatar for ${member.userId}:`, error);
                      }
                    })
                  );
                  profilesMap[team.id] = profiles;
                })
              );
              setTeamMemberProfiles(profilesMap);
              setTeams(teamsData);
              
              // Fetch projects for each team
              try {
                const allProjects = await getAllProjects(supabase);
                const projectsMap: Record<string, ProjectWithMembers[]> = {};
                teamsData.forEach(team => {
                  projectsMap[team.id] = allProjects.filter(p => p.teamId === team.id);
                });
                setTeamProjects(projectsMap);
              } catch (error) {
                console.error("Error loading team projects:", error);
              }
            } catch (error) {
              console.error("Error loading member avatars:", error);
              setTeams(teamsData);
            }
          })
          .catch((error) => {
            console.error("Error loading teams:", error);
            setTeams([]);
          })
          .finally(() => setLoadingTeams(false));
      }
    }
  }, [currentTab, supabase, learningSupabase, isAdmin]);

  // Collect all icons from classes, projects, and teams for ticker
  const allIcons = [
    ...classes.filter(c => c.thumbnail).map(c => ({ src: c.thumbnail!, alt: c.title, type: 'class' })),
    ...projects.filter(p => p.thumbnail).map(p => ({ src: p.thumbnail!, alt: p.title, type: 'project' })),
    ...teams.filter(t => t.avatar).map(t => ({ src: t.avatar!, alt: t.name, type: 'team' })),
  ];

  // Duplicate icons 10 times for seamless infinite loop
  // With 10 duplicates, animation moves -50% to loop seamlessly
  // At -50%, we're at the start of the 6th set (identical to 1st), creating seamless loop
  const duplicatedIcons = allIcons.length > 0 
    ? Array(10).fill(allIcons).flat()
    : [];

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Scrolling Icons Ticker - Only show when no tab is selected */}
      {!currentTab && allIcons.length > 0 && (
        <div className="mb-8 relative overflow-hidden">
          {/* Left fade gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
          {/* Right fade gradient */}
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
          
          <div className="relative overflow-hidden w-full h-20">
            <div className="absolute top-0 left-0 flex animate-scroll-left gap-6 whitespace-nowrap items-center">
              {duplicatedIcons.map((icon, i) => (
                <div 
                  key={`${icon.type}-${i}`} 
                  className="w-16 h-16 shrink-0 flex-shrink-0 rounded-xl overflow-hidden border-2 border-border/60 shadow-md hover:shadow-lg transition-shadow duration-300 bg-background/50 backdrop-blur-sm"
                >
                  <Image
                    src={icon.src}
                    alt={icon.alt}
                    width={64}
                    height={64}
                    quality={90}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    unoptimized={icon.src?.startsWith('http') ? false : undefined}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Section - Show all when no tab is selected, otherwise single tab */}
      {(currentTab === "classes" || currentTab === null) && (
        <div className={`space-y-4 ${currentTab ? "" : "mb-8 sm:mb-10"}`}>
          {currentTab === "classes" && (
            <Button
              variant="ghost"
              asChild
              className="mb-4"
            >
              <Link href="/academy">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Classes</h2>
            {currentTab === null && (
              <Link href="/academy?tab=classes" className="flex items-center hover:opacity-80 transition-opacity">
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
          <CategoryFilter />
          {loadingCourses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((classItem) => {
                const stats = classStats[classItem.id];
                return (
                  <ClassCard
                    key={classItem.id}
                    classItem={classItem}
                    compact={false}
                    moduleCount={stats?.moduleCount}
                    studentCount={stats?.studentCount}
                  />
                );
              })}
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
        </div>
      )}

      {(currentTab === "projects" || currentTab === null) && (
        <div className={`space-y-4 ${currentTab ? "" : "mb-8 sm:mb-10"}`}>
          {currentTab === "projects" && (
            <Button
              variant="ghost"
              asChild
              className="mb-4"
            >
              <Link href="/academy">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          )}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
            <div>
              <h2 className="text-xl font-semibold mb-1">Projects</h2>
              <p className="text-muted-foreground">
                Collaborate on real-world Web3 projects
              </p>
            </div>
            <div className="flex items-center gap-3">
              {currentTab === null && (
                <Link href="/academy?tab=projects" className="flex items-center hover:opacity-80 transition-opacity">
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
              {currentTab === "projects" && (
                <Button asChild>
                  <Link href="/academy/projects/new">Create Project</Link>
                </Button>
              )}
            </div>
          </div>

          {loadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/academy/projects/${project.id}`}
                  className="block w-full group"
                >
                  <Card className="overflow-hidden transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2 hover:shadow-2xl cursor-pointer h-full">
                    <CardContent className="p-6 flex-1 flex flex-col">
                      {/* Top Section: Logo/Thumbnail on left, Title on right */}
                      <div className="flex items-start gap-4 mb-4">
                        {/* Circular Logo/Thumbnail */}
                        <div className="flex-shrink-0">
                          {project.thumbnail ? (
                            <div className="relative w-16 h-16 rounded-full overflow-hidden">
                              <Image
                                src={project.thumbnail}
                                alt={project.title}
                                fill
                                sizes="64px"
                                className="object-cover transition-transform group-hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <FolderKanban className="h-8 w-8 text-primary" />
                            </div>
                          )}
                        </div>
                        
                        {/* Title */}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold mb-1 truncate">
                            {project.title}
                          </CardTitle>
                        </div>
                      </div>

                      {/* Bottom Section: Two columns with structured info */}
                      <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <p className="text-sm font-medium capitalize">{project.status}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
                          <p className="text-sm font-medium capitalize">{project.difficulty || "N/A"}</p>
                        </div>
                      </div>
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
        </div>
      )}

      {(currentTab === "teams" || currentTab === null) && (
        <div className={`space-y-4 pb-6 ${currentTab ? "" : "mt-2"}`}>
          {currentTab === "teams" && (
            <Button
              variant="ghost"
              asChild
              className="mb-4"
            >
              <Link href="/academy">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          )}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold mb-1">Teams</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Join or create teams to collaborate on projects
              </p>
            </div>
            <div className="flex items-center gap-3">
              {currentTab === null && (
                <Link href="/academy?tab=teams" className="flex items-center hover:opacity-80 transition-opacity">
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
              {currentTab === "teams" && (
                <Button asChild>
                  <Link href="/academy/teams/new">Create Team</Link>
                </Button>
              )}
            </div>
          </div>

          {loadingTeams ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
            </div>
          ) : teams.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0">
              {teams.map((team) => {
                const memberProfiles = teamMemberProfiles[team.id] || {};
                const memberCount = team.memberCount || team.members?.length || 0;
                const displayMembers = team.members?.slice(0, 5) || [];
                
                return (
                  <Link
                    key={team.id}
                    href={`/academy/teams/${team.id}`}
                    className="block w-full"
                  >
                    <Card className="w-full aspect-square flex flex-col items-center text-center overflow-hidden p-4">
                      {/* Centered logo and name */}
                      <div className="flex-1 flex flex-col items-center justify-center gap-2">
                        {team.avatar ? (
                          <div className="relative w-16 h-16 rounded-full overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={team.avatar}
                              alt={team.name}
                              className="w-16 h-16 object-cover rounded-full"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-7 w-7 text-primary" />
                          </div>
                        )}
                        <p className="text-base font-semibold">{team.name}</p>
                      </div>
                      
                      {/* Member avatars and count */}
                      {memberCount > 0 && (
                        <div className="flex items-center gap-2 mt-auto">
                          <div className="flex -space-x-2">
                            {displayMembers.map((member, idx) => {
                              const profile = memberProfiles[member.userId];
                              const avatar = profile?.avatar;
                              return (
                                <div
                                  key={member.userId}
                                  className="relative inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground overflow-hidden"
                                  style={{ zIndex: displayMembers.length - idx }}
                                >
                                  {avatar ? (
                                    typeof avatar === "string" && avatar.startsWith("http") ? (
                                      <img
                                        src={avatar}
                                        alt={profile?.name || "Member"}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span>{avatar}</span>
                                    )
                                  ) : (
                                    <Users className="h-3 w-3" />
                                  )}
                                </div>
                              );
                            })}
                            {memberCount > 5 && (
                              <div
                                className="relative inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground"
                                style={{ zIndex: 0 }}
                              >
                                +{memberCount - 5}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {memberCount > 1000 
                              ? `${(memberCount / 1000).toFixed(1)}K` 
                              : memberCount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-8 sm:py-12 text-center">
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-4 px-2">
                No teams yet. Create your first team to start collaborating!
              </p>
              <Button asChild size="sm" className="text-xs sm:text-sm h-9 sm:h-10">
                <Link href="/academy/teams/new">Create Team</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


