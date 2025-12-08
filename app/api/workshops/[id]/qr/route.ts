import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient, createLearningServerClient } from "@/lib/supabase/server";
import { getWorkshopById } from "@/lib/workshops";

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
    const workshop = await getWorkshopById(workshopId);

    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
    }

    if (!workshop.qrToken) {
      return NextResponse.json({ error: "QR code not available" }, { status: 404 });
    }

    // Generate QR code data URL
    const qrData = JSON.stringify({
      workshopId: workshop.id,
      qrToken: workshop.qrToken,
    });

    // Return QR code data (frontend will generate QR code image)
    return NextResponse.json({
      qrData,
      qrToken: workshop.qrToken,
      expiresAt: workshop.qrExpiresAt,
    });
  } catch (error: any) {
    console.error("Error in GET /api/workshops/[id]/qr:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch QR code" },
      { status: 500 }
    );
  }
}

