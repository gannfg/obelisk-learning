import { NextResponse } from "next/server";
import { createAuthAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { recipientId, senderId, senderName, messagePreview, conversationId } =
      await request.json();

    if (!recipientId || !senderId || !conversationId) {
      return NextResponse.json(
        { error: "recipientId, senderId, conversationId are required" },
        { status: 400 }
      );
    }

    const admin = createAuthAdminClient();
    const { error } = await admin.from("notifications").insert({
      user_id: recipientId,
      type: "message",
      title: "You received a message",
      message: `${senderName || "Someone"}: ${messagePreview || ""}`,
      link: `/messages/${conversationId}`,
      metadata: {
        sender_id: senderId,
        sender_name: senderName,
        conversation_id: conversationId,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to create notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
