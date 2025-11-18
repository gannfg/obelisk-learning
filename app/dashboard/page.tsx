"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { syncUserToSupabase, initializeAuthClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const initAndSync = async () => {
      if (!isLoaded || !user) return;

      setSyncing(true);
      
      try {
        // Try to initialize auth client (but don't block on it)
        // Manual sync will work even if initialization fails
        try {
          await initializeAuthClient();
        } catch (initError) {
          console.warn('⚠️ Auth client initialization warning (sync will still attempt):', initError);
        }

        // Sync user to Supabase with Clerk user data
        // This will use manual sync which works independently
        const success = await syncUserToSupabase(user);
        setSynced(success);
        setSyncing(false);
        
        if (!success) {
          console.warn('⚠️ User sync failed - check console for details');
          console.warn('💡 Make sure NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL and NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY are set in .env.local');
        }
      } catch (error) {
        console.error('❌ Sync error:', error);
        setSyncing(false);
      }
    };

    initAndSync();
  }, [user, isLoaded]);

  if (!isLoaded) {
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
          Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress}!
        </h1>
        <p className="text-muted-foreground">
          Manage your courses and track your learning progress.
        </p>
      </div>

      {/* Sync Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Supabase synchronization status</CardDescription>
        </CardHeader>
        <CardContent>
          {syncing ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Syncing to Supabase...</span>
            </div>
          ) : synced ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>✅ Synced to Supabase</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>⏳ Not synced</span>
            </div>
          )}
        </CardContent>
      </Card>

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

