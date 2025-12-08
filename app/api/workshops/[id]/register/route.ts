import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient, createLearningServerClient } from "@/lib/supabase/server";
import { registerForWorkshop, isUserRegistered } from "@/lib/workshops";

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

    const learningSupabase = await createLearningServerClient();
    
    // Check if already registered
    const alreadyRegistered = await isUserRegistered(workshopId, user.id, learningSupabase);
    if (alreadyRegistered) {
      return NextResponse.json(
        { error: "Already registered for this workshop" },
        { status: 400 }
      );
    }

    const registration = await registerForWorkshop(workshopId, user.id, learningSupabase);

    if (!registration) {
      return NextResponse.json(
        { error: "Failed to register. Workshop may be full." },
        { status: 400 }
      );
    }

    return NextResponse.json({ registration }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/workshops/[id]/register:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register" },
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
    const isRegistered = await isUserRegistered(workshopId, user.id, learningSupabase);

    return NextResponse.json({ isRegistered });
  } catch (error: any) {
    console.error("Error in GET /api/workshops/[id]/register:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check registration" },
      { status: 500 }
    );
  }
}

