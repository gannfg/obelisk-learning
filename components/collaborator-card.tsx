"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Users, Trophy, Building2, Bot, Sparkles } from "lucide-react";
import { SocialUser } from "@/lib/social";
import { cn } from "@/lib/utils";
import { UserProfileModal } from "@/components/user-profile-modal";

interface CollaboratorCardProps {
  user: SocialUser;
  onMessageClick?: (userId: string) => void;
}

export function CollaboratorCard({ user, onMessageClick }: CollaboratorCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const displaySkills = user.specializations || user.skills || [];
  const displayName = user.name || user.username || `User ${user.id.slice(0, 8)}`;
  const isAIMentor = user.type === "ai-mentor";
  
  // Use DeMentor avatar for AI mentors
  const avatarSrc = isAIMentor ? "/dementor_avatar.png" : user.avatar;
  
  // Use real location and languages from user profile
  const location = isAIMentor ? "Available 24/7" : (user.location || "Location not set");
  const languages = isAIMentor ? ["English"] : (user.languages || []);
  const company = (user as any).company || user.bio || "";

  return (
    <>
      <Card
        className={cn(
          "group hover:shadow-lg transition-all duration-200 cursor-pointer",
          isAIMentor
            ? "hover:border-primary bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
            : "hover:border-primary/50"
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          {/* Avatar and Name Section */}
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              {avatarSrc ? (
                <div className="relative">
                  <Image
                    src={avatarSrc}
                    alt={displayName}
                    width={64}
                    height={64}
                    className="rounded-lg w-14 h-14 sm:w-16 sm:h-16 object-cover object-top"
                    unoptimized
                  />
                  {isAIMentor && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                      <Bot className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-base sm:text-lg font-bold leading-tight">
                  {displayName}
                </h3>
                {isAIMentor && (
                  <Badge 
                    variant="default" 
                    className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 bg-primary text-primary-foreground flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    AI Mentor
                  </Badge>
                )}
              </div>
              {user.username && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  @{user.username}
                </p>
              )}
              
              {/* Role/Skill Tags - Hashtag style */}
              {displaySkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {displaySkills.slice(0, 4).map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 bg-muted text-foreground border-0"
                    >
                      #{skill.toUpperCase().replace(/\s+/g, '_')}
                    </Badge>
                  ))}
                  {displaySkills.length > 4 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 bg-muted text-foreground border-0"
                    >
                      +{displaySkills.length - 4}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Company/Affiliation */}
          {company && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {company}
            </p>
          )}

          {/* Level and Teams */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
            {user.level && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                <span className="font-semibold text-foreground">Level {user.level}</span>
                {user.xp && (
                  <span className="text-muted-foreground">({user.xp.toLocaleString()} XP)</span>
                )}
              </div>
            )}
            
            {user.teams && user.teams.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">
                  {user.teams[0].name}
                  {user.teams.length > 1 && ` +${user.teams.length - 1}`}
                </span>
              </div>
            )}
          </div>

          {/* Location and Languages */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            
            {languages.length > 0 && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">
                  {Array.isArray(languages) 
                    ? languages.slice(0, 3).join(", ") + (languages.length > 3 ? ` and ${languages.length - 3} more` : "")
                    : languages}
                </span>
              </div>
            )}
          </div>

        </div>
      </CardContent>
    </Card>

    <UserProfileModal
      user={user}
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      onMessageClick={onMessageClick}
    />
    </>
  );
}

