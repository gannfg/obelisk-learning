import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient, createLearningServerClient } from "@/lib/supabase/server";
import { checkInWithQR, manualCheckIn, hasUserAttended } from "@/lib/workshops";
import { awardXP } from "@/lib/progress";
import { createNotification } from "@/lib/notifications";
import { awardWorkshopBadge, checkWorkshopMilestones } from "@/lib/workshop-badges";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSupabase = await createAuthServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workshopId } = await params;
    const body = await request.json();
    const { qrToken, userId: targetUserId, isManual } = body;

    const learningSupabase = await createLearningServerClient();

    // Check if already attended
    const userId = targetUserId || user.id;
    const alreadyAttended = await hasUserAttended(workshopId, userId, learningSupabase);
    if (alreadyAttended) {
      return NextResponse.json(
        { error: "Already checked in for this workshop" },
        { status: 400 }
      );
    }

    let attendance;

    if (isManual) {
      // Manual check-in (admin only)
      const { data: userData } = await learningSupabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!userData?.is_admin) {
        return NextResponse.json(
          { error: "Forbidden: Admin only for manual check-in" },
          { status: 403 }
        );
      }

      attendance = await manualCheckIn(workshopId, userId, user.id, learningSupabase);
    } else {
      // QR code check-in
      if (!qrToken) {
        return NextResponse.json(
          { error: "QR token required" },
          { status: 400 }
        );
      }

      attendance = await checkInWithQR(workshopId, qrToken, userId, learningSupabase);
    }

    if (!attendance) {
      return NextResponse.json(
        { error: "Failed to check in" },
        { status: 500 }
      );
    }

    // Award XP and badges for attendance
    try {
      const { data: workshop } = await learningSupabase
        .from("workshops")
        .select("title")
        .eq("id", workshopId)
        .single();

      if (workshop) {
        // Award XP (gracefully handles if XP system not yet configured)
        await awardXP(userId, 100, "workshop_attendance", authSupabase);

        // Award workshop badge
        await awardWorkshopBadge(userId, workshopId, workshop.title, authSupabase);

        // Check for milestone badges
        await checkWorkshopMilestones(userId, authSupabase);

        // Send notification
        await createNotification(
          {
            userId,
            type: "achievement",
            title: "Workshop Attendance Confirmed! ✅",
            message: `You've successfully checked in for "${workshop.title}". +100 XP and badge awarded!`,
            link: `/workshops/${workshopId}`,
            metadata: {
              workshop_id: workshopId,
              workshop_title: workshop.title,
              xp_awarded: 100,
            },
          },
          authSupabase
        );
      }
    } catch (rewardError) {
      console.error("Error awarding rewards:", rewardError);
      // Don't fail check-in if rewards fail
    }

    return NextResponse.json({ attendance }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/workshops/[id]/checkin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check in" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSupabase = await createAuthServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workshopId } = await params;
    const learningSupabase = await createLearningServerClient();
    const hasAttended = await hasUserAttended(workshopId, user.id, learningSupabase);

    return NextResponse.json({ hasAttended });
  } catch (error: any) {
    console.error("Error in GET /api/workshops/[id]/checkin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check attendance" },
      { status: 500 }
    );
  }
}

