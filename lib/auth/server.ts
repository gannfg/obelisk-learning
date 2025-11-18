import { auth, clerkClient } from '@clerk/nextjs/server';

// Server-side auth utilities using Clerk
export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }
    
    // Get full user object from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

export async function signOut() {
  try {
    // Clerk handles sign-out through the UserButton component
    // This function is kept for compatibility
    return;
  } catch (error) {
    console.error('Failed to sign out:', error);
  }
}

