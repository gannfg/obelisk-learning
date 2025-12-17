"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bot, Users } from "lucide-react";
import { SocialUser } from "@/lib/social";
import { cn } from "@/lib/utils";

interface SocialUserCardProps {
  user: SocialUser;
  isSelected?: boolean;
  onClick?: () => void;
}

export function SocialUserCard({ user, isSelected, onClick }: SocialUserCardProps) {
  const isAI = user.type === "ai-mentor";
  const isMentor = user.type === "mentor";
  const skills = user.skills || user.specializations || [];

  // Get availability status color
  const getAvailabilityColor = () => {
    if (user.availability === "available") return "bg-green-500/10 text-green-700 dark:text-green-300";
    if (user.availability === "busy") return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300";
    if (user.availability === "away") return "bg-gray-500/10 text-gray-700 dark:text-gray-300";
    return "";
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer",
        isSelected
          ? "ring-2 ring-primary bg-primary/5"
          : "hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={48}
                height={48}
                className="rounded-full w-12 h-12 object-cover object-top"
                unoptimized
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            {isAI && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <Bot className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            {/* Availability indicator for regular users */}
            {user.type === "user" && user.availability && (
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                  getAvailabilityColor()
                )}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold leading-tight truncate">
                {user.name}
              </h3>
              {isAI && (
                <Badge variant="default" className="text-xs">
                  AI Mentor
                </Badge>
              )}
              {isMentor && !isAI && (
                <Badge variant="secondary" className="text-xs">
                  Mentor
                </Badge>
              )}
              {user.lookingForCollaborators && (
                <Badge variant="outline" className="text-xs border-primary/20 text-primary">
                  Looking for Collaborators
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {user.username && (
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              )}
              {user.availability && user.type === "user" && (
                <span className={cn("text-xs capitalize", getAvailabilityColor())}>
                  • {user.availability}
                </span>
              )}
              {isAI && (
                <p className="text-xs text-muted-foreground">Available 24/7</p>
              )}
            </div>
            {user.bio && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {user.bio}
              </p>
            )}
          </div>
          {isSelected && (
            <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
          )}
        </div>
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                +{skills.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

