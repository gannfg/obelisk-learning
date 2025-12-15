"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { TeamWithDetails } from "@/lib/teams";
import { Users, FolderKanban } from "lucide-react";
import { TeamModal } from "@/components/team-modal";

interface TeamsTickerProps {
  teams: TeamWithDetails[];
}

export function TeamsTicker({ teams }: TeamsTickerProps) {
  const [selectedTeam, setSelectedTeam] = useState<TeamWithDetails | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (teams.length === 0) {
    return null;
  }

  // Duplicate teams to create seamless infinite loop
  // With 2 copies, we animate to -50% for seamless transition
  const duplicatedTeams = [...teams, ...teams];

  const handleTeamClick = (team: TeamWithDetails) => {
    setSelectedTeam(team);
    setModalOpen(true);
  };

  return (
    <>
      <div className="relative h-48 lg:h-64 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 flex flex-col animate-scroll-up">
          {duplicatedTeams.map((team, index) => (
            <button
              key={`${team.id}-${index}`}
              onClick={() => handleTeamClick(team)}
              className="block mb-2 lg:mb-3 flex-shrink-0 w-full text-left"
            >
            <Card className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
              <CardContent className="p-2.5 lg:p-4">
                <div className="flex items-center gap-1.5 lg:gap-2 mb-1.5 lg:mb-2">
                  {team.avatar ? (
                    <div className="relative w-6 h-6 lg:w-8 lg:h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={team.avatar}
                        alt={team.name}
                        width={32}
                        height={32}
                        className="object-cover rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xs lg:text-sm font-semibold truncate">
                      {team.name}
                    </CardTitle>
                    <CardDescription className="text-[10px] lg:text-xs line-clamp-1">
                      {team.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 lg:gap-3 text-[10px] lg:text-xs text-muted-foreground">
                  <div className="flex items-center gap-0.5 lg:gap-1">
                    <Users className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                    <span>{team.memberCount || 0} members</span>
                  </div>
                  <div className="flex items-center gap-0.5 lg:gap-1">
                    <FolderKanban className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                    <span>{team.projectCount || 0} projects</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
    <TeamModal
      team={selectedTeam}
      open={modalOpen}
      onOpenChange={setModalOpen}
    />
    </>
  );
}

