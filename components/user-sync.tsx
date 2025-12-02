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
        // First, check if profile exists and get the synced data
        const { getUserProfile } = await import('@/lib/profile');
        const existingProfile = await getUserProfile(user.id, user.email || undefined, supabase);
        
        // Sync Supabase Auth user to users table
        // Pass the authenticated supabase client so RLS policies work correctly
        const email = user.email || '';
        
        // Build update object - sync from auth provider to database
        const updates: any = {
          email: email, // Always sync email
        };
        
        // Sync username from auth provider if available
        // Only overwrite if profile doesn't have one OR if auth provider has a different one
        if (user.user_metadata?.username) {
          if (!existingProfile?.username || existingProfile.username !== user.user_metadata.username) {
            updates.username = user.user_metadata.username;
          }
        }
        
        // Sync names from auth provider - update if missing or different
        const authFirstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || null;
        const authLastName = user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null;
        
        if (authFirstName && (!existingProfile?.first_name || existingProfile.first_name !== authFirstName)) {
          updates.first_name = authFirstName;
        }
        if (authLastName && (!existingProfile?.last_name || existingProfile.last_name !== authLastName)) {
          updates.last_name = authLastName;
        }
        
        // Sync image_url from auth provider ONLY if profile doesn't have one
        // This preserves user-uploaded profile pictures
        if (!existingProfile?.image_url && user.user_metadata?.avatar_url) {
          updates.image_url = user.user_metadata.avatar_url;
        }
        
        // Only sync if there are updates to make
        if (Object.keys(updates).length > 1 || (updates.email && !existingProfile)) {
          const success = await updateUserProfile(user.id, updates, email, supabase);

          if (success) {
            console.log('✅ User synced to Supabase users table', Object.keys(updates));
          } else {
            console.debug('User sync completed (profile may already exist or sync not needed)');
          }
        } else {
          console.debug('User profile already in sync');
        }
      } catch (error: any) {
        // Extract error information safely
        const errorMessage = error?.message || error?.toString() || 'Unknown sync error';
        const errorCode = error?.code || 'UNKNOWN';
        
        // Only log if it's a real error (not just a duplicate)
        if (errorCode !== '23505') { // 23505 = unique violation (duplicate)
          console.error('❌ Sync error:', {
            message: errorMessage,
            code: errorCode,
            error: error
          });
        } else {
          console.debug('User profile already exists, skipping sync');
        }
      }
    };

    syncUser();
  }, [user, loading, supabase]);

  // This component doesn't render anything, it just handles syncing
  return null;
}

