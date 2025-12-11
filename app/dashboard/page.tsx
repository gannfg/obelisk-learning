"use client";

import { useAuth } from '@/lib/hooks/use-auth';
import { useEffect, useState } from 'react';
import { getUserProfile, updateUserProfile, UserProfile } from '@/lib/profile';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileCard } from '@/components/profile-card';
import { BookOpen, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const supabase = createClient();

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (loading || !user) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      try {
        // Use authenticated Supabase client for better data access
        const userProfile = await getUserProfile(user.id, user.email || undefined, supabase);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user, loading, supabase]);

  // Handle profile sync from auth provider
  const handleSyncProfile = async () => {
    if (!user) return;

    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      const email = user.email || '';
      
      // Force sync all fields from auth provider
      const updates: any = {
        email: email,
      };

      // Sync username from auth provider
      if (user.user_metadata?.username) {
        updates.username = user.user_metadata.username;
      }

      // Sync names from auth provider
      const authFirstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null;
      const authLastName = user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null;
      
      if (authFirstName) updates.first_name = authFirstName;
      if (authLastName) updates.last_name = authLastName;

      // Only sync image if profile doesn't have one (preserve uploaded pictures)
      if (!profile?.image_url && user.user_metadata?.avatar_url) {
        updates.image_url = user.user_metadata.avatar_url;
      }

      const syncSuccess = await updateUserProfile(user.id, updates, email, supabase);

      if (syncSuccess) {
        // Reload profile
        const updatedProfile = await getUserProfile(user.id, user.email || undefined, supabase);
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      } else {
        setSyncError("Failed to sync profile. Please check the browser console for details.");
      }
    } catch (error: any) {
      console.error("Error syncing profile:", error);
      setSyncError(`Sync error: ${error?.message || 'Unknown error'}. Please check the console for details.`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-base text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Please sign in</CardTitle>
            <CardDescription>You need to be signed in to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Welcome, {profile?.first_name || user.email?.split('@')[0] || 'User'}!
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Manage your classes and track your learning progress.
        </p>
      </div>

      {/* Profile Card */}
      {!loadingProfile && (profile || user) && (
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Profile</h2>
            <Button
              onClick={handleSyncProfile}
              variant="outline"
              size="sm"
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync from Auth
                </>
              )}
            </Button>
          </div>

          {/* Sync Status Messages */}
          {syncSuccess && (
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Profile synced successfully!
              </p>
            </div>
          )}
          
          {syncError && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{syncError}</p>
            </div>
          )}

          <ProfileCard
            profile={
              profile || {
                id: user.id,
                email: user.email || '',
                username: user.user_metadata?.username || null,
                first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
                last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
                image_url: user.user_metadata?.avatar_url || null,
              }
            }
            showEditButton={true}
          />
        </div>
      )}

      {/* My Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">My Classes</CardTitle>
          <CardDescription>Continue your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-base text-muted-foreground mb-4">You haven't enrolled in any classes yet.</p>
            <Button asChild>
              <Link href="/academy">Browse Academy</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

