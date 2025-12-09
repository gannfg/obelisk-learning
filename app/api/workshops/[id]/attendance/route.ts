import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient, createLearningServerClient } from "@/lib/supabase/server";
import { getWorkshopAttendance } from "@/lib/workshops";

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

    // Check if user is admin
    const learningSupabase = await createLearningServerClient();
    const { data: userData } = await learningSupabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const { id: workshopId } = await params;
    const attendance = await getWorkshopAttendance(workshopId, learningSupabase);

    // Fetch user details for each attendance
    const attendanceWithUsers = await Promise.all(
      attendance.map(async (att) => {
        const { data: userInfo } = await learningSupabase
          .from("users")
          .select("email, username, first_name, last_name")
          .eq("id", att.userId)
          .single();

        return {
          ...att,
          user: userInfo
            ? {
                email: userInfo.email,
                username: userInfo.username,
                name: `${userInfo.first_name || ""} ${userInfo.last_name || ""}`.trim() || userInfo.email?.split("@")[0],
              }
            : null,
        };
      })
    );

    return NextResponse.json({ attendance: attendanceWithUsers });
  } catch (error: any) {
    console.error("Error in GET /api/workshops/[id]/attendance:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

