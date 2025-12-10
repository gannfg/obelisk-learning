"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useEffect, useState } from "react";
import { ProfileCard } from "@/components/profile-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { uploadProfilePicture } from "@/lib/storage";
import { Loader2, Save, ArrowLeft, Upload, X, BookOpen, Calendar, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
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
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({
    classesCount: 0,
    workshopsCount: 0,
    projectsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userProfile = await getUserProfile(user.id, user.email || undefined, supabase);
        
        if (userProfile) {
          setProfile(userProfile);
          setFormData({
            username: userProfile.username || "",
            first_name: userProfile.first_name || "",
            last_name: userProfile.last_name || "",
            bio: userProfile.bio || "",
          });
        } else {
          // If no profile exists, initialize with Supabase Auth user data
          setFormData({
            username: user.user_metadata?.username || "",
            first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || "",
            last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
            bio: "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, authLoading, supabase]);

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

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const email = user.email || '';
      const updateSuccess = await updateUserProfile(user.id, {
        username: formData.username || null,
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        bio: formData.bio || null,
      }, email, supabase);

      if (updateSuccess) {
        // Reload profile
        const updatedProfile = await getUserProfile(user.id, user.email || undefined, supabase);
        if (updatedProfile) {
          setProfile(updatedProfile);
          setFormData({
            username: updatedProfile.username || "",
            first_name: updatedProfile.first_name || "",
            last_name: updatedProfile.last_name || "",
            bio: updatedProfile.bio || "",
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
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
    created_at: profile?.created_at,
    updated_at: profile?.updated_at,
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Profile</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Manage your profile information and preferences.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Profile Card View */}
          {!isEditing && (
            <div className="mb-6">
              <ProfileCard profile={displayProfile} showEditButton={false} />
            </div>
          )}

          {/* User Stats */}
          {!isEditing && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Your learning and participation statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{userStats.classesCount}</p>
                        <p className="text-sm text-muted-foreground">Classes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{userStats.workshopsCount}</p>
                        <p className="text-sm text-muted-foreground">Workshops Attended</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <FolderKanban className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{userStats.projectsCount}</p>
                        <p className="text-sm text-muted-foreground">Projects</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{isEditing ? "Edit Profile" : "Profile Information"}</CardTitle>
                  <CardDescription>
                    {isEditing
                      ? "Update your profile information below."
                      : "View and edit your profile information."}
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}
              
              {/* Success Message */}
              {success && (
                <div className="mb-4 p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ Profile updated successfully!
                  </p>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-6">
                  {/* Profile Picture Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {(imagePreview || displayProfile.image_url) ? (
                          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border">
                            <Image
                              src={imagePreview || displayProfile.image_url || ''}
                              alt="Profile"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                            <span className="text-2xl font-medium text-muted-foreground">
                              {user.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
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
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md cursor-pointer hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              {displayProfile.image_url ? 'Change Picture' : 'Upload Picture'}
                            </>
                          )}
                        </label>
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2"
                            onClick={() => setImagePreview(null)}
                            disabled={uploadingImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, GIF or WEBP. Max 5MB.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="first_name" className="text-sm font-medium">
                        First Name
                      </label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData({ ...formData, first_name: e.target.value })
                        }
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="last_name" className="text-sm font-medium">
                        Last Name
                      </label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData({ ...formData, last_name: e.target.value })
                        }
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium">
                      Username
                    </label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="Enter your username"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="flex w-full border-b border-border bg-transparent px-0 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-40 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="min-w-[100px]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
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
                          });
                        }
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        First Name
                      </p>
                      <p className="text-sm">
                        {displayProfile.first_name || "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Last Name
                      </p>
                      <p className="text-sm">
                        {displayProfile.last_name || "Not set"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Username
                    </p>
                    <p className="text-sm">
                      {displayProfile.username ? `@${displayProfile.username}` : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Bio
                    </p>
                    <p className="text-sm">
                      {displayProfile.bio || "No bio added yet."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

