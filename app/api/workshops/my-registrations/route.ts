import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient, createLearningServerClient } from "@/lib/supabase/server";
import { getUserRegisteredWorkshops } from "@/lib/workshops";

export async function GET(request: NextRequest) {
  try {
    const authSupabase = await createAuthServerClient();
    const learningSupabase = await createLearningServerClient();
    
    const { data: { user } } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workshops = await getUserRegisteredWorkshops(user.id, learningSupabase);

    // Separate into attending (upcoming) and attended (past)
    const now = new Date();
    const attending = workshops.filter((w) => new Date(w.datetime) >= now);
    const attended = workshops.filter((w) => new Date(w.datetime) < now);

    return NextResponse.json({
      attending,
      attended,
      all: workshops,
    });
  } catch (error: any) {
    console.error("Error in GET /api/workshops/my-registrations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch registered workshops" },
      { status: 500 }
    );
  }
}

