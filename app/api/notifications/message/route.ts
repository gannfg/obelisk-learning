import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";

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

    // Verify the user is authenticated
    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try using the database function first (if it exists)
    // This function uses SECURITY DEFINER to bypass RLS
    const { data: notificationId, error: rpcError } = await supabase.rpc(
      "create_message_notification",
      {
        recipient_id: recipientId,
        sender_id: senderId,
        sender_name: senderName || "Someone",
        message_preview: messagePreview || "",
        conversation_id: conversationId,
      }
    );

    // If RPC fails, try direct insert (will work if RLS allows or if user has permission)
    if (rpcError) {
      console.warn("RPC function failed, trying direct insert:", rpcError);
      
      // Fallback: Try direct insert
      const { data: insertedData, error: insertError } = await supabase
        .from("notifications")
        .insert({
          user_id: recipientId,
          type: "message",
          title: `New Message from ${senderName || "Someone"}`,
          message: messagePreview || "",
          link: `/messages/${conversationId}`,
          metadata: {
            sender_id: senderId,
            sender_name: senderName || "Someone",
            conversation_id: conversationId,
          },
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating message notification (both methods failed):", {
          rpcError: rpcError.message,
          insertError: insertError.message,
        });
        return NextResponse.json(
          { 
            error: insertError.message || "Failed to create notification. The database function may not exist. Please run the notifications-triggers.sql migration.",
            details: {
              rpcError: rpcError.message,
              insertError: insertError.message,
            }
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, notificationId: insertedData?.id });
    }

    return NextResponse.json({ ok: true, notificationId });
  } catch (err: any) {
    console.error("Error in notification API:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
