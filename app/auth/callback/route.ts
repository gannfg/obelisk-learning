import { createAuthServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createAuthServerClient();
    const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    // Create user profile if it doesn't exist
    if (user && !authError) {
      try {
        await supabase
          .from("users")
          .upsert({
            id: user.id,
            email: user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "id"
          });
      } catch (profileError) {
        console.error("Profile creation error in callback:", profileError);
        // Don't fail the callback if profile creation fails
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}

