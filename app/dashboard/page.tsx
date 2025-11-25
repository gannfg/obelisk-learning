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
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Please sign in</CardTitle>
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
    <div className="container mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-medium mb-2">
          Welcome, {profile?.first_name || user.email?.split('@')[0] || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Manage your courses and track your learning progress.
        </p>
      </div>

      {/* Profile Card */}
      {!loadingProfile && (profile || user) && (
        <div className="mb-8">
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
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>Continue your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
            <Button asChild>
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

