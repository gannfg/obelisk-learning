"use client";

import { createBrowserClient } from "@supabase/ssr";

// Learning Supabase: stores courses, modules, lessons, progress, etc.
export function createLearningClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL and NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}


