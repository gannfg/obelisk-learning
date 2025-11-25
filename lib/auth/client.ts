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

    // Try new schema first (with clerk_user_id column)
    // If that fails, fall back to old schema (id as TEXT)
    let existingUser: any = null;
    let useNewSchema = true;

    // Check if clerk_user_id column exists by trying to query it
    try {
      const { data: checkUser, error: checkError } = await directClient
        .from('users')
        .select('id, clerk_user_id')
        .eq('clerk_user_id', clerkUser.id)
        .maybeSingle();
      
      if (checkError) {
        // If error suggests column doesn't exist, use old schema
        if (checkError.code === '42703' || checkError.message?.includes('column') || checkError.message?.includes('clerk_user_id')) {
          console.log('📋 clerk_user_id column not found, using legacy schema (id as TEXT)');
          useNewSchema = false;
        } else {
          // Other error - might be that user doesn't exist, which is fine
          console.log('ℹ️ No existing user found by clerk_user_id');
        }
      } else {
        existingUser = checkUser;
      }
    } catch (error: any) {
      // If query fails due to missing column, use old schema
      if (error?.code === '42703' || error?.message?.includes('column') || error?.message?.includes('clerk_user_id')) {
        console.log('📋 clerk_user_id column not found, using legacy schema (id as TEXT)');
        useNewSchema = false;
      } else {
        // Other error - log but continue
        console.warn('⚠️ Error checking for existing user:', error);
      }
    }

    // Prepare user data
    const userData: any = {
      email: email,
      username: clerkUser.username || null,
      first_name: clerkUser.firstName || null,
      last_name: clerkUser.lastName || null,
      image_url: clerkUser.imageUrl || null,
      updated_at: new Date().toISOString(),
    };

    let upsertError: any = null;

    if (useNewSchema) {
      // New schema: id is UUID, clerk_user_id stores Clerk ID
      userData.clerk_user_id = clerkUser.id;
      
      // If user exists, use their existing UUID id
      if (existingUser?.id) {
        userData.id = existingUser.id;
      } else {
        // Generate UUID for new user
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          userData.id = crypto.randomUUID();
        } else {
          // Fallback UUID v4 generator
          userData.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
        userData.created_at = new Date().toISOString();
      }

      const { data, error } = await directClient
        .from('users')
        .upsert(userData, {
          onConflict: 'clerk_user_id'
        });

      upsertError = error;
      
      // If conflict resolution fails, try by email as fallback
      if (error && (error.code === '23505' || error.message?.includes('unique') || error.code === '42703')) {
        console.log('⚠️ Upsert failed, trying email-based lookup and update...');
        const { data: emailUser } = await directClient
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        
        if (emailUser?.id) {
          userData.id = emailUser.id;
          const { error: updateError } = await directClient
            .from('users')
            .update(userData)
            .eq('id', emailUser.id);
          
          if (updateError) {
            upsertError = updateError;
          } else {
            upsertError = null; // Success
          }
        }
      }
    } else {
      // Legacy schema: Check if id is UUID or TEXT
      // Try to find existing user by email first to determine schema
      const { data: emailUser } = await directClient
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (emailUser?.id) {
        // User exists - check if id is UUID format
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(emailUser.id);
        
        if (isUUID) {
          // id is UUID - database expects UUID, not TEXT
          console.log('📋 Database has UUID id column but no clerk_user_id. Using email-based update.');
          userData.id = emailUser.id;
          const { error: updateError } = await directClient
            .from('users')
            .update(userData)
            .eq('id', emailUser.id);
          
          upsertError = updateError;
        } else {
          // id is TEXT - use Clerk ID
          userData.id = clerkUser.id;
          userData.created_at = new Date().toISOString();
          const { data, error } = await directClient
            .from('users')
            .upsert(userData, {
              onConflict: 'id'
            });
          upsertError = error;
        }
      } else {
        // New user - try UUID first (most likely scenario)
        // Generate UUID for id
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          userData.id = crypto.randomUUID();
        } else {
          userData.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
        userData.created_at = new Date().toISOString();

        const { data, error } = await directClient
          .from('users')
          .insert(userData);

        // If UUID insert fails with invalid syntax, try TEXT
        if (error && error.code === '22P02' && error.message?.includes('uuid')) {
          console.log('📋 id column is UUID but we tried TEXT. Database needs migration or different approach.');
          // Try using email as conflict resolution instead
          upsertError = error;
        } else if (error && error.code === '23505') {
          // Unique constraint violation - user might exist, try update by email
          const { data: existingByEmail } = await directClient
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();
          
          if (existingByEmail?.id) {
            const { error: updateError } = await directClient
              .from('users')
              .update(userData)
              .eq('id', existingByEmail.id);
            upsertError = updateError;
          } else {
            upsertError = error;
          }
        } else {
          upsertError = error;
        }
      }
    }

    if (upsertError) {
      console.error('❌ Failed to sync user manually:', upsertError);
      console.error('Error details:', {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint
      });
      
      // If error is about UUID and we're using legacy schema, suggest migration
      if (upsertError.code === '22P02' && upsertError.message?.includes('uuid') && !useNewSchema) {
        console.error('');
        console.error('🔧 SOLUTION: Your database has `id` as UUID type but is missing the `clerk_user_id` column.');
        console.error('   Please run the migration: supabase/auth-schema-migration-clerk-user-id.sql');
        console.error('   This will add the `clerk_user_id` column to properly store Clerk user IDs.');
        console.error('');
      }
      
      return false;
    }

    console.log('✅ User synced to Supabase manually (direct client)', {
      schema: useNewSchema ? 'new (UUID + clerk_user_id)' : 'legacy (TEXT id)',
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

