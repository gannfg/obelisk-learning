"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserProfile, UserProfile } from "@/lib/profile";
import { getCollaborationStatus } from "@/lib/collaboration";
import { getUserBadges } from "@/lib/badges";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import {
  Loader2,
  ArrowLeft,
  BookOpen,
  Calendar,
  FolderKanban,
  CheckCircle2,
  MapPin,
  Video,
  Globe,
  Trophy,
  User,
  Share2,
  Twitter,
  Linkedin,
  Github,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { useAuth } from "@/lib/hooks/use-auth";

export default function UserProfileViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const userId = params?.userId as string;
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collaborationStatus, setCollaborationStatus] = useState<{
    skills: string[];
    location?: string;
    languages?: string[];
  } | null>(null);
  const [userXP, setUserXP] = useState<number | undefined>(undefined);
  const [userLevel, setUserLevel] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"proof-of-work" | "activity-feed" | "personal-projects">("proof-of-work");
  const [badgeStats, setBadgeStats] = useState({
    badgesCount: 0,
    achievementsCount: 0,
  });
  const [loadingBadgeStats, setLoadingBadgeStats] = useState(true);
  const [featuredBadges, setFeaturedBadges] = useState<Array<{
    id: string;
    badge_name: string;
    badge_image_url?: string;
    earned_at: string;
  }>>([]);
  const [userTeams, setUserTeams] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [attendedWorkshops, setAttendedWorkshops] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [userProjects, setUserProjects] = useState<Array<{
    id: string;
    title: string;
    description: string;
    thumbnail?: string;
    status: "planning" | "in-progress" | "completed" | "archived";
    difficulty: "beginner" | "intermediate" | "advanced";
    tags: string[];
    repositoryUrl?: string;
    liveUrl?: string;
    createdAt: Date;
  }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setError("User ID is required");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        if (!supabase) {
          setError("Failed to initialize client");
          setLoading(false);
          return;
        }

        // Load user profile (works for guests)
        const userProfile = await getUserProfile(userId, undefined, supabase);
        
        if (!userProfile) {
          setError("User not found");
          setLoading(false);
          return;
        }

        setProfile(userProfile);

        // Fetch XP from user profile
        const { data: userData } = await supabase
          .from("users")
          .select("xp")
          .eq("id", userId)
          .maybeSingle();
        
        const xp = (userData?.xp as number) || 0;
        if (xp > 0) {
          const { getLevel } = await import("@/lib/progress");
          setUserXP(xp);
          setUserLevel(getLevel(xp));
        }

        // Load collaboration status (only if authenticated and viewing own profile)
        if (currentUser && currentUser.id === userId) {
          try {
            const collabStatus = await getCollaborationStatus(userId, supabase);
            setCollaborationStatus({
              skills: collabStatus?.collaborationInterests || [],
              location: userProfile?.location || undefined,
              languages: userProfile?.languages || undefined,
            });
          } catch (err) {
            console.error("Error loading collaboration status:", err);
          }
        } else {
          // For other users, just show location and languages from profile
          setCollaborationStatus({
            skills: [], // Don't show skills for other users unless they're public
            location: userProfile?.location || undefined,
            languages: userProfile?.languages || undefined,
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, supabase, currentUser]);

  // Load badge and achievement stats
  useEffect(() => {
    const loadBadgeStats = async () => {
      if (!userId) {
        setLoadingBadgeStats(false);
        return;
      }

      try {
        setLoadingBadgeStats(true);
        const learningSupabase = createLearningClient();
        if (!learningSupabase) {
          setLoadingBadgeStats(false);
          return;
        }

        // Get badges
        const badges = await getUserBadges(learningSupabase, userId);
        const badgesCount = badges.length;

        // Get featured badges
        const badgesWithImages = badges.filter((b: any) => b.metadata?.badge_image_url);
        const otherBadges = badges.filter((b: any) => !b.metadata?.badge_image_url);
        
        const sortedBadges = [
          ...badgesWithImages.sort((a: any, b: any) => 
            new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()
          ),
          ...otherBadges.sort((a: any, b: any) => 
            new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()
          )
        ];

        const featured = sortedBadges.slice(0, 3).map((badge: any) => ({
          id: badge.id,
          badge_name: badge.badge_name,
          badge_image_url: badge.metadata?.badge_image_url,
          earned_at: badge.earned_at,
        }));

        setFeaturedBadges(featured);

        // Get achievements count
        const { count: achievementsCount } = await learningSupabase
          .from("mission_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("completed", true);

        setBadgeStats({
          badgesCount: badgesCount || 0,
          achievementsCount: achievementsCount || 0,
        });
      } catch (error) {
        console.error("Error loading badge stats:", error);
      } finally {
        setLoadingBadgeStats(false);
      }
    };

    loadBadgeStats();
  }, [userId]);

  // Load user teams
  useEffect(() => {
    const loadUserTeams = async () => {
      if (!userId) {
        setLoadingTeams(false);
        return;
      }

      try {
        setLoadingTeams(true);
        const learningSupabase = createLearningClient();
        if (!learningSupabase) {
          setLoadingTeams(false);
          return;
        }

        const { data: teamMembersData, error } = await learningSupabase
          .from("team_members")
          .select(`
            teams(id, name, avatar)
          `)
          .eq("user_id", userId);

        if (error) {
          console.error("Error loading user teams:", error);
          setUserTeams([]);
        } else {
          const teams = (teamMembersData || [])
            .map((tm: any) => tm.teams)
            .filter((team: any) => team !== null && team !== undefined)
            .map((team: any) => ({
              id: team.id,
              name: team.name,
              avatar: team.avatar || undefined,
            }));
          setUserTeams(teams);
        }
      } catch (error) {
        console.error("Error loading user teams:", error);
        setUserTeams([]);
      } finally {
        setLoadingTeams(false);
      }
    };

    loadUserTeams();
  }, [userId]);

  // Load workshop attendance
  useEffect(() => {
    const loadAttendance = async () => {
      if (!userId) {
        setLoadingAttendance(false);
        return;
      }

      try {
        setLoadingAttendance(true);
        const learningSupabase = createLearningClient();
        if (!learningSupabase) {
          setLoadingAttendance(false);
          return;
        }

        const { data: attendanceData, error } = await learningSupabase
          .from("workshop_attendance")
          .select(`
            id,
            workshop_id,
            user_id,
            checkin_time,
            method,
            workshops (
              id,
              title,
              datetime,
              location_type,
              venue_name
            )
          `)
          .eq("user_id", userId)
          .order("checkin_time", { ascending: false });

        if (error) {
          console.error("Error loading attendance:", error);
          setAttendedWorkshops([]);
        } else {
          setAttendedWorkshops(attendanceData || []);
        }
      } catch (error) {
        console.error("Error loading attendance:", error);
        setAttendedWorkshops([]);
      } finally {
        setLoadingAttendance(false);
      }
    };

    loadAttendance();
  }, [userId]);

  // Load user projects
  useEffect(() => {
    const loadUserProjects = async () => {
      if (!userId) {
        setLoadingProjects(false);
        return;
      }

      try {
        setLoadingProjects(true);
        const learningSupabase = createLearningClient();
        if (!learningSupabase) {
          setLoadingProjects(false);
          return;
        }

        const { data: projectMembers } = await learningSupabase
          .from("project_members")
          .select("project_id")
          .eq("user_id", userId);
        
        const projectMemberIds = new Set(projectMembers?.map((pm) => pm.project_id) || []);
        
        const { data: createdProjects } = await learningSupabase
          .from("projects")
          .select("id")
          .eq("created_by", userId);
        
        createdProjects?.forEach((p) => projectMemberIds.add(p.id));
        
        if (projectMemberIds.size > 0) {
          const { data: projectsData, error } = await learningSupabase
            .from("projects")
            .select("*")
            .in("id", Array.from(projectMemberIds))
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error loading user projects:", error);
            setUserProjects([]);
          } else {
            const projects = (projectsData || []).map((project: any) => ({
              id: project.id,
              title: project.title,
              description: project.description,
              thumbnail: project.thumbnail || undefined,
              status: project.status,
              difficulty: project.difficulty,
              tags: project.tags || [],
              repositoryUrl: project.repository_url || undefined,
              liveUrl: project.live_url || undefined,
              createdAt: new Date(project.created_at),
            }));
            setUserProjects(projects);
          }
        } else {
          setUserProjects([]);
        }
      } catch (error) {
        console.error("Error loading user projects:", error);
        setUserProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadUserProjects();
  }, [userId]);

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl pb-20 sm:pb-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl pb-20 sm:pb-8">
        <Card className="p-4 sm:p-5 md:p-6">
          <CardHeader className="p-0 pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl">User Not Found</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {error || "The user you're looking for doesn't exist."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Button asChild variant="outline" className="text-xs sm:text-sm h-8 sm:h-9 md:h-10">
              <Link href="/social">Browse Users</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get full name
  const fullName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile.first_name || profile.last_name || "User";

  // Handle share profile
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${fullName}'s Profile`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const isOwnProfile = currentUser && currentUser.id === userId;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl pb-20 sm:pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Profile Header Card */}
      <Card className="mb-8 overflow-hidden">
        <CardContent className="p-0">
          {/* Banner */}
          <div className="relative w-full h-32 sm:h-40 bg-gradient-to-r from-transparent to-purple-800/75 rounded-t-lg">
            <div className="absolute inset-0 flex items-start gap-3 sm:gap-6 pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex-shrink-0">
                {profile.image_url ? (
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-border">
                    <Image
                      src={profile.image_url}
                      alt={fullName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-muted border border-border flex items-center justify-center">
                    <span className="text-xl sm:text-2xl md:text-3xl font-medium text-muted-foreground">
                      {fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-1 sm:mb-2">{fullName}</h1>
                {profile.username && (
                  <div>
                    <p className="text-sm sm:text-base text-muted-foreground">@{profile.username}</p>
                    {userTeams.length > 0 && (
                      <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                        {userTeams.slice(0, 5).map((team) => (
                          team.avatar ? (
                            <div key={team.id} className="h-5 w-5 sm:h-6 sm:w-6 rounded-full overflow-hidden border border-border flex-shrink-0">
                              <Image
                                src={team.avatar}
                                alt={team.name}
                                width={24}
                                height={24}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : null
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleShare}
                className="flex-shrink-0 bg-white text-black hover:bg-white/90 h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3 sm:p-2 flex items-center justify-center"
              >
                <Share2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>

          {/* Details and Skills Columns */}
          <div className="px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-t border-b border-border py-8">
              {/* Left Column - Details */}
              <div>
                <h3 className="text-lg font-medium mb-4">Details</h3>
                <div className="space-y-4 text-base">
                  {profile.location ? (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="h-5 w-5 flex-shrink-0" />
                      <span>{profile.location}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-muted-foreground/50">
                      <MapPin className="h-5 w-5 flex-shrink-0" />
                      <span>No location set</span>
                    </div>
                  )}
                  {profile.created_at && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <UserPlus className="h-5 w-5 flex-shrink-0" />
                      <span>Member since {format(new Date(profile.created_at), "MMM yyyy")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Mastery */}
              <div>
                <h3 className="text-lg font-medium mb-4">Mastery</h3>
                {collaborationStatus?.skills && collaborationStatus.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {collaborationStatus.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="rounded-full px-4 py-1.5">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-base text-muted-foreground/50">No skills added yet</p>
                )}
                {isOwnProfile && (
                  <div className="mt-6">
                    <Button asChild variant="outline">
                      <Link href="/profile">Edit Profile</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links & Statistics Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 border-b border-border pb-8">
              {/* Social Links */}
              <div className="flex items-center gap-4">
                {profile.twitter_url && (
                  <a 
                    href={profile.twitter_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {profile.linkedin_url && (
                  <a 
                    href={profile.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {profile.github_url && (
                  <a 
                    href={profile.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                )}
                {profile.website_url && (
                  <a 
                    href={profile.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>

              {/* Statistics & Featured Badges */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  {loadingBadgeStats ? (
                    <div className="flex gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : featuredBadges.length > 0 ? (
                    <>
                      {featuredBadges.map((badge) => (
                        <div
                          key={badge.id}
                          className="relative w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0 group cursor-pointer"
                          title={badge.badge_name}
                        >
                          {badge.badge_image_url ? (
                            <Image
                              src={badge.badge_image_url}
                              alt={badge.badge_name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                              <Trophy className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                      {badgeStats.badgesCount > 3 && (
                        <Link
                          href={`/profile/${userId}/achievements`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          +{badgeStats.badgesCount - 3} more
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No badges yet
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{loadingBadgeStats ? "..." : badgeStats.achievementsCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">Achievement</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 flex items-center gap-8 border-b border-border">
            <button
              onClick={() => setActiveTab("proof-of-work")}
              className={`pb-4 text-base font-medium transition-colors ${
                activeTab === "proof-of-work"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Proof of Work
            </button>
            <button
              onClick={() => setActiveTab("activity-feed")}
              className={`pb-4 text-base font-medium transition-colors ${
                activeTab === "activity-feed"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Activity Feed
            </button>
            <button
              onClick={() => setActiveTab("personal-projects")}
              className={`pb-4 text-base font-medium transition-colors ${
                activeTab === "personal-projects"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Personal Projects
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Content Area Based on Active Tab */}
      <div className="min-h-[300px] mt-8">
        {activeTab === "proof-of-work" && (
          <div>
            {loadingAttendance ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : attendedWorkshops.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-base text-muted-foreground mb-4">
                    No proof of work yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {attendedWorkshops.map((attendance: any) => {
                  const workshop = attendance.workshops;
                  if (!workshop) return null;

                  return (
                    <Card
                      key={attendance.id}
                      className="transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <CheckCircle2 className="h-5 w-5 text-foreground flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-base">{fullName}</h4>
                              <span className="text-base text-muted-foreground">won a bounty</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(attendance.checkin_time), "h'h' 'ago'")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "activity-feed" && (
          <div>
            {loadingAttendance ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : attendedWorkshops.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-base text-muted-foreground">
                    No activity yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {attendedWorkshops.slice(0, 5).map((attendance: any) => {
                  const workshop = attendance.workshops;
                  if (!workshop) return null;

                  return (
                    <Card
                      key={attendance.id}
                      className="transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          {profile.image_url ? (
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border flex-shrink-0">
                              <Image
                                src={profile.image_url}
                                alt={fullName}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                              <span className="text-base font-medium text-muted-foreground">
                                {fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-base">{fullName}</span>
                              <span className="text-base text-muted-foreground">attended a workshop</span>
                            </div>
                            <p className="text-base font-medium mb-1">{workshop.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(attendance.checkin_time), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "personal-projects" && (
          <div>
            {loadingProjects ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : userProjects.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-base text-muted-foreground mb-4">
                    No personal projects yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        {project.thumbnail ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border flex-shrink-0">
                            <Image
                              src={project.thumbnail}
                              alt={project.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
                            <FolderKanban className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-base">{project.title}</h4>
                            <Badge 
                              variant={project.status === "completed" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {project.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {project.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {project.description}
                          </p>
                          {project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {project.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {project.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{project.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-muted-foreground">
                              {format(project.createdAt, "MMM d, yyyy")}
                            </p>
                            {project.liveUrl && (
                              <a
                                href={project.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                View Live
                              </a>
                            )}
                            {project.repositoryUrl && (
                              <a
                                href={project.repositoryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Repository
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
