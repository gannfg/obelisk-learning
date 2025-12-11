import { NextRequest, NextResponse } from "next/server";
import { createLearningServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { markWeekAttendance } from "@/lib/classroom";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { classId, weekNumber, method = "manual" } = body;

    if (!classId || !weekNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createLearningServerClient();
    const attendance = await markWeekAttendance(
      classId,
      user.id,
      weekNumber,
      method,
      user.id,
      supabase
    );

    if (!attendance) {
      return NextResponse.json(
        { error: "Failed to mark attendance" },
        { status: 500 }
      );
    }

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

