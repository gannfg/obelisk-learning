"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useEffect, useState, useMemo } from "react";
import { ProfileCard } from "@/components/profile-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/profile";
import { getCollaborationStatus, updateCollaborationStatus } from "@/lib/collaboration";
import { getUserBadges } from "@/lib/badges";
import { countries } from "@/lib/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { uploadProfilePicture } from "@/lib/storage";
import {
  Loader2,
  Save,
  ArrowLeft,
  Upload,
  X,
  BookOpen,
  Calendar,
  FolderKanban,
  CheckCircle2,
  MapPin,
  Video,
  Globe,
  Trophy,
  User,
  Edit,
  Share2,
  Twitter,
  Linkedin,
  Github,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    bio: "",
    location: "",
    languages: [] as string[],
    skills: [] as string[],
    twitter_url: "",
    linkedin_url: "",
    github_url: "",
    website_url: "",
  });
  const [languageInput, setLanguageInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({
    classesCount: 0,
    workshopsCount: 0,
    projectsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [attendedWorkshops, setAttendedWorkshops] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
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
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }

        const [userProfile, collabStatus] = await Promise.all([
          getUserProfile(user.id, user.email || undefined, supabase),
          getCollaborationStatus(user.id, supabase),
        ]);
        
        // Fetch XP from user profile
        const { data: userData } = await supabase
          .from("users")
          .select("xp")
          .eq("id", user.id)
          .maybeSingle();
        
        const xp = (userData?.xp as number) || 0;
        if (xp > 0) {
          const { getLevel } = await import("@/lib/progress");
          setUserXP(xp);
          setUserLevel(getLevel(xp));
        } else {
          setUserXP(undefined);
          setUserLevel(undefined);
        }
        
        // Set collaboration status for display
        setCollaborationStatus({
          skills: collabStatus?.collaborationInterests || [],
          location: userProfile?.location || undefined,
          languages: userProfile?.languages || undefined,
        });
        
        if (userProfile) {
          setProfile(userProfile);
          setFormData({
            username: userProfile.username || "",
            first_name: userProfile.first_name || "",
            last_name: userProfile.last_name || "",
            bio: userProfile.bio || "",
            location: userProfile.location || "",
            languages: userProfile.languages || [],
            skills: collabStatus?.collaborationInterests || [],
            twitter_url: userProfile.twitter_url || "",
            linkedin_url: userProfile.linkedin_url || "",
            github_url: userProfile.github_url || "",
            website_url: userProfile.website_url || "",
          });
        } else {
          // If no profile exists, initialize with Supabase Auth user data
          setFormData({
            username: user.user_metadata?.username || "",
            first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || "",
            last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
            bio: "",
            location: "",
            languages: [],
            skills: collabStatus?.collaborationInterests || [],
            twitter_url: "",
            linkedin_url: "",
            github_url: "",
            website_url: "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // Load user stats
  useEffect(() => {
    const loadUserStats = async () => {
      if (authLoading || !user) {
        setLoadingStats(false);
        return;
      }

      try {
        setLoadingStats(true);
        const learningSupabase = createLearningClient();
        if (!learningSupabase) {
          setLoadingStats(false);
          return;
        }

        // Get enrolled classes count
        const { count: classesCount } = await learningSupabase
          .from("class_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "active");

        // Get workshop attendance count (workshops where user actually attended)
        const { count: workshopsCount } = await learningSupabase
          .from("workshop_attendance")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Get projects count (projects created by user or where user is a member)
        const { data: projectMembers } = await learningSupabase
          .from("project_members")
          .select("project_id")
          .eq("user_id", user.id);
        
        const projectMemberIds = new Set(projectMembers?.map((pm) => pm.project_id) || []);
        
        const { data: createdProjects } = await learningSupabase
          .from("projects")
          .select("id")
          .eq("created_by", user.id);
        
        createdProjects?.forEach((p) => projectMemberIds.add(p.id));
        
        const projectsCount = projectMemberIds.size;

        setUserStats({
          classesCount: classesCount || 0,
          workshopsCount: workshopsCount || 0,
          projectsCount: projectsCount || 0,
        });
      } catch (error) {
        console.error("Error loading user stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadUserStats();
  }, [user, authLoading]);

  // Load workshop attendance
  useEffect(() => {
    const loadAttendance = async () => {
      if (authLoading || !user) {
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

        // Get workshop attendance with workshop details
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
          .eq("user_id", user.id)
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
  }, [user, authLoading]);

  // Load badge and achievement stats
  useEffect(() => {
    const loadBadgeStats = async () => {
      if (authLoading || !user) {
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
        const badges = await getUserBadges(learningSupabase, user.id);
        const badgesCount = badges.length;

        // Get featured badges (top 3 most recent, with image if available)
        // First try to get badges with images, then fill with others
        const badgesWithImages = badges.filter((b: any) => b.metadata?.badge_image_url);
        const otherBadges = badges.filter((b: any) => !b.metadata?.badge_image_url);
        
        // Sort by earned_at (most recent first)
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

        // Get achievements count (missions completed)
        const { count: achievementsCount } = await learningSupabase
          .from("mission_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
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
  }, [user, authLoading]);

  // Load user teams
  useEffect(() => {
    const loadUserTeams = async () => {
      if (authLoading || !user) {
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

        // Get teams the user is a member of
        const { data: teamMembersData, error } = await learningSupabase
          .from("team_members")
          .select(`
            teams(id, name, avatar)
          `)
          .eq("user_id", user.id);

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
  }, [user, authLoading]);

  // Load user projects
  useEffect(() => {
    const loadUserProjects = async () => {
      if (authLoading || !user) {
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

        // Get projects where user is a member
        const { data: projectMembers } = await learningSupabase
          .from("project_members")
          .select("project_id")
          .eq("user_id", user.id);
        
        const projectMemberIds = new Set(projectMembers?.map((pm) => pm.project_id) || []);
        
        // Get projects created by user
        const { data: createdProjects } = await learningSupabase
          .from("projects")
          .select("id")
          .eq("created_by", user.id);
        
        createdProjects?.forEach((p) => projectMemberIds.add(p.id));
        
        // Fetch full project details
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
  }, [user, authLoading]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const email = user.email || '';
      
      // Update user profile (location, languages, social links, etc.)
      const updateSuccess = await updateUserProfile(user.id, {
        username: formData.username || null,
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        bio: formData.bio || null,
        location: formData.location || null,
        languages: formData.languages.length > 0 ? formData.languages : null,
        twitter_url: formData.twitter_url || null,
        linkedin_url: formData.linkedin_url || null,
        github_url: formData.github_url || null,
        website_url: formData.website_url || null,
      }, email, supabase);

      // Update collaboration status (skills/mastery)
      const collaborationSuccess = await updateCollaborationStatus({
        collaborationInterests: formData.skills.length > 0 ? formData.skills : [],
      }, supabase);

      if (updateSuccess && collaborationSuccess && supabase) {
        // Reload profile
        const [updatedProfile, updatedCollaborationStatus] = await Promise.all([
          getUserProfile(user.id, user.email || undefined, supabase),
          getCollaborationStatus(user.id, supabase),
        ]);
        
        // Fetch updated XP
        const { data: updatedUserData } = await supabase
          .from("users")
          .select("xp")
          .eq("id", user.id)
          .maybeSingle();
        
        const updatedXP = (updatedUserData?.xp as number) || 0;
        if (updatedXP > 0) {
          const { getLevel } = await import("@/lib/progress");
          setUserXP(updatedXP);
          setUserLevel(getLevel(updatedXP));
        } else {
          setUserXP(undefined);
          setUserLevel(undefined);
        }
        
        if (updatedProfile) {
          setProfile(updatedProfile);
          setFormData({
            username: updatedProfile.username || "",
            first_name: updatedProfile.first_name || "",
            last_name: updatedProfile.last_name || "",
            bio: updatedProfile.bio || "",
            location: updatedProfile.location || "",
            languages: updatedProfile.languages || [],
            skills: updatedCollaborationStatus?.collaborationInterests || [],
            twitter_url: updatedProfile.twitter_url || "",
            linkedin_url: updatedProfile.linkedin_url || "",
            github_url: updatedProfile.github_url || "",
            website_url: updatedProfile.website_url || "",
          });
        }
        setSuccess(true);
        setIsEditing(false);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Failed to update profile. Please check the browser console for details and try again.");
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setError(`An error occurred: ${error?.message || 'Unknown error'}. Please check the console for details.`);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-20 md:pb-8 max-w-4xl">
        <Card className="p-4 sm:p-5 md:p-6">
          <CardHeader className="p-0 pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl">Please sign in</CardTitle>
            <CardDescription className="text-xs sm:text-sm">You need to be signed in to view your profile.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Button asChild className="text-xs sm:text-sm h-8 sm:h-9 md:h-10 w-full sm:w-auto">
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Merge database profile with auth provider data (auth provider takes precedence for missing fields)
  const displayProfile: UserProfile = {
    id: user.id,
    email: user.email || "",
    // Use database value if available, otherwise fall back to auth provider
    username: profile?.username || user.user_metadata?.username || null,
    first_name: profile?.first_name || user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
    last_name: profile?.last_name || user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
    // Prefer database image_url (user-uploaded) over auth provider avatar
    image_url: profile?.image_url || user.user_metadata?.avatar_url || null,
    bio: profile?.bio || null,
    location: profile?.location || null,
    languages: profile?.languages || null,
    twitter_url: profile?.twitter_url || null,
    linkedin_url: profile?.linkedin_url || null,
    github_url: profile?.github_url || null,
    website_url: profile?.website_url || null,
    created_at: profile?.created_at,
    updated_at: profile?.updated_at,
  };

  // Format XP as earned amount (e.g., "$636")
  const formatXPAsEarned = (xp: number | undefined): string => {
    if (!xp || xp === 0) return "$0";
    return `$${xp.toLocaleString()}`;
  };

  // Get full name
  const fullName = displayProfile.first_name && displayProfile.last_name
    ? `${displayProfile.first_name} ${displayProfile.last_name}`
    : displayProfile.first_name || displayProfile.last_name || "User";

  // Handle share profile
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${fullName}'s Profile`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl pb-20 sm:pb-8">
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isEditing ? (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl md:text-2xl">Edit Profile</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Update your profile information below.
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(false)}
                className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
              >
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {error && (
              <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-200 break-words">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <p className="text-xs sm:text-sm text-green-800 dark:text-green-200">
                  ✅ Profile updated successfully!
                </p>
              </div>
            )}
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Profile Picture</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="relative flex-shrink-0">
                    {(imagePreview || displayProfile.image_url) ? (
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-border">
                        <Image
                          src={imagePreview || displayProfile.image_url || ''}
                          alt="Profile"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                        <span className="text-xl sm:text-2xl font-medium text-muted-foreground">
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="file"
                        id="profile-picture"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !user) return;
                          if (file.size > 5 * 1024 * 1024) {
                            setError('Image size must be less than 5MB');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImagePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                          setUploadingImage(true);
                          setError(null);
                          try {
                            const imageUrl = await uploadProfilePicture(file, user.id, supabase);
                            if (imageUrl) {
                              await updateUserProfile(
                                user.id,
                                { image_url: imageUrl },
                                user.email || '',
                                supabase
                              );
                              const updatedProfile = await getUserProfile(user.id, user.email || undefined, supabase);
                              if (updatedProfile) {
                                setProfile(updatedProfile);
                                setImagePreview(null);
                              }
                            } else {
                              setError('Failed to upload image. Please try again.');
                              setImagePreview(null);
                            }
                          } catch (err) {
                            console.error('Error uploading image:', err);
                            setError('Failed to upload image. Please try again.');
                            setImagePreview(null);
                          } finally {
                            setUploadingImage(false);
                          }
                        }}
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="profile-picture"
                        className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-border rounded-md cursor-pointer hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            <span className="hidden sm:inline">Uploading...</span>
                            <span className="sm:hidden">Uploading</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">{displayProfile.image_url ? 'Change Picture' : 'Upload Picture'}</span>
                            <span className="sm:hidden">{displayProfile.image_url ? 'Change' : 'Upload'}</span>
                          </>
                        )}
                      </label>
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="sm:ml-2 w-full sm:w-auto"
                          onClick={() => setImagePreview(null)}
                          disabled={uploadingImage}
                        >
                          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-0" />
                          <span className="sm:hidden">Cancel</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  JPG, PNG, GIF or WEBP. Max 5MB.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="first_name" className="text-xs sm:text-sm font-medium">
                    First Name
                  </label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    placeholder="Enter your first name"
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="last_name" className="text-xs sm:text-sm font-medium">
                    Last Name
                  </label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    placeholder="Enter your last name"
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="username" className="text-xs sm:text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Enter your username"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="bio" className="text-xs sm:text-sm font-medium">
                  Bio
                </label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="location" className="text-xs sm:text-sm font-medium">
                  Location (Country)
                </label>
                <Select
                  value={formData.location || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, location: value })
                  }
                >
                  <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="languages" className="text-xs sm:text-sm font-medium">
                  Languages
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.languages.map((lang, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {lang}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            languages: formData.languages.filter((_, i) => i !== index),
                          });
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="languages"
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && languageInput.trim()) {
                        e.preventDefault();
                        if (!formData.languages.includes(languageInput.trim())) {
                          setFormData({
                            ...formData,
                            languages: [...formData.languages, languageInput.trim()],
                          });
                          setLanguageInput("");
                        }
                      }
                    }}
                    placeholder="Add a language (press Enter)"
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (languageInput.trim() && !formData.languages.includes(languageInput.trim())) {
                        setFormData({
                          ...formData,
                          languages: [...formData.languages, languageInput.trim()],
                        });
                        setLanguageInput("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label htmlFor="skills" className="text-xs sm:text-sm font-medium">
                  Mastery / Skills
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            skills: formData.skills.filter((_, i) => i !== index),
                          });
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="skills"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && skillInput.trim()) {
                        e.preventDefault();
                        if (!formData.skills.includes(skillInput.trim())) {
                          setFormData({
                            ...formData,
                            skills: [...formData.skills, skillInput.trim()],
                          });
                          setSkillInput("");
                        }
                      }
                    }}
                    placeholder="Add a skill/mastery (press Enter)"
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
                        setFormData({
                          ...formData,
                          skills: [...formData.skills, skillInput.trim()],
                        });
                        setSkillInput("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Social Links Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium">Social Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Twitter/X URL */}
                  <div>
                    <label className="text-xs sm:text-sm text-muted-foreground mb-1.5 block">
                      <div className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        X (Twitter) URL
                      </div>
                    </label>
                    <Input
                      type="url"
                      value={formData.twitter_url}
                      onChange={(e) =>
                        setFormData({ ...formData, twitter_url: e.target.value })
                      }
                      placeholder="https://twitter.com/yourhandle"
                      className="text-xs sm:text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* LinkedIn URL */}
                  <div>
                    <label className="text-xs sm:text-sm text-muted-foreground mb-1.5 block">
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn URL
                      </div>
                    </label>
                    <Input
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) =>
                        setFormData({ ...formData, linkedin_url: e.target.value })
                      }
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="text-xs sm:text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* GitHub URL */}
                  <div>
                    <label className="text-xs sm:text-sm text-muted-foreground mb-1.5 block">
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        GitHub URL
                      </div>
                    </label>
                    <Input
                      type="url"
                      value={formData.github_url}
                      onChange={(e) =>
                        setFormData({ ...formData, github_url: e.target.value })
                      }
                      placeholder="https://github.com/yourusername"
                      className="text-xs sm:text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Website URL */}
                  <div>
                    <label className="text-xs sm:text-sm text-muted-foreground mb-1.5 block">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Personal Website
                      </div>
                    </label>
                    <Input
                      type="url"
                      value={formData.website_url}
                      onChange={(e) =>
                        setFormData({ ...formData, website_url: e.target.value })
                      }
                      placeholder="https://yourwebsite.com"
                      className="text-xs sm:text-sm h-9 sm:h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto min-w-[100px] text-xs sm:text-sm h-9 sm:h-10"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Saving...</span>
                      <span className="sm:hidden">Saving</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                      <span className="hidden sm:inline">Save Changes</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setImagePreview(null);
                    if (profile) {
                      setFormData({
                        username: profile.username || "",
                        first_name: profile.first_name || "",
                        last_name: profile.last_name || "",
                        bio: profile.bio || "",
                        location: profile.location || "",
                        languages: profile.languages || [],
                        skills: [],
                        twitter_url: profile.twitter_url || "",
                        linkedin_url: profile.linkedin_url || "",
                        github_url: profile.github_url || "",
                        website_url: profile.website_url || "",
                      });
                    }
                  }}
                  disabled={saving}
                  className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Profile Header Card */}
          <Card className="mb-8 overflow-hidden">
            <CardContent className="p-0">
              {/* Banner with gradient background */}
              <div className="relative w-full h-32 sm:h-40 bg-gradient-to-r from-transparent to-purple-800/75 rounded-t-lg">
                {/* Header Section with Avatar, Name, Handle, Share Button */}
                <div className="absolute inset-0 flex items-start gap-3 sm:gap-6 pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="flex-shrink-0">
                  {displayProfile.image_url ? (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-border">
                      <Image
                        src={displayProfile.image_url}
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
                  {displayProfile.username && (
                    <div>
                      <p className="text-sm sm:text-base text-muted-foreground">@{displayProfile.username}</p>
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
                    {displayProfile.location ? (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin className="h-5 w-5 flex-shrink-0" />
                        <span>{displayProfile.location}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-muted-foreground/50">
                        <MapPin className="h-5 w-5 flex-shrink-0" />
                        <span>No location set</span>
                      </div>
                    )}
                    {(displayProfile.created_at || user?.created_at) ? (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <UserPlus className="h-5 w-5 flex-shrink-0" />
                        <span>Member since {format(new Date(displayProfile.created_at || user?.created_at || new Date()), "MMM yyyy")}</span>
                      </div>
                    ) : null}
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
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>

                {/* Social Links & Statistics Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 border-b border-border pb-8">
                {/* Social Links */}
                <div className="flex items-center gap-4">
                  {displayProfile.twitter_url && (
                    <a 
                      href={displayProfile.twitter_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {displayProfile.linkedin_url && (
                    <a 
                      href={displayProfile.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {displayProfile.github_url && (
                    <a 
                      href={displayProfile.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {displayProfile.website_url && (
                    <a 
                      href={displayProfile.website_url} 
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
                  {/* Featured Badges Showcase */}
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
                            href="/achievements"
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
                  {/* Achievement Count */}
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
                        No proof of work yet. Attend workshops and complete missions to build your portfolio.
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
                        No activity yet. Your recent activities will appear here.
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
                              {displayProfile.image_url ? (
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border flex-shrink-0">
                                  <Image
                                    src={displayProfile.image_url}
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
                      <Button asChild variant="outline">
                        <Link href="/academy/projects">Browse Projects</Link>
                      </Button>
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
        </>
      )}
    </div>
  );
}
