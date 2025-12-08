/**
 * Server-side Supabase clients for API routes
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Create server-side Supabase client for Auth Supabase
 */
export async function createAuthServerClient() {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL and NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY"
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Create server-side Supabase client for Learning Supabase
 */
export async function createLearningServerClient() {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL and NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY"
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
