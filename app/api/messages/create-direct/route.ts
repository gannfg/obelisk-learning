import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";
import { createAuthAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const authClient = await createAuthServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { otherUserId } = await request.json();
    if (!otherUserId || typeof otherUserId !== "string") {
      return NextResponse.json(
        { error: "otherUserId is required" },
        { status: 400 }
      );
    }

    const admin = createAuthAdminClient();
    const currentUserId = user.id;

    // Ensure both users have profile rows (FK target)
    const ensureProfile = async (
      userId: string,
      email?: string | null,
      metadata?: Record<string, any>
    ) => {
      const { data: existing, error: fetchProfileError } = await admin
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (fetchProfileError) throw fetchProfileError;
      if (existing) return true;

      if (!email) return false; // cannot create without required email

      const { error: insertError } = await admin.from("users").insert({
        id: userId,
        email,
        first_name: metadata?.first_name || metadata?.full_name || null,
        last_name: metadata?.last_name || null,
        image_url: metadata?.avatar_url || null,
      });
      if (insertError) throw insertError;
      return true;
    };

    const selfProfileOk = await ensureProfile(
      currentUserId,
      user.email,
      user.user_metadata
    );
    if (!selfProfileOk) {
      return NextResponse.json(
        { error: "User profile missing email" },
        { status: 400 }
      );
    }

    const otherProfileOk = await ensureProfile(otherUserId);
    if (!otherProfileOk) {
      return NextResponse.json(
        { error: "Other user profile missing" },
        { status: 400 }
      );
    }

    // Look for existing direct conversation containing exactly these two users
    const { data: candidateConversations, error: fetchError } = await admin
      .from("conversations")
      .select(
        `
          id,
          type,
          conversation_participants(user_id)
        `
      )
      .eq("type", "direct");

    if (fetchError) {
      throw fetchError;
    }

    const existing = (candidateConversations || []).find((c: any) => {
      const participants = c.conversation_participants?.map(
        (p: any) => p.user_id
      );
      if (!participants || participants.length !== 2) return false;
      return (
        participants.includes(currentUserId) &&
        participants.includes(otherUserId)
      );
    });

    if (existing) {
      return NextResponse.json({ conversationId: existing.id });
    }

    // Create conversation
    const { data: created, error: createError } = await admin
      .from("conversations")
      .insert({ type: "direct" })
      .select("id")
      .single();

    if (createError || !created) {
      throw createError || new Error("Failed to create conversation");
    }

    const conversationId = created.id;

    // Add participants
    const { error: participantsError } = await admin
      .from("conversation_participants")
      .insert([
        { conversation_id: conversationId, user_id: currentUserId },
        { conversation_id: conversationId, user_id: otherUserId },
      ]);

    if (participantsError) {
      // Clean up on failure
      await admin.from("conversations").delete().eq("id", conversationId);
      throw participantsError;
    }

    return NextResponse.json({ conversationId });
  } catch (error: any) {
    console.error("create-direct error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
