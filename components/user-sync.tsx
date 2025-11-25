"use client";

import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { updateUserProfile } from '@/lib/profile';
import { createClient } from '@/lib/supabase/client';

export function UserSync() {
  const { user, loading } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const syncUser = async () => {
      if (loading || !user) return;

      try {
        // Sync Supabase Auth user to users table
        const email = user.email || '';
        const success = await updateUserProfile(user.id, {
          email: email,
          username: user.user_metadata?.username || null,
          first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null,
          last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
          image_url: user.user_metadata?.avatar_url || null,
        }, email);

        if (success) {
          console.log('✅ User synced to Supabase users table');
        } else {
          console.warn('⚠️ User sync failed - check console for details');
        }
      } catch (error) {
        console.error('❌ Sync error:', error);
      }
    };

    syncUser();
  }, [user, loading, supabase]);

  // This component doesn't render anything, it just handles syncing
  return null;
}

