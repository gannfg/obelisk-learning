/**
 * Profile utilities for fetching and updating user profiles from Supabase
 */

const OBELISK_LEARNING_AUTH_SUPABASE_URL =
  process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL || '';
const OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY || '';

/**
 * Get authenticated Supabase client
 * This ensures we have the user session for RLS policies
 * Uses the SSR client which automatically handles sessions
 */
async function getAuthenticatedClient() {
  // Use the SSR client from lib/supabase/client.ts which handles sessions automatically
  // This works for client-side components
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const client = createClient();
    if (!client) {
      throw new Error('Supabase client is null');
    }
    
    // Verify we have a session
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      console.warn('⚠️ Error checking session:', sessionError);
    }
    if (!session) {
      console.warn('⚠️ No Supabase Auth session found. RLS policies may block operations.');
      console.warn('💡 Make sure the user is authenticated via Supabase Auth before calling this function.');
    }
    
    return client;
  } catch (error) {
    // Fallback to basic client if SSR client is not available (shouldn't happen in client components)
    console.warn('⚠️ Could not use SSR client, falling back to basic client:', error);
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(OBELISK_LEARNING_AUTH_SUPABASE_URL, OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY);
  }
}

export interface UserProfile {
  id: string;
  clerk_user_id?: string;
  email: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  bio?: string | null;
  is_admin?: boolean | null;
  location?: string | null;
  languages?: string[] | null;
  twitter_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  website_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get user profile from Supabase by Supabase Auth user ID or email
 * @param userId - The user ID
 * @param email - User email (optional)
 * @param supabaseClient - Optional authenticated Supabase client (recommended for client-side calls)
 */
export async function getUserProfile(userId: string, email?: string, supabaseClient?: any): Promise<UserProfile | null> {
  if (!OBELISK_LEARNING_AUTH_SUPABASE_URL || !OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  try {
    // Use provided client (with auth session) or create a new one
    let supabase = supabaseClient;
    if (!supabase) {
    const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(OBELISK_LEARNING_AUTH_SUPABASE_URL, OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY);
    }

    // Try to get by id first (Supabase Auth user ID)
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // If that fails and email is provided, try by email
    if (error && email) {
      const { data: emailData, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (emailError) {
        const errorInfo = {
          message: emailError.message || 'Unknown error',
          code: emailError.code || 'UNKNOWN',
          details: emailError.details || null,
          hint: emailError.hint || null,
        };
        console.error('Error fetching user profile by email:', errorInfo);
        return null;
      }
      
      data = emailData;
    } else if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      const errorInfo = {
        message: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN',
        details: error.details || null,
        hint: error.hint || null,
      };
      console.error('Error fetching user profile:', errorInfo);
      return null;
    }

    return data as UserProfile | null;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

/**
 * Update user profile in Supabase
 * @param userId - The user ID
 * @param updates - Profile updates
 * @param email - User email (optional)
 * @param supabaseClient - Optional authenticated Supabase client (recommended for client-side calls)
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'clerk_user_id' | 'created_at'>>,
  email?: string,
  supabaseClient?: any
): Promise<boolean> {
  if (!OBELISK_LEARNING_AUTH_SUPABASE_URL || !OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return false;
  }

  try {
    const supabase = await getAuthenticatedClient();

    // Verify the user is authenticated and the userId matches
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      console.error('❌ User not authenticated via Supabase Auth:', authError);
      console.error('💡 The user must be signed in via Supabase Auth for RLS policies to work.');
      return false;
    }

    // Ensure the userId matches the authenticated user (for security)
    if (authUser.id !== userId) {
      console.error('❌ User ID mismatch. Cannot update profile for different user.');
      console.error(`Authenticated user: ${authUser.id}, Requested user: ${userId}`);
      return false;
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Use upsert to handle both insert and update in one operation
    // This is more efficient and handles race conditions better
    const userData: any = {
      id: userId, // Use Supabase Auth user ID
      email: email || authUser.email || '',
      ...updateData,
    };

    // Only set created_at if this is a new user
    // We'll check if user exists first
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (!existingUser) {
      // New user - set created_at
      userData.created_at = new Date().toISOString();
    }

    // Use upsert with onConflict to handle both insert and update
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('Error upserting user profile:', error);
      const errorDetails: Record<string, any> = {};
      if (error.message) errorDetails.message = error.message;
      if (error.code) errorDetails.code = error.code;
      if (error.details) errorDetails.details = error.details;
      if (error.hint) errorDetails.hint = error.hint;
      if (Object.keys(errorDetails).length > 0) {
        console.error('Error details:', errorDetails);
      } else {
        console.error('Error details:', error);
      }
      
      // If RLS is blocking, provide helpful error message
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        console.error('❌ RLS Policy Error: Make sure the user is authenticated via Supabase Auth and the RLS policy allows this operation.');
        console.error('💡 Tip: The user must exist in auth.users table and be authenticated with a valid session.');
      }
      
      return false;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ Upsert completed but no data returned. This might indicate an RLS policy issue.');
      return false;
    }

    console.log('✅ User profile upserted successfully');
    return true;
  } catch (error: any) {
    console.error('Error in updateUserProfile:', error);
    console.error('Error stack:', error?.stack);
    return false;
  }
}
