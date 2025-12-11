"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { CategoryFilter } from "@/components/category-filter";
import { CourseCategory, Course } from "@/types";
import { BookOpen, FolderKanban, Users, ArrowLeft } from "lucide-react";
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
  const initialTab = (searchParams.get("tab") as "classes" | "projects" | "teams") || null;

  const [currentTab, setCurrentTab] = useState<"classes" | "projects" | "teams" | null>(initialTab);
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
          .then(setClasses)
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
          .then(setTeams)
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
            <Link href="/academy?tab=classes" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <CategoryFilter />
          {loadingCourses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((classItem) => (
                <ClassCard key={classItem.id} classItem={classItem} compact />
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
              <Link href="/academy?tab=projects" className="text-xs text-primary hover:underline">
                View all
              </Link>
              <Button asChild>
                <Link href="/academy/projects/new">Create Project</Link>
              </Button>
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
                    {project.thumbnail && (
                      <div className="relative w-full h-28 overflow-hidden">
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
                    </CardHeader>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
            <div>
              <h2 className="text-xl font-semibold mb-1">Teams</h2>
              <p className="text-muted-foreground">
                Join or create teams to collaborate on projects
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/academy?tab=teams" className="text-xs text-primary hover:underline">
                View all
              </Link>
              <Button variant="outline" asChild>
                <Link href="/academy/teams">Browse Teams</Link>
              </Button>
              <Button asChild>
                <Link href="/academy/teams/new">Create Team</Link>
              </Button>
            </div>
          </div>

          {loadingTeams ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : teams.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  onClick={() => {
                    setSelectedTeam(team);
                    setTeamModalOpen(true);
                  }}
                  className="w-full aspect-square flex flex-col items-center justify-center text-center gap-2 overflow-hidden transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                >
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
        </div>
      )}
      
      <TeamModal
        team={selectedTeam}
        open={teamModalOpen}
        onOpenChange={setTeamModalOpen}
      />
    </div>
  );
}


