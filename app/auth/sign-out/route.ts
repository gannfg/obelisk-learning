import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    console.error('Sign out error:', error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/`);
  }
}

