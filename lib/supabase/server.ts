import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Use Obelisk Learning Auth Supabase for authentication
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY!,
    {
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
    }
  );
}

// Learning Supabase: Server-side client for courses, modules, lessons, etc.
// This doesn't need cookies since it's for public data
export function createLearningServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL and NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY"
    );
  }

  // Use createClient for server-side (no cookies needed for public data)
  return createSupabaseClient(supabaseUrl, supabaseKey);
}

