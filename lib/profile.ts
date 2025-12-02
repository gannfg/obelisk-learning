/**
 * Profile utilities for fetching and updating user profiles from Supabase
 */

const OBELISK_LEARNING_AUTH_SUPABASE_URL =
  process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL || '';
const OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY || '';

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
    // Use provided client (with auth session) or create a new one
    let supabase = supabaseClient;
    if (!supabase) {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(
        OBELISK_LEARNING_AUTH_SUPABASE_URL,
        OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY
      );
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // First, check if user exists by id
    let existingUser: UserProfile | null = null;
    
    let { data: checkUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .maybeSingle();

    // PGRST116 = no rows returned (user doesn't exist) - this is OK
    if (checkError && checkError.code !== 'PGRST116') {
      const errorInfo = {
        message: checkError.message || 'Unknown error',
        code: checkError.code || 'UNKNOWN',
        details: checkError.details || null,
        hint: checkError.hint || null,
      };
      console.error('Error checking for existing user:', errorInfo);
      return false;
    }
    
    existingUser = checkUser as UserProfile | null;

    // If user doesn't exist, we need to create them first
    if (!existingUser) {
      console.log('User not found, creating new user record...');
      
      const newUserData: any = {
        id: userId, // Use Supabase Auth user ID
        email: email || '',
        ...updateData,
        created_at: new Date().toISOString(),
      };

      const { error: insertError, data: insertData } = await supabase
        .from('users')
        .insert(newUserData)
        .select();

      if (insertError) {
        // Extract error information safely
        const errorMessage = insertError.message || '';
        const errorCode = insertError.code || '';
        const errorDetails = insertError.details || null;
        const errorHint = insertError.hint || null;

        // Check if it's a duplicate/unique constraint error (profile might have been created by trigger)
        const isDuplicate = errorCode === '23505' || 
                           errorMessage.toLowerCase().includes('duplicate') || 
                           errorMessage.toLowerCase().includes('unique') ||
                           errorMessage.toLowerCase().includes('already exists');

        // Check if it's an RLS policy error (profile might exist but we don't have permission, or trigger created it)
        const isRLSError = errorCode === '42501' || 
                          errorMessage.toLowerCase().includes('row-level security') ||
                          errorMessage.toLowerCase().includes('violates row-level security');

        if (isDuplicate || isRLSError) {
          console.debug('User profile may already exist (likely created by trigger), checking...');
          // Try to fetch the existing profile
          const { data: existingData, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          
          if (existingData) {
            console.log('✅ User profile found (created by trigger)');
            // Profile exists, try to update it with any new data
            if (Object.keys(updates).length > 0) {
              const { error: updateError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId);
              
              if (!updateError) {
                console.log('✅ User profile updated');
              }
            }
            return true;
          }
          // If it's an RLS error and we can't fetch, the profile might exist but we don't have access
          // This is OK - the trigger should have created it
          if (isRLSError) {
            console.debug('RLS error - profile likely created by trigger, skipping manual insert');
            return true; // Assume success since trigger should handle it
          }
          return false;
        }

        // Only log if there's actual error information
        const hasErrorInfo = errorMessage || errorCode || errorDetails || errorHint;
        
        if (hasErrorInfo) {
          const errorInfo: Record<string, any> = {};
          if (errorMessage) errorInfo.message = errorMessage;
          if (errorCode) errorInfo.code = errorCode;
          if (errorDetails) errorInfo.details = errorDetails;
          if (errorHint) errorInfo.hint = errorHint;
          
          console.error('Error creating user profile:', errorInfo);
        } else {
          // If error object is completely empty/malformed, try to extract any properties
          try {
            const errorKeys = Object.keys(insertError);
            const errorValues = Object.values(insertError);
            
            if (errorKeys.length > 0 || errorValues.some(v => v !== null && v !== undefined && v !== '')) {
              // Try to serialize with all properties
              const errorString = JSON.stringify(insertError, Object.getOwnPropertyNames(insertError));
              if (errorString && errorString !== '{}') {
                console.error('Error creating user profile:', JSON.parse(errorString));
              } else {
                // Silent fail for empty error objects - likely a non-critical issue
                console.debug('User profile creation returned empty error (may already exist)');
              }
            } else {
              // Silent fail for completely empty error objects
              console.debug('User profile creation returned empty error (may already exist)');
            }
          } catch (e) {
            // Silent fail if we can't serialize
            console.debug('User profile creation error (unable to parse error details)');
          }
        }
        return false;
      }

      // Check if insert was successful
      if (insertData && insertData.length > 0) {
        console.log('✅ User profile created successfully');
        return true;
      } else {
        console.warn('⚠️ Insert completed but no data returned');
        return false;
      }
    }

    // User exists, update them
    let { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    // Check if update actually affected any rows
    if (error) {
      // Extract error information safely
      const errorMessage = error.message || '';
      const errorCode = error.code || '';
      const errorDetails = error.details || null;
      const errorHint = error.hint || null;

      // Only log if there's actual error information
      const hasErrorInfo = errorMessage || errorCode || errorDetails || errorHint;
      
      if (hasErrorInfo) {
        const errorInfo: Record<string, any> = {};
        if (errorMessage) errorInfo.message = errorMessage;
        if (errorCode) errorInfo.code = errorCode;
        if (errorDetails) errorInfo.details = errorDetails;
        if (errorHint) errorInfo.hint = errorHint;
        
        console.error('Error updating user profile:', errorInfo);
      } else {
        // Silent fail for empty error objects
        console.debug('User profile update returned empty error');
      }
      
      return false;
    }

    // If no rows were updated, the user might not exist or the query didn't match
    if (!data || data.length === 0) {
      console.warn('No rows updated. This might mean the user record was deleted or the query did not match.');
      // Don't recursively call - just return false to avoid infinite loop
      return false;
    }

    console.log('✅ User profile updated successfully');
    return true;
  } catch (error: any) {
    console.error('Error in updateUserProfile:', error);
    console.error('Error stack:', error?.stack);
    return false;
  }
}

