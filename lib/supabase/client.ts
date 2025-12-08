"use client";

import { createBrowserClient } from "@supabase/ssr";

// Use Superteam Study Auth Supabase for authentication
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL and NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

