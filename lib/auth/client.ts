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
    // If Clerk user is provided, try manual sync first (works independently of auth client init)
    if (clerkUser) {
      console.log('🔄 Attempting to sync user to Supabase...', {
        userId: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.primaryEmailAddress?.emailAddress
      });
      
      // Manual sync works directly with Supabase, doesn't need auth client to be fully initialized
      const manualSyncResult = await syncClerkUserManually(clerkUser);
      if (manualSyncResult) {
        return true;
      }
      
      // Manual sync failed - log why and try fallback
      console.warn('⚠️ Manual sync failed. Checking environment variables and Supabase connection...');
      
      // Check if env vars are set
      if (!LANTAIDUA_SUPABASE_URL || !LANTAIDUA_SUPABASE_ANON_KEY) {
        console.error('❌ Missing Supabase environment variables:');
        console.error('   - NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL:', LANTAIDUA_SUPABASE_URL ? '✅ Set' : '❌ Missing');
        console.error('   - NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY:', LANTAIDUA_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
        return false;
      }
      
      // Try to ensure initialization if not done yet (for fallback method)
      if (!isInitialized || !supabaseInitialized) {
        console.log('🔄 Attempting to initialize auth client as fallback...');
        try {
          await initializeAuthClient();
        } catch (initError) {
          console.warn('⚠️ Auth client initialization failed (this is okay, manual sync was already attempted):', initError);
        }
      }
      
      // Fallback: Try using the auth client's method (library might get user from session)
      if (isInitialized && supabaseInitialized) {
        try {
          if (typeof authClient.connectClerkUserToSupabase === 'function') {
            await authClient.connectClerkUserToSupabase('users');
            console.log('✅ User synced to lantaidua-universal-auth Supabase (via authClient fallback)');
            return true;
          }
        } catch (error) {
          console.warn('⚠️ authClient sync method also failed');
        }
      }
      
      console.error('❌ All sync methods failed. Please check:');
      console.error('   1. Supabase environment variables are set in .env.local');
      console.error('   2. Supabase users table exists and has correct schema');
      console.error('   3. RLS policies allow inserts/updates');
      console.error('   4. Browser console for detailed error messages above');
      return false;
    }

    // If no user provided, we can't sync
    console.warn('⚠️ No user data provided for sync');
    return false;
  } catch (error) {
    console.error('❌ Failed to sync user to Supabase:', error);
    return false;
  }
}

// Manual sync function as fallback - directly inserts user into Supabase
// This works independently and doesn't require auth client to be initialized
export async function syncClerkUserManually(clerkUser: any) {
  try {
    // Check if we have Supabase credentials
    if (!LANTAIDUA_SUPABASE_URL || !LANTAIDUA_SUPABASE_ANON_KEY) {
      console.error('❌ Supabase credentials not configured for manual sync');
      return false;
    }

    // Always use direct Supabase client for manual sync (more reliable)
    // This ensures it works even if authClient isn't fully initialized
    const { createClient } = await import('@supabase/supabase-js');
    const directClient = createClient(
      LANTAIDUA_SUPABASE_URL,
      LANTAIDUA_SUPABASE_ANON_KEY
    );
    
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                  clerkUser.primaryEmailAddress?.emailAddress || 
                  '';
    
    if (!email) {
      console.error('❌ No email found in Clerk user data');
      return false;
    }

    const { data, error } = await directClient
      .from('users')
      .upsert({
        id: clerkUser.id,
        email: email,
        username: clerkUser.username || null,
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
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    console.log('✅ User synced to Supabase manually (direct client)', {
      userId: clerkUser.id,
      email: email,
      username: clerkUser.username || 'N/A'
    });
    return true;
  } catch (error: any) {
    console.error('❌ Manual sync error:', error);
    console.error('Error stack:', error?.stack);
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

