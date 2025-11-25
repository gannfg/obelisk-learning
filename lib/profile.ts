/**
 * Profile utilities for fetching and updating user profiles from Supabase
 */

const LANTAIDUA_SUPABASE_URL = process.env.NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL || '';
const LANTAIDUA_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY || '';

export interface UserProfile {
  id: string;
  clerk_user_id?: string;
  email: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get user profile from Supabase by Supabase Auth user ID or email
 */
export async function getUserProfile(userId: string, email?: string): Promise<UserProfile | null> {
  if (!LANTAIDUA_SUPABASE_URL || !LANTAIDUA_SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(LANTAIDUA_SUPABASE_URL, LANTAIDUA_SUPABASE_ANON_KEY);

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
        console.error('Error fetching user profile:', emailError);
        return null;
      }
      
      data = emailData;
    } else if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user profile:', error);
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
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'clerk_user_id' | 'created_at'>>,
  email?: string
): Promise<boolean> {
  if (!LANTAIDUA_SUPABASE_URL || !LANTAIDUA_SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return false;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(LANTAIDUA_SUPABASE_URL, LANTAIDUA_SUPABASE_ANON_KEY);

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
      console.error('Error checking for existing user:', checkError);
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

      const { error: insertError } = await supabase
        .from('users')
        .insert(newUserData);

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        console.error('Error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        });
        return false;
      }

      console.log('✅ User profile created successfully');
      return true;
    }

    // User exists, update them
    let { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    // Check if update actually affected any rows
    if (error) {
      console.error('Error updating user profile:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      
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

