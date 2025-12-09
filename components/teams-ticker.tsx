"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { TeamWithDetails } from "@/lib/teams";
import { Users, FolderKanban } from "lucide-react";

interface TeamsTickerProps {
  teams: TeamWithDetails[];
}

export function TeamsTicker({ teams }: TeamsTickerProps) {
  if (teams.length === 0) {
    return null;
  }

  // Duplicate teams to create seamless infinite loop
  // With 2 copies, we animate to -50% for seamless transition
  const duplicatedTeams = [...teams, ...teams];

  return (
    <div className="relative h-64 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 flex flex-col animate-scroll-up">
        {duplicatedTeams.map((team, index) => (
          <Link
            key={`${team.id}-${index}`}
            href={`/academy/teams/${team.id}`}
            className="block mb-3 flex-shrink-0"
          >
            <Card className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {team.avatar ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={team.avatar}
                        alt={team.name}
                        width={32}
                        height={32}
                        className="object-cover rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">
                      {team.name}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-1">
                      {team.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{team.memberCount || 0} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FolderKanban className="h-3 w-3" />
                    <span>{team.projectCount || 0} projects</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

