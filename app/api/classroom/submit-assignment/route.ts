import { NextRequest, NextResponse } from "next/server";
import { createLearningServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { submitAssignment } from "@/lib/classroom";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { assignmentId, classId, submission } = body;

    if (!assignmentId || !classId || !submission) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createLearningServerClient();
    const result = await submitAssignment(
      assignmentId,
      user.id,
      classId,
      submission,
      supabase
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to submit assignment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ submission: result });
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

