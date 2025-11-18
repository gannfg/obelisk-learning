"use client";

import { useUser, useClerk } from '@clerk/nextjs';

// Client-side auth utilities using Clerk
export function useAuth() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();

  const signOut = async () => {
    try {
      await clerk.signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return {
    user,
    loading: !isLoaded,
    initialized: isLoaded,
    signOut,
  };
}

