import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient, createLearningServerClient } from "@/lib/supabase/server";
import { getAllWorkshops, createWorkshop } from "@/lib/workshops";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const upcomingOnlyParam = searchParams.get("upcomingOnly");
    const upcomingOnly = upcomingOnlyParam === "true" ? true : upcomingOnlyParam === "false" ? false : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const learningSupabase = await createLearningServerClient();
    const workshops = await getAllWorkshops({ upcomingOnly, limit }, learningSupabase);

    console.log(`Fetched ${workshops.length} workshops (upcomingOnly: ${upcomingOnly})`);
    return NextResponse.json({ workshops });
  } catch (error: any) {
    console.error("Error in GET /api/workshops:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch workshops" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const workshop = await createWorkshop(body, user.id, learningSupabase);

    if (!workshop) {
      return NextResponse.json(
        { error: "Failed to create workshop" },
        { status: 500 }
      );
    }

    return NextResponse.json({ workshop }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/workshops:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create workshop" },
      { status: 500 }
    );
  }
}

