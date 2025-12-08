import { createAuthServerClient } from "@/lib/supabase/server";

// Server-side auth utilities using Supabase
export async function getCurrentUser() {
  try {
    const supabase = await createAuthServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

export async function signOut() {
  try {
    const supabase = await createAuthServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Failed to sign out:', error);
  }
}

