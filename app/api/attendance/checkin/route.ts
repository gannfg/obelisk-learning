import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient, createLearningServerClient } from "@/lib/supabase/server";
import { checkInWithQR, hasUserAttended } from "@/lib/workshops";
import { awardXP } from "@/lib/progress";
import { createNotification } from "@/lib/notifications";

/**
 * POST /api/attendance/checkin
 * 
 * Check in user for a workshop using QR token
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createAuthServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const learningSupabase = await createLearningServerClient();

    // Find workshop by QR token
    const { data: workshop, error: workshopError } = await learningSupabase
      .from("workshops")
      .select("id, title, qr_token, qr_expires_at, datetime")
      .eq("qr_token", token)
      .single();

    if (workshopError || !workshop) {
      return NextResponse.json(
        { error: "Invalid check-in token" },
        { status: 404 }
      );
    }

    // Allow check-in only on the workshop day (UTC)
    const workshopDate = new Date(workshop.datetime);
    const now = new Date();

    const startOfDay = new Date(workshopDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(workshopDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    if (now < startOfDay || now > endOfDay) {
      return NextResponse.json(
        { error: "Check-in is only available on the day of the workshop" },
        { status: 400 }
      );
    }

    // Check if already attended
    const alreadyAttended = await hasUserAttended(
      workshop.id,
      user.id,
      learningSupabase
    );

    if (alreadyAttended) {
      return NextResponse.json(
        { error: "You have already checked in for this workshop" },
        { status: 400 }
      );
    }

    // Perform check-in
    const attendance = await checkInWithQR(
      workshop.id,
      token,
      user.id,
      learningSupabase
    );

    if (!attendance) {
      return NextResponse.json(
        { error: "Failed to record attendance" },
        { status: 500 }
      );
    }

    // Award XP and send notification (gracefully handle failures)
    try {
      await awardXP(user.id, 100, "workshop_attendance", authSupabase);
      await createNotification(
        {
          userId: user.id,
          type: "achievement",
          title: "Workshop Attendance Confirmed! ✅",
          message: `You've successfully checked in for "${workshop.title}". +100 XP awarded!`,
          link: `/workshops/${workshop.id}`,
          metadata: {
            workshop_id: workshop.id,
            workshop_title: workshop.title,
            xp_awarded: 100,
          },
        },
        authSupabase
      );
    } catch (rewardError) {
      console.error("Error awarding rewards:", rewardError);
      // Don't fail check-in if rewards fail
    }

    return NextResponse.json(
      {
        success: true,
        attendance,
        workshop: {
          id: workshop.id,
          title: workshop.title,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/attendance/checkin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check in" },
      { status: 500 }
    );
  }
}

