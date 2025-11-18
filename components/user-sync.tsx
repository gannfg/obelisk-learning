"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { syncUserToSupabase, initializeAuthClient } from '@/lib/auth/client';

export function UserSync() {
  const { user, isLoaded } = useUser();
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const initAndSync = async () => {
      if (!isLoaded) return;

      // If user is logged in, sync to Supabase with Clerk user data
      if (user) {
        setSyncing(true);
        
        try {
          // Try to initialize auth client (but don't block on it)
          // Manual sync will work even if initialization fails
          try {
            await initializeAuthClient();
          } catch (initError) {
            console.warn('⚠️ Auth client initialization warning (sync will still attempt):', initError);
          }

          // Pass Clerk user data directly to sync function
          // This will use manual sync which works independently
          const success = await syncUserToSupabase(user);
          setSynced(success);
          setSyncing(false);
          
          if (success) {
            console.log('✅ User synced to Supabase');
          } else {
            console.warn('⚠️ User sync failed - check console for details');
          }
        } catch (error) {
          console.error('❌ Sync error:', error);
          setSyncing(false);
        }
      }
    };

    initAndSync();
  }, [user, isLoaded]);

  // This component doesn't render anything, it just handles syncing
  return null;
}

