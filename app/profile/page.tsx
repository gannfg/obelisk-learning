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

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const email = user.email || '';
      
      // Update user profile (location, languages, etc.)
      const updateSuccess = await updateUserProfile(user.id, {
        username: formData.username || null,
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        bio: formData.bio || null,
        location: formData.location || null,
        languages: formData.languages.length > 0 ? formData.languages : null,
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
    created_at: profile?.created_at,
    updated_at: profile?.updated_at,
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-4xl pb-20 sm:pb-8">
      <div className="mb-6 sm:mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-3 sm:mb-4 text-xs sm:text-sm h-8 sm:h-9">
          <Link href="/dashboard">
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">Profile</h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          Manage your profile information and preferences.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Profile Card View */}
          {!isEditing && (
            <div className="mb-4 sm:mb-6">
              <ProfileCard 
                profile={displayProfile} 
                showEditButton={false} 
                collaborationStatus={collaborationStatus}
                xp={userXP}
                level={userLevel}
              />
            </div>
          )}

          {/* User Stats */}
          {!isEditing && (
            <Card className="mb-4 sm:mb-6">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Activity Overview</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your learning and participation statistics</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {loadingStats ? (
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                      <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl sm:text-2xl font-bold">{userStats.classesCount}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Classes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                      <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl sm:text-2xl font-bold">{userStats.workshopsCount}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">Workshops Attended</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                      <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl sm:text-2xl font-bold">{userStats.projectsCount}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Projects</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Edit Form */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">{isEditing ? "Edit Profile" : "Profile Information"}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {isEditing
                      ? "Update your profile information below."
                      : "View and edit your profile information."}
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10">
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {/* Error Message */}
              {error && (
                <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs sm:text-sm text-red-800 dark:text-red-200 break-words">{error}</p>
                </div>
              )}
              
              {/* Success Message */}
              {success && (
                <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <p className="text-xs sm:text-sm text-green-800 dark:text-green-200">
                    ✅ Profile updated successfully!
                  </p>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Profile Picture Upload */}
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

                              // Validate file size (5MB max)
                              if (file.size > 5 * 1024 * 1024) {
                                setError('Image size must be less than 5MB');
                                return;
                              }

                              // Create preview
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setImagePreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);

                              // Upload to Supabase Storage
                              setUploadingImage(true);
                              setError(null);
                              try {
                                const imageUrl = await uploadProfilePicture(file, user.id, supabase);
                                if (imageUrl) {
                                  // Update profile with new image URL
                                  await updateUserProfile(
                                    user.id,
                                    { image_url: imageUrl },
                                    user.email || '',
                                    supabase
                                  );
                                  // Reload profile
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
                            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-border rounded-md cursor-pointer hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
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
                        // Reset form data to current profile
                        if (profile) {
                          setFormData({
                            username: profile.username || "",
                            first_name: profile.first_name || "",
                            last_name: profile.last_name || "",
                            bio: profile.bio || "",
                            location: profile.location || "",
                            languages: profile.languages || [],
                            skills: [], // Will be loaded separately from collaboration status
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
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                        First Name
                      </p>
                      <p className="text-xs sm:text-sm break-words">
                        {displayProfile.first_name || "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                        Last Name
                      </p>
                      <p className="text-xs sm:text-sm break-words">
                        {displayProfile.last_name || "Not set"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                      Username
                    </p>
                    <p className="text-xs sm:text-sm break-words">
                      {displayProfile.username ? `@${displayProfile.username}` : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                      Bio
                    </p>
                    <p className="text-xs sm:text-sm break-words whitespace-pre-wrap">
                      {displayProfile.bio || "No bio added yet."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proof of Attendance Section */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Proof of Attendance</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Workshops you&apos;ve attended and verified
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {loadingAttendance ? (
                <div className="text-center py-6 sm:py-8">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : attendedWorkshops.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-xs sm:text-sm text-muted-foreground px-2">
                    No workshop attendance records yet. Attend a workshop and check in to see your proof of attendance here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {attendedWorkshops.map((attendance: any) => {
                    const workshop = attendance.workshops;
                    if (!workshop) return null;

                    return (
                      <div
                        key={attendance.id}
                        className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                              <h4 className="font-semibold text-sm sm:text-base line-clamp-2 break-words">
                                {workshop.title || "Workshop"}
                              </h4>
                              <span className="px-1.5 sm:px-2 py-0.5 bg-green-500/10 text-green-600 text-[10px] sm:text-xs font-medium rounded whitespace-nowrap">
                                Verified
                              </span>
                            </div>
                            <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-start sm:items-center gap-1.5 sm:gap-2">
                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                                <span className="break-words">
                                  {format(new Date(workshop.datetime), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                              </div>
                              <div className="flex items-start sm:items-center gap-1.5 sm:gap-2">
                                {workshop.location_type === "online" ? (
                                  <>
                                    <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                                    <span>Online</span>
                                  </>
                                ) : (
                                  <>
                                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                                    <span className="break-words">
                                      {workshop.venue_name || "Offline"}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex flex-wrap items-start sm:items-center gap-1 sm:gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                                <span className="break-words">
                                  Checked in: {format(new Date(attendance.checkin_time), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                                <span className="text-[10px] sm:text-xs whitespace-nowrap">
                                  ({attendance.method === "qr" ? "QR Code" : "Manual"})
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                          >
                            <Link href={`/workshops/${workshop.id}`}>
                              <span className="hidden sm:inline">View Workshop</span>
                              <span className="sm:hidden">View</span>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

