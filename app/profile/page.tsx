"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useEffect, useState } from "react";
import { ProfileCard } from "@/components/profile-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/profile";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userProfile = await getUserProfile(user.id, user.email || undefined);
        
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
      }, email);

      if (updateSuccess) {
        // Reload profile
        const updatedProfile = await getUserProfile(user.id, user.email || undefined);
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

  const displayProfile: UserProfile = profile || {
    id: user.id,
    email: user.email || "",
    username: user.user_metadata?.username || null,
    first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
    last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
    image_url: user.user_metadata?.avatar_url || null,
    bio: null,
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-20 md:pb-8 max-w-4xl">
      <div className="mb-4 sm:mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-3 sm:mb-4 text-xs sm:text-sm h-7 sm:h-8 md:h-9">
          <Link href="/dashboard">
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-medium mb-2">Profile</h1>
        <p className="text-muted-foreground">
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

          {/* Edit Form */}
          <Card className="p-4 sm:p-5 md:p-6">
            <CardHeader className="p-0 pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">{isEditing ? "Edit Profile" : "Profile Information"}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {isEditing
                      ? "Update your profile information below."
                      : "View and edit your profile information."}
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="text-xs sm:text-sm h-8 sm:h-9 md:h-10 w-full sm:w-auto">
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
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

