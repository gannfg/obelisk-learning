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

      try {
        // Initialize auth client (includes Supabase)
        await initializeAuthClient();

        // If user is logged in, sync to Supabase
        if (user) {
          setSyncing(true);
          const success = await syncUserToSupabase();
          setSynced(success);
          setSyncing(false);
          
          if (success) {
            console.log('✅ User synced to Supabase');
          }
        }
      } catch (error) {
        console.error('❌ Sync error:', error);
        setSyncing(false);
      }
    };

    initAndSync();
  }, [user, isLoaded]);

  // This component doesn't render anything, it just handles syncing
  return null;
}

