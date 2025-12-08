import { NextRequest, NextResponse } from "next/server";
import { createLearningServerClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

// Save/restore workspace snapshots

export async function POST(request: NextRequest) {
  try {
    // Get user from auth Supabase first
    const { createClient } = await import("@/lib/supabase/server");
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Use Learning Supabase for sandboxes/snapshots
    const supabase = await createLearningServerClient();

    const body = await request.json();
    const { files, missionId, userId, name, description } = body;

    if (!files || typeof files !== "object") {
      return NextResponse.json({ error: "Invalid files" }, { status: 400 });
    }

    if (!missionId) {
      return NextResponse.json({ error: "missionId is required" }, { status: 400 });
    }

    // Get or create sandbox
    let { data: sandbox } = await supabase
      .from("sandboxes")
      .select("*")
      .eq("user_id", user.id)
      .eq("mission_id", missionId)
      .single();

    if (!sandbox) {
      const { data: newSandbox, error: sandboxError } = await supabase
        .from("sandboxes")
        .insert({
          user_id: user.id,
          mission_id: missionId,
          files,
        })
        .select()
        .single();

      if (sandboxError) {
        console.error("Error creating sandbox:", sandboxError);
        return NextResponse.json({ error: "Failed to create sandbox" }, { status: 500 });
      }

      sandbox = newSandbox;
    } else {
      // Update sandbox files
      await supabase
        .from("sandboxes")
        .update({ files, updated_at: new Date().toISOString() })
        .eq("id", sandbox.id);
    }

    // Create snapshot
    const shareToken = randomBytes(16).toString("hex");
    const { data: snapshot, error: snapshotError } = await supabase
      .from("snapshots")
      .insert({
        user_id: user.id,
        sandbox_id: sandbox.id,
        mission_id: missionId,
        name: name || `Snapshot ${new Date().toLocaleString()}`,
        description,
        files,
        share_token: shareToken,
      })
      .select()
      .single();

    if (snapshotError) {
      console.error("Error creating snapshot:", snapshotError);
      return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 });
    }

    return NextResponse.json({
      snapshot,
      success: true,
    });
  } catch (error) {
    console.error("Snapshot error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET: Retrieve a snapshot (by ID or share token)
export async function GET(request: NextRequest) {
  try {
    // Get user from auth Supabase first
    const { createClient } = await import("@/lib/supabase/server");
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    
    // Use Learning Supabase for snapshots
    const supabase = await createLearningServerClient();
    const { searchParams } = new URL(request.url);
    const snapshotId = searchParams.get("id");
    const shareToken = searchParams.get("token");

    if (!snapshotId && !shareToken) {
      return NextResponse.json({ error: "id or token is required" }, { status: 400 });
    }

    let query = supabase.from("snapshots").select("*");

    if (snapshotId) {
      query = query.eq("id", snapshotId);
    } else if (shareToken) {
      query = query.eq("share_token", shareToken);
    }

    const { data: snapshot, error } = await query.single();

    if (error || !snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    // Check access: user owns it OR it has a share token
    if (!shareToken && (!user || snapshot.user_id !== user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ snapshot, success: true });
  } catch (error) {
    console.error("Get snapshot error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

