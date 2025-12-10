"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, FolderKanban, Loader2 } from "lucide-react";
import { getAllTeams, TeamWithDetails } from "@/lib/teams";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { user } = useAuth();

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      try {
        const data = await getAllTeams(supabase);
        setTeams(data);
      } catch (error) {
        console.error("Error loading teams:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
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
            <h1 className="mb-3 text-3xl sm:text-4xl font-bold">Teams</h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Join or create teams to collaborate on projects together
            </p>
          </div>
          {user ? (
            <Button asChild>
              <Link href="/academy/teams/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/auth/sign-in?redirect=/academy/teams">
                <Plus className="h-4 w-4 mr-2" />
                Sign In to Create
              </Link>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : teams.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="overflow-hidden transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2 hover:shadow-2xl"
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
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/academy/teams/${team.id}`}>View Team</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-base text-muted-foreground mb-4">
            No teams yet. {user ? "Create your first team to start collaborating!" : "Sign in to create your first team!"}
          </p>
          {user ? (
            <Button asChild>
              <Link href="/academy/teams/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/auth/sign-in?redirect=/academy/teams">
                <Plus className="h-4 w-4 mr-2" />
                Sign In to Create
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

