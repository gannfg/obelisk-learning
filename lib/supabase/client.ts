"use client";

import { createBrowserClient } from "@supabase/ssr";

// Use Auth Supabase for authentication
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY!
  );
}

