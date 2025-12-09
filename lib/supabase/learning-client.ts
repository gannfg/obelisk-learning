"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Learning Supabase: stores courses, modules, lessons, progress, etc.
export function createLearningClient(): SupabaseClient<any> | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL and NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY"
    );
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}


