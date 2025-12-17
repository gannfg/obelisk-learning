import { createClient } from "@supabase/supabase-js";

/**
 * Server-side admin client (service role) for Auth Supabase.
 * Do NOT import into client components.
 */
export function createAuthAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL;
  const serviceRoleKey =
    // Primary (requested) key – note: do not expose service keys to the client
    process.env.NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_SERVICE_KEY ||
    process.env.OBELISK_LEARNING_AUTH_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.OBELISK_LEARNING_SUPABASE_SERVICE_ROLE_KEY || // fallback if only one project uses the same key name
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role env vars. Set NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL and OBELISK_LEARNING_AUTH_SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
