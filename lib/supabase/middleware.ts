import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Use Auth Supabase for authentication
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY;

  // Check if environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing Supabase environment variables!\n" +
      "Please set NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL and " +
      "NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY in your .env.local file.\n" +
      "See .env.example for reference."
    );
    // Return response without Supabase client - app will work but auth won't
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser();

  return supabaseResponse;
}

