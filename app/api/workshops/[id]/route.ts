import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient, createLearningServerClient } from "@/lib/supabase/server";
import { getWorkshopById, updateWorkshop, deleteWorkshop } from "@/lib/workshops";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const learningSupabase = await createLearningServerClient();
    const workshop = await getWorkshopById(id, learningSupabase);

    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
    }

    return NextResponse.json({ workshop });
  } catch (error: any) {
    console.error("Error in GET /api/workshops/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch workshop" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { id } = await params;
    const body = await request.json();
    const workshop = await updateWorkshop({ ...body, id }, user.id, learningSupabase);

    if (!workshop) {
      return NextResponse.json(
        { error: "Failed to update workshop" },
        { status: 500 }
      );
    }

    return NextResponse.json({ workshop });
  } catch (error: any) {
    console.error("Error in PATCH /api/workshops/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update workshop" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id } = await params;
    const success = await deleteWorkshop(id, learningSupabase);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete workshop" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/workshops/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete workshop" },
      { status: 500 }
    );
  }
}

