import { NextRequest, NextResponse } from "next/server";
import { createLearningServerClient } from "@/lib/supabase/server";

/**
 * GET /api/attendance/verify-token?token=xxx
 * 
 * Verify a check-in token and return workshop info
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token required" },
        { status: 400 }
      );
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

    // Check if token has expired
    const isExpired =
      workshop.qr_expires_at &&
      new Date(workshop.qr_expires_at) < new Date();

    return NextResponse.json({
      valid: !isExpired,
      expired: isExpired,
      workshop: {
        id: workshop.id,
        title: workshop.title,
        datetime: workshop.datetime,
      },
      expiresAt: workshop.qr_expires_at,
    });
  } catch (error: any) {
    console.error("Error in GET /api/attendance/verify-token:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify token" },
      { status: 500 }
    );
  }
}

