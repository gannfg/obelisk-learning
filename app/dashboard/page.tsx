"use client";

import { useAuth } from '@/lib/hooks/use-auth';
import { useEffect, useState } from 'react';
import { getUserProfile, UserProfile } from '@/lib/profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileCard } from '@/components/profile-card';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (loading || !user) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      try {
        const userProfile = await getUserProfile(user.id, user.email || undefined);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user, loading]);

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-20 md:pb-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-sm sm:text-base text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-20 md:pb-8">
        <Card className="p-4 sm:p-5 md:p-6">
          <CardHeader className="p-0 pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl">Please sign in</CardTitle>
            <CardDescription className="text-xs sm:text-sm">You need to be signed in to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Button asChild className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 md:h-10">
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-20 md:pb-8">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-medium mb-2">
          Welcome, {profile?.first_name || user.email?.split('@')[0] || 'User'}!
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Manage your courses and track your learning progress.
        </p>
      </div>

      {/* Profile Card */}
      {!loadingProfile && (profile || user) && (
        <div className="mb-4 sm:mb-6 md:mb-8">
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
          />
        </div>
      )}

      {/* My Courses */}
      <Card className="p-4 sm:p-5 md:p-6">
        <CardHeader className="p-0 pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">My Courses</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Continue your learning journey</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-8 sm:py-10 md:py-12 text-center">
            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-4">You haven't enrolled in any courses yet.</p>
            <Button asChild className="text-xs sm:text-sm h-8 sm:h-9 md:h-10">
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

