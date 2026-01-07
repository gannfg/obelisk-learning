import { NextRequest, NextResponse } from "next/server";
import { createLearningServerClient } from "@/lib/supabase/server";
import { createAuthServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const learningSupabase = await createLearningServerClient();
    const { data: adminCheck } = await learningSupabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminCheck?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, isMentor } = body;

    if (!userId || typeof isMentor !== "boolean") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Get user email from Auth Supabase
    const authSupabase = await createAuthServerClient();
    const { data: authUserProfile, error: profileError } = await authSupabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (profileError || !authUserProfile?.email) {
      console.error("Error fetching user email:", profileError);
      return NextResponse.json(
        {
          error: "Failed to fetch user email",
          details: profileError?.message || "User not found in Auth Supabase",
        },
        { status: 400 }
      );
    }

    // Check if user already exists in Learning Supabase to preserve admin status
    const { data: existingUser } = await learningSupabase
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .single();

    // Use upsert to create or update user
    const { error } = await learningSupabase
      .from("users")
      .upsert(
        {
          id: userId,
          email: authUserProfile.email,
          is_mentor: isMentor,
          is_admin: existingUser?.is_admin || false, // Preserve existing admin status
        },
        {
          onConflict: "id",
        }
      );

    if (error) {
      console.error("Error updating mentor role:", error);
      return NextResponse.json(
        {
          error: "Failed to update mentor role",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in mentor role update API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

