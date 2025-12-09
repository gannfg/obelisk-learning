import { createClient } from '@/lib/supabase/client';

// Auth client configuration using Supabase
const OBELISK_LEARNING_AUTH_SUPABASE_URL = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL || '';
const OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY || '';

// Initialize the auth client (Supabase-based)
let isInitialized = false;

export async function initializeAuthClient() {
  // Check if already initialized
  if (isInitialized) {
    return;
  }

  if (!OBELISK_LEARNING_AUTH_SUPABASE_URL || !OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY) {
    console.warn('Supabase auth credentials are not set. Please set NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL and NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY in your .env.local file.');
    return;
  }

  try {
    // Initialize Supabase client
    const supabase = createClient();
    if (!supabase) {
      console.warn('Supabase client is null. Auth initialization skipped.');
      return;
    }
    
    // Check if we can connect
    const { data: { user } } = await supabase.auth.getUser();
    
    isInitialized = true;
    console.log('✅ Supabase auth client initialized');
  } catch (error) {
    console.error('Failed to initialize auth client:', error);
    throw error;
  }
}

// Function to sync user to Supabase (for compatibility with existing code)
export async function syncUserToSupabase(user?: any) {
  try {
    if (!user) {
      console.warn('⚠️ No user data provided for sync');
      return false;
    }

    const supabase = createClient();
    if (!supabase) {
      console.warn('⚠️ Supabase client is null');
      return false;
    }
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      console.warn('⚠️ No authenticated user found');
      return false;
    }

    // User is already synced via Supabase Auth
    // This function is kept for compatibility
    console.log('✅ User is already synced via Supabase Auth');
    return true;
  } catch (error) {
    console.error('❌ Failed to sync user to Supabase:', error);
    return false;
  }
}

// Manual sync function (for compatibility)
export async function syncClerkUserManually(clerkUser: any) {
  // This function is deprecated - using Supabase Auth instead
  console.warn('⚠️ syncClerkUserManually is deprecated. Using Supabase Auth instead.');
  return false;
}

// Get the current environment
export function getAuthEnvironment(): 'dev' | 'staging' | 'prod' {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
  const nodeEnv = process.env.NODE_ENV;
  
  if (appEnv === 'prod' || nodeEnv === 'production') return 'prod';
  if (appEnv === 'staging') return 'staging';
  return 'dev';
}

// Check if client is initialized
export function isAuthClientInitialized(): boolean {
  return isInitialized;
}

// Get the auth client instance (returns Supabase client)
export function getAuthClient() {
  if (!isInitialized) {
    throw new Error('Auth client is not initialized. Call initializeAuthClient() first.');
  }
  return createClient();
}

// Mock authClient object for compatibility
export const authClient = {
  authClientInitialized: false,
  getEnvironment: () => getAuthEnvironment(),
  createAuthClient: async () => {
    await initializeAuthClient();
  },
  createSupabaseClient: () => {
    return createClient();
  },
  connectClerkUserToSupabase: async () => {
    console.warn('⚠️ connectClerkUserToSupabase is deprecated. Using Supabase Auth instead.');
  },
};
