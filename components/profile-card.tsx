"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/lib/profile";
import { User, Mail, Calendar, Edit, Trophy, Users as UsersIcon, MapPin, Globe, Star, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { getUserBadges, Badge as BadgeType } from "@/lib/badges";
import { getLevel } from "@/lib/progress";

interface ProfileCardProps {
  profile: UserProfile;
  showEditButton?: boolean;
  collaborationStatus?: {
    skills?: string[];
    location?: string;
    languages?: string[];
  } | null;
  xp?: number;
  level?: number;
}

export function ProfileCard({ profile, showEditButton = true, collaborationStatus, xp, level }: ProfileCardProps) {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(true);
  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const authSupabase = createClient();
        if (!authSupabase) {
          setLoadingBadges(false);
          return;
        }
        const {
          data: { user },
        } = await authSupabase.auth.getUser();

        if (user) {
          const learningSupabase = createLearningClient();
          if (!learningSupabase) {
            setLoadingBadges(false);
            return;
          }
          const userBadges = await getUserBadges(learningSupabase, user.id);
          setBadges(userBadges);
        }
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setLoadingBadges(false);
      }
    };

    const fetchTeam = async () => {
      try {
        const authSupabase = createClient();
        if (!authSupabase) {
          return;
        }
        const {
          data: { user },
        } = await authSupabase.auth.getUser();

        if (user) {
          const learningSupabase = createLearningClient();
          if (!learningSupabase) {
            return;
          }
          // Get user's first team (primary team)
          const { data: teamMembers, error } = await learningSupabase
            .from("team_members")
            .select("team_id, teams(id, name, avatar)")
            .eq("user_id", user.id)
            .limit(1);

          if (!error && teamMembers && teamMembers.length > 0) {
            const teamMember = teamMembers[0];
            if (teamMember && teamMember.teams) {
              const team = teamMember.teams as any;
              setTeamLogo(team.avatar || null);
              setTeamName(team.name || null);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching team:", error);
      }
    };

    fetchBadges();
    fetchTeam();
  }, [profile.id]);

  const fullName = profile.first_name || profile.last_name
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : profile.username || 'User';

  const displayName = fullName || profile.email.split('@')[0];

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">Profile</CardTitle>
          {showEditButton && (
            <Button asChild variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
              <Link href="/profile">
                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
          {/* Mobile: Avatar and Team Logo Row */}
          <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:justify-start">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.image_url ? (
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-2 border-border">
                  <Image
                    src={profile.image_url}
                    alt={displayName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 80px, 96px"
                  />
                </div>
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                  <User className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Team Logo - Show on mobile on right, hide on larger screens (will show on right on desktop) */}
            <div className="flex-shrink-0 sm:hidden flex flex-col items-center gap-2">
              {teamLogo ? (
                <div className="relative h-16 w-16 rounded-lg overflow-hidden border-2 border-border">
                  <Image
                    src={teamLogo}
                    alt={teamName || "Team"}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center border-2 border-border">
                  <UsersIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              {teamName && (
                <p className="text-xs text-muted-foreground text-center max-w-[80px] truncate">
                  {teamName}
                </p>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-3 sm:space-y-4 min-w-0 w-full">
            <div>
              <h2 className="text-lg sm:text-xl font-medium mb-1 break-words">{displayName}</h2>
              {profile.username && (
                <p className="text-xs sm:text-sm text-muted-foreground break-words">@{profile.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-start sm:items-center gap-2 text-xs sm:text-sm">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                <span className="text-muted-foreground flex-shrink-0">Email:</span>
                <span className="break-all">{profile.email}</span>
              </div>

              {profile.bio && (
                <div className="pt-2">
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">{profile.bio}</p>
                </div>
              )}

              {/* Location */}
              {collaborationStatus?.location && (
                <div className="flex items-start gap-2 pt-2">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-muted-foreground break-words">{collaborationStatus.location}</span>
                </div>
              )}

              {/* Languages */}
              {collaborationStatus?.languages && collaborationStatus.languages.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Languages</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {collaborationStatus.languages.map((lang, index) => (
                      <Badge key={index} variant="secondary" className="text-[10px] sm:text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills/Mastery */}
              {collaborationStatus?.skills && collaborationStatus.skills.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Skills & Mastery</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {collaborationStatus.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-[10px] sm:text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* XP & Level */}
              {(xp !== undefined && xp > 0) && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">Level & XP</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Level</span>
                      <span className="text-sm sm:text-base font-semibold">{level || getLevel(xp)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Total XP</span>
                      <span className="text-sm sm:text-base font-semibold">{xp.toLocaleString()}</span>
                    </div>
                    {(() => {
                      const currentLevel = level || getLevel(xp);
                      const currentLevelBase = (currentLevel - 1) * 500;
                      const nextLevelBase = currentLevel * 500;
                      const currentInLevel = xp - currentLevelBase;
                      const neededForNext = nextLevelBase - currentLevelBase;
                      const progress = neededForNext > 0 ? currentInLevel / neededForNext : 1;
                      
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
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

              {profile.created_at && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground pt-2">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-words">
                    Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </div>
              )}

              {/* Badges Section */}
              {badges.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 dark:text-yellow-400" />
                    <span className="text-xs sm:text-sm font-medium">Achievements</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 dark:from-yellow-500/20 dark:to-orange-600/20 border border-yellow-500/30 dark:border-yellow-400/30 px-2.5 sm:px-3 py-1 sm:py-1.5"
                      >
                        <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-[10px] sm:text-xs font-medium">{badge.badge_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Team Logo on Right Side - Desktop only */}
          <div className="hidden sm:flex flex-shrink-0 flex-col items-center gap-2">
            {teamLogo ? (
              <div className="relative h-20 w-20 rounded-lg overflow-hidden border-2 border-border">
                <Image
                  src={teamLogo}
                  alt={teamName || "Team"}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center border-2 border-border">
                <UsersIcon className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            {teamName && (
              <p className="text-xs text-muted-foreground text-center max-w-[100px] truncate">
                {teamName}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

