"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Plus, Loader2, Users } from "lucide-react";
import { getAllProjects, ProjectWithMembers } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const data = await getAllProjects(supabase);
        setProjects(data);
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [supabase]);
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <Link
          href="/academy"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block transition-colors"
        >
          ← Back to Academy
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="mb-3 text-3xl sm:text-4xl font-bold">Projects</h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Collaborate on real-world Web3 projects with your team
            </p>
          </div>
          <Button asChild>
            <Link href="/academy/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="overflow-hidden transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2 hover:shadow-2xl"
            >
              {project.thumbnail && (
                <div className="relative w-full h-40 overflow-hidden">
                  <Image
                    src={project.thumbnail}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{project.title}</CardTitle>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    project.status === "in-progress" 
                      ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30"
                      : project.status === "completed"
                      ? "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300 border border-green-500/20 dark:border-green-500/30"
                      : project.status === "archived"
                      ? "bg-muted text-muted-foreground border border-border"
                      : "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border border-yellow-500/20 dark:border-yellow-500/30"
                  }`}>
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
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FolderKanban className="h-4 w-4" />
                      <span>{project.memberCount} members</span>
                    </div>
                    <span className="capitalize">{project.difficulty}</span>
                  </div>
                </div>
                {project.members && project.members.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 5).map((member) => (
                        <div
                          key={member.userId}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-primary/10 text-xs font-medium text-primary"
                        >
                          <Users className="h-4 w-4" />
                        </div>
                      ))}
                    </div>
                    {project.members.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{project.members.length - 5} more
                      </span>
                    )}
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/academy/projects/${project.id}`}>View Project</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-base text-muted-foreground mb-4">
            No projects yet. Create your first project to get started!
          </p>
          <Button asChild>
            <Link href="/academy/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

