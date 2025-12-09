"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/lib/profile";
import { User, Mail, Calendar, Edit, Trophy, Users as UsersIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { getUserBadges, Badge } from "@/lib/badges";

interface ProfileCardProps {
  profile: UserProfile;
  showEditButton?: boolean;
}

export function ProfileCard({ profile, showEditButton = true }: ProfileCardProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
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
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-2xl">Profile</CardTitle>
          {showEditButton && (
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.image_url ? (
              <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-border">
                <Image
                  src={profile.image_url}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4 min-w-0">
            <div>
              <h2 className="text-xl font-medium mb-1">{displayName}</h2>
              {profile.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{profile.email}</span>
              </div>

              {profile.bio && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                </div>
              )}

              {profile.created_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <Calendar className="h-4 w-4" />
                  <span>
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
                    <Trophy className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                    <span className="text-sm font-medium">Achievements</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 dark:from-yellow-500/20 dark:to-orange-600/20 border border-yellow-500/30 dark:border-yellow-400/30 px-3 py-1.5"
                      >
                        <Trophy className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-xs font-medium">{badge.badge_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Team Logo on Right Side - Always visible */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            {teamLogo ? (
              <div className="relative h-20 w-20 rounded-lg overflow-hidden border-2 border-border">
                <Image
                  src={teamLogo}
                  alt={teamName || "Team"}
                  fill
                  className="object-cover"
                  unoptimized
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

