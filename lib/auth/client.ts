import { authClient } from 'lantaidua-universal-auth';

// Auth client configuration from .env.local
const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const CLERK_DOMAIN = process.env.NEXT_PUBLIC_CLERK_DOMAIN;
const CLERK_IS_SATELLITE = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === 'true';
// Use lantaidua-universal-auth Supabase for user sync
const LANTAIDUA_SUPABASE_URL = process.env.NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL || '';
const LANTAIDUA_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY || '';

// Initialize the auth client (v1.1.0)
let isInitialized = false;
let supabaseInitialized = false;

export async function initializeAuthClient() {
  // Check if already initialized using the latest API
  if (isInitialized || authClient.authClientInitialized) {
    return;
  }

  if (!CLERK_PUBLISHABLE_KEY) {
    console.warn('Clerk publishable key is not set. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env.local file.');
    return;
  }

  try {
    // 1. Initialize Clerk FIRST
    const options: {
      domain?: string;
      isSatellite?: boolean;
      signInUrl?: string;
      signUpUrl?: string;
      afterSignInUrl?: string;
      afterSignUpUrl?: string;
      ssoEnabled?: boolean;
    } = {
      signInUrl: '/auth/sign-in',
      signUpUrl: '/auth/sign-up',
      afterSignInUrl: '/dashboard',
      afterSignUpUrl: '/dashboard',
      ssoEnabled: true,
    };

    // Add optional domain if set
    if (CLERK_DOMAIN) {
      options.domain = CLERK_DOMAIN;
    }

    // Add optional satellite flag if set
    if (CLERK_IS_SATELLITE) {
      options.isSatellite = true;
    }

    // Initialize Clerk using v1.1.0 API
    await authClient.createAuthClient(CLERK_PUBLISHABLE_KEY, options);
    
    // 2. Initialize lantaidua-universal-auth Supabase SECOND (for user sync)
    if (LANTAIDUA_SUPABASE_URL && LANTAIDUA_SUPABASE_ANON_KEY && !supabaseInitialized) {
      try {
        authClient.createSupabaseClient(LANTAIDUA_SUPABASE_URL, LANTAIDUA_SUPABASE_ANON_KEY);
        supabaseInitialized = true;
        console.log('✅ lantaidua-universal-auth Supabase client initialized');
      } catch (supabaseError) {
        console.warn('⚠️ Failed to initialize lantaidua-universal-auth Supabase client:', supabaseError);
      }
    }
    
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize auth client:', error);
    throw error;
  }
}

// Function to sync Clerk user to Supabase
export async function syncUserToSupabase(clerkUser?: any) {
  try {
    if (!isInitialized || !supabaseInitialized) {
      console.warn('Auth client or Supabase not initialized');
      return false;
    }

    // If Clerk user is provided, try manual sync first (more reliable with Clerk OAuth)
    if (clerkUser) {
      // Try manual sync first since it works directly with Clerk user data
      const manualSyncResult = await syncClerkUserManually(clerkUser);
      if (manualSyncResult) {
        return true;
      }
      
      // Fallback: Try using the auth client's method (library might get user from session)
      try {
        if (typeof authClient.connectClerkUserToSupabase === 'function') {
          await authClient.connectClerkUserToSupabase('users');
          console.log('✅ User synced to lantaidua-universal-auth Supabase (via authClient)');
          return true;
        }
      } catch (error) {
        console.warn('⚠️ authClient sync method failed, manual sync already attempted');
      }
      
      return false;
    }

    // Fallback: Check if user has a session via lantaidua-universal-auth
    try {
      const hasSession = await authClient.checkSSOSession?.();
      
      if (hasSession) {
        // Sync user to lantaidua-universal-auth Supabase 'users' table
        await authClient.connectClerkUserToSupabase?.('users');
        console.log('✅ User synced to lantaidua-universal-auth Supabase (via session)');
        return true;
      }
    } catch (sessionError) {
      console.warn('⚠️ Session check failed:', sessionError);
    }
    
    return false;
  } catch (error) {
    console.error('❌ Failed to sync user to Supabase:', error);
    return false;
  }
}

// Manual sync function as fallback - directly inserts user into Supabase
export async function syncClerkUserManually(clerkUser: any) {
  try {
    if (!supabaseInitialized) {
      console.warn('Supabase not initialized for manual sync');
      return false;
    }

    // Get the Supabase client from authClient
    const supabase = (authClient as any).getSupabaseClient?.() || (authClient as any).supabase;
    if (!supabase) {
      console.error('Supabase client not available from authClient');
      // Try creating a direct client as last resort
      const { createClient } = await import('@supabase/supabase-js');
      const directClient = createClient(
        LANTAIDUA_SUPABASE_URL,
        LANTAIDUA_SUPABASE_ANON_KEY
      );
      
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                    clerkUser.primaryEmailAddress?.emailAddress || 
                    '';
      
      const { error } = await directClient
        .from('users')
        .upsert({
          id: clerkUser.id,
          email: email,
          first_name: clerkUser.firstName || null,
          last_name: clerkUser.lastName || null,
          image_url: clerkUser.imageUrl || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('❌ Failed to sync user manually:', error);
        return false;
      }

      console.log('✅ User synced to Supabase manually (direct client)');
      return true;
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                  clerkUser.primaryEmailAddress?.emailAddress || 
                  '';

    const { error } = await supabase
      .from('users')
      .upsert({
        id: clerkUser.id,
        email: email,
        first_name: clerkUser.firstName || null,
        last_name: clerkUser.lastName || null,
        image_url: clerkUser.imageUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('❌ Failed to sync user manually:', error);
      return false;
    }

    console.log('✅ User synced to Supabase manually');
    return true;
  } catch (error) {
    console.error('❌ Manual sync error:', error);
    return false;
  }
}

// Get the current environment
// Uses NEXT_PUBLIC_APP_ENV or NODE_ENV from .env.local
export function getAuthEnvironment(): 'dev' | 'staging' | 'prod' {
  try {
    return authClient.getEnvironment();
  } catch (error) {
    console.error('Failed to get auth environment:', error);
    // Fallback to environment detection
    const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
    const nodeEnv = process.env.NODE_ENV;
    
    if (appEnv === 'prod' || nodeEnv === 'production') return 'prod';
    if (appEnv === 'staging') return 'staging';
    return 'dev';
  }
}

// Check if client is initialized
export function isAuthClientInitialized(): boolean {
  return authClient.authClientInitialized || isInitialized;
}

// Get the auth client instance
export function getAuthClient() {
  if (!isAuthClientInitialized()) {
    throw new Error('Auth client is not initialized. Call initializeAuthClient() first.');
  }
  return authClient;
}

// Export the authClient for direct access if needed
export { authClient };

