import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient, createLearningServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workshopId } = await params;
    const learningSupabase = await createLearningServerClient();

    // Fetch registrations
    const { data: registrations, error: regError } = await learningSupabase
      .from("workshop_registrations")
      .select("user_id")
      .eq("workshop_id", workshopId);

    if (regError) {
      console.error("Error fetching registrations:", regError);
      return NextResponse.json(
        { error: "Failed to fetch registrations" },
        { status: 500 }
      );
    }

    // Fetch user details for each registration
    // Users table is in Auth Supabase
    const authSupabase = await createAuthServerClient();
    const attendees = await Promise.all(
      (registrations || []).map(async (reg) => {
        try {
          const { data: userData, error: userError } = await authSupabase
            .from("users")
            .select("id, email, first_name, last_name, image_url")
            .eq("id", reg.user_id)
            .single();

          if (userError || !userData) {
            console.error("Error fetching user:", userError);
            return null;
          }

          const name =
            `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
            userData.email?.split("@")[0] ||
            "Unknown";

          return {
            id: reg.user_id,
            userId: reg.user_id,
            name,
            email: userData.email || "",
            avatar: userData.image_url || undefined,
          };
        } catch (error) {
          console.error("Error processing user:", error);
          return null;
        }
      })
    );

    // Filter out null values
    const validAttendees = attendees.filter((a) => a !== null) as Array<{
      id: string;
      userId: string;
      name: string;
      email: string;
      avatar?: string;
    }>;

    return NextResponse.json({
      attendees: validAttendees,
      count: validAttendees.length,
    });
  } catch (error: any) {
    console.error("Error in GET /api/workshops/[id]/registrations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}

