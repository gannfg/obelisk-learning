"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin,
  Globe,
  MessageSquare,
  Users,
  Trophy,
  Building2,
  Bot,
  Sparkles,
  Mail,
  Calendar,
  Star,
} from "lucide-react";
import { SocialUser } from "@/lib/social";
import { getLevel } from "@/lib/progress";

interface UserProfileModalProps {
  user: SocialUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageClick?: (userId: string) => void;
}

export function UserProfileModal({
  user,
  open,
  onOpenChange,
  onMessageClick,
}: UserProfileModalProps) {
  const displaySkills = user.specializations || user.skills || [];
  const displayName = user.name || user.username || `User ${user.id.slice(0, 8)}`;
  const isAIMentor = user.type === "ai-mentor";

  // Use DeMentor avatar for AI mentors
  const avatarSrc = isAIMentor ? "/dementor_avatar.png" : user.avatar;

  // Use real location and languages from user profile
  const location = isAIMentor ? "Available 24/7" : (user.location || "Location not set");
  const languages = isAIMentor ? ["English"] : (user.languages || []);
  const company = (user as any).company || user.bio || "";

  const handleMessageClick = () => {
    if (onMessageClick) {
      onMessageClick(user.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              {avatarSrc ? (
                <div className="relative">
                  <Image
                    src={avatarSrc}
                    alt={displayName}
                    width={80}
                    height={80}
                    className="rounded-lg w-20 h-20 object-cover object-top"
                    unoptimized
                  />
                  {isAIMentor && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center gap-2 flex-wrap mb-2">
                <span>{displayName}</span>
                {isAIMentor && (
                  <Badge
                    variant="default"
                    className="text-xs font-semibold px-2 py-0.5 bg-primary text-primary-foreground flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    AI Mentor
                  </Badge>
                )}
              </DialogTitle>
              {user.username && (
                <p className="text-sm text-muted-foreground mb-2">@{user.username}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bio */}
          {user.bio && (
            <div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}

          {/* Email */}
          {user.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground break-all">{user.email}</span>
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{location}</span>
          </div>

          {/* Languages */}
          {languages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium">Languages</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Skills/Mastery */}
          {displaySkills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium">Skills & Mastery</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {displaySkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs font-semibold"
                  >
                    #{skill.toUpperCase().replace(/\s+/g, '_')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Level and XP */}
          {user.xp !== undefined && user.xp > 0 && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                <span className="text-sm font-medium">Level & XP</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Level</span>
                  <span className="text-base font-semibold">{user.level || getLevel(user.xp)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total XP</span>
                  <span className="text-base font-semibold">{user.xp.toLocaleString()}</span>
                </div>
                {(() => {
                  const currentLevel = user.level || getLevel(user.xp);
                  const currentLevelBase = (currentLevel - 1) * 500;
                  const nextLevelBase = currentLevel * 500;
                  const currentInLevel = user.xp - currentLevelBase;
                  const neededForNext = nextLevelBase - currentLevelBase;
                  const progress = neededForNext > 0 ? currentInLevel / neededForNext : 1;

                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress to Level {currentLevel + 1}</span>
                        <span>{currentInLevel} / {neededForNext} XP</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 transition-all duration-300"
                          style={{ width: `${Math.max(2, Math.min(100, progress * 100))}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Teams */}
          {user.teams && user.teams.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium">Teams</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.teams.map((team, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {team.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Created At */}
          {user.createdAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                Member since {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          {onMessageClick && (
            <Button onClick={handleMessageClick} className="w-full sm:w-auto">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

