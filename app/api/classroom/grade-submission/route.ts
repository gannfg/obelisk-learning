import { NextRequest, NextResponse } from "next/server";
import { createLearningServerClient, createAuthServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { gradeSubmission } from "@/lib/classroom";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or instructor
    const authSupabase = await createAuthServerClient();
    const { data: profile } = await authSupabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    const adminEmails = new Set([
      "gany.wicaksono@gmail.com",
      "amirsafruddin99@gmail.com",
    ]);
    const isAdmin = Boolean(profile?.is_admin) || (user.email ? adminEmails.has(user.email) : false);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { submissionId, grade, feedback, status } = body;

    if (!submissionId || grade === undefined || !feedback || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createLearningServerClient();
    const result = await gradeSubmission(
      submissionId,
      grade,
      feedback,
      status,
      user.id,
      supabase
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to grade submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ submission: result });
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

