"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Users, Bot, Sparkles, ChevronRight } from "lucide-react";
import { SocialUser } from "@/lib/social";
import { cn } from "@/lib/utils";
import { UserProfileModal } from "@/components/user-profile-modal";

interface CollaboratorListItemProps {
  user: SocialUser;
  onMessageClick?: (userId: string) => void;
}

export function CollaboratorListItem({ user, onMessageClick }: CollaboratorListItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const displaySkills = user.specializations || user.skills || [];
  const displayName = user.name || user.username || `User ${user.id.slice(0, 8)}`;
  const isAIMentor = user.type === "ai-mentor";
  
  // Use DeMentor avatar for AI mentors
  const avatarSrc = isAIMentor ? "/dementor_avatar.png" : user.avatar;
  
  // Use real location and languages from user profile
  const location = isAIMentor ? "Available 24/7" : (user.location || "Location not set");
  const languages = isAIMentor ? ["English"] : (user.languages || []);

  const handleItemClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on a link
    if ((e.target as HTMLElement).closest('a')) {
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all duration-200 cursor-pointer",
          isAIMentor
            ? "hover:border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10"
            : ""
        )}
        onClick={handleItemClick}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {avatarSrc ? (
            <div className="relative">
              <Image
                src={avatarSrc}
                alt={displayName}
                width={48}
                height={48}
                className="rounded-full w-12 h-12 object-cover object-top"
                unoptimized
              />
              {isAIMentor && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                  <Bot className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and Username */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link 
                href={`/profile/${user.id}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline"
              >
                <h3 className="text-sm font-semibold leading-tight truncate">
                  {displayName}
                </h3>
              </Link>
              {user.username && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  @{user.username}
                </span>
              )}
            </div>
            {isAIMentor && (
              <Badge 
                variant="default" 
                className="text-[9px] font-semibold px-1.5 py-0 bg-primary text-primary-foreground flex items-center gap-0.5 flex-shrink-0"
              >
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </Badge>
            )}
          </div>

          {/* Mastery */}
          {displaySkills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {displaySkills.slice(0, 2).map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-[9px] font-semibold px-1.5 py-0 bg-muted text-foreground border-0"
                >
                  #{skill.toUpperCase().replace(/\s+/g, '_')}
                </Badge>
              ))}
              {displaySkills.length > 2 && (
                <Badge
                  variant="secondary"
                  className="text-[9px] font-semibold px-1.5 py-0 bg-muted text-foreground border-0"
                >
                  +{displaySkills.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Location and Language */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[100px]">{location}</span>
            </div>
            {languages.length > 0 && (
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 flex-shrink-0" />
                <span className="truncate max-w-[80px]">
                  {Array.isArray(languages) 
                    ? languages.slice(0, 2).join(", ")
                    : languages}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>

      <UserProfileModal
        user={user}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onMessageClick={onMessageClick}
      />
    </>
  );
}

