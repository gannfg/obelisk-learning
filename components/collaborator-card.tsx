"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Users, Bot, Sparkles } from "lucide-react";
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

  return (
    <>
      <Card
        className={cn(
          "group hover:shadow-lg transition-all duration-200 cursor-pointer h-[190px] sm:h-[280px] flex flex-col",
          isAIMentor
            ? "hover:border-primary bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
            : "hover:border-primary/50"
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <CardContent className="p-3 sm:p-4 md:p-5 flex flex-col h-full">
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 flex-1 min-h-0">
            {/* Avatar - Username */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-shrink-0">
                {avatarSrc ? (
                  <div className="relative">
                    <Image
                      src={avatarSrc}
                      alt={displayName}
                      width={64}
                      height={64}
                      className="rounded-full w-12 h-12 sm:w-14 sm:h-14 object-cover object-top"
                      unoptimized
                    />
                    {isAIMentor && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                        <Bot className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
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
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                )}
              </div>
            </div>

            {/* Mastery */}
            {displaySkills.length > 0 && (
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {displaySkills.slice(0, 3).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 bg-muted text-foreground border-0"
                  >
                    #{skill.toUpperCase().replace(/\s+/g, '_')}
                  </Badge>
                ))}
                {displaySkills.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 bg-muted text-foreground border-0"
                  >
                    +{displaySkills.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Bio */}
            {user.bio && (
              <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground line-clamp-2 flex-1 min-h-0">
                {user.bio}
              </p>
            )}

            {/* Location and Language */}
            <div className="flex flex-col gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t border-border mt-auto">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </div>
              
              {languages.length > 0 && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">
                    {Array.isArray(languages) 
                      ? languages.join(", ")
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

