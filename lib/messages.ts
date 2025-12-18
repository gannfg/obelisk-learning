import { createClient } from "@/lib/supabase/client";
// Notifications are sent via server route to avoid client RLS

/**
 * Ensure the current user has a profile row (FK target for participants)
 */
async function ensureUserProfile(
  supabase: any,
  user: { id: string; email?: string | null; user_metadata?: Record<string, any> }
) {
  const { data: existing, error: profileFetchError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileFetchError) {
    console.error("Error checking user profile:", profileFetchError);
    return false;
  }

  if (existing) {
    return true;
  }

  const metadata = user.user_metadata || {};
  const { error: profileInsertError } = await supabase
    .from("users")
    .upsert({
      id: user.id,
      email: user.email || "",
      first_name: metadata.first_name || metadata.full_name || null,
      last_name: metadata.last_name || null,
      image_url: metadata.avatar_url || null,
    });

  if (profileInsertError) {
    console.error("Error creating user profile:", profileInsertError);
    return false;
  }

  return true;
}

/**
 * Message type
 */
export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  editedAt?: string | null;
};

/**
 * Conversation type
 */
export type Conversation = {
  id: string;
  type: "direct" | "group";
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  lastMessage?: Message | null;
  unreadCount?: number;
};

/**
 * Conversation participant type
 */
export type ConversationParticipant = {
  conversationId: string;
  userId: string;
  joinedAt: string;
  lastReadAt?: string | null;
  // Populated with user data
  user?: {
    id: string;
    name: string;
    username?: string | null;
    avatar?: string | null;
  };
};

/**
 * Create a direct conversation between two users
 * Uses the database function find_or_create_direct_conversation if available,
 * otherwise creates it manually
 */
export async function createDirectConversation(
  otherUserId: string,
  supabaseClient?: any
): Promise<string | null> {
  // Prefer server-backed API (uses service role) to avoid RLS edge cases.
  // If API fails, do NOT silently fall back unless a supabaseClient is explicitly provided.
  if (typeof fetch !== "undefined") {
    try {
      const res = await fetch("/api/messages/create-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
      const text = await res.text();
      if (res.ok) {
        const data = text ? JSON.parse(text) : {};
        if (data?.conversationId) {
          return data.conversationId as string;
        }
        console.warn("API create-direct missing conversationId", data);
        return null;
      } else {
        console.error("API create-direct failed", res.status, text);
        if (!supabaseClient) {
          return null;
        }
      }
    } catch (err) {
      console.error("API create-direct error", err);
      if (!supabaseClient) {
        return null;
      }
    }
  }

  const supabase = supabaseClient || createClient();
  
  if (!supabase) {
    console.error("Supabase client not available");
    return null;
  }

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated");
      return null;
    }

    // Ensure profile exists so FK on conversation_participants passes
    const profileOk = await ensureUserProfile(supabase, user);
    if (!profileOk) {
      console.error("Unable to ensure user profile exists");
      return null;
    }

    const currentUserId = user.id;

    // Try to use RPC function first
    const { data: existingConversation, error: checkError } = await supabase
      .rpc("find_or_create_direct_conversation", {
        user1_id: currentUserId,
        user2_id: otherUserId,
      });

    if (checkError) {
      console.warn("RPC function error (will fallback to manual creation):", checkError);
    } else if (existingConversation) {
      // Verify participants were actually added
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", existingConversation);
      
      const participantIds = participants?.map((p: any) => p.user_id) || [];
      if (participantIds.includes(currentUserId)) {
        return existingConversation;
      } else {
        console.warn("RPC returned conversation but current user is not a participant, falling back to manual creation");
      }
    }

    // If RPC function doesn't exist, manually check and create
    // First, get conversations where current user is a participant
    const { data: userConversations, error: findError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversations!inner(type)")
      .eq("user_id", currentUserId)
      .eq("conversations.type", "direct");

    if (!findError && userConversations) {
      // Check each conversation to see if it has both participants
      for (const conv of userConversations) {
        const { data: participants } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conv.conversation_id);

        if (participants && participants.length === 2) {
          const participantIds = participants.map((p: any) => p.user_id);
          if (participantIds.includes(currentUserId) && participantIds.includes(otherUserId)) {
            return conv.conversation_id;
          }
        }
      }
    }

    // Create new conversation
    // Note: RLS on conversations only allows selecting conversations that already
    // have the current user as a participant. To avoid relying on a SELECT right
    // after INSERT (which would fail before participants exist), we generate the
    // ID on the client and insert with returning=minimal.
    const newConversationId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${currentUserId}-${otherUserId}-${Date.now()}`;

    const { error: createError } = await supabase
      .from("conversations")
      .insert(
        {
          id: newConversationId,
          type: "direct",
        },
        { returning: "minimal" }
      );

    if (createError) {
      console.error("Error creating conversation:", createError);
      return null;
    }

    // Add current user as participant first (required by RLS policies)
    // Note: We don't check if conversation exists because RLS blocks SELECT
    // until we're a participant. If the insert above succeeded, it exists.
    // Try to insert participant
    const { data: selfParticipantData, error: selfParticipantError } = await supabase
      .from("conversation_participants")
      .insert({
        conversation_id: newConversationId,
        user_id: currentUserId,
      })
      .select()
      .single();

    if (selfParticipantError) {
      // Log full error details - handle cases where error might not serialize well
      const errorDetails: any = {
        conversationId: newConversationId,
        userId: currentUserId,
      };
      
      // Try to extract error properties safely
      if (selfParticipantError) {
        errorDetails.errorCode = (selfParticipantError as any).code;
        errorDetails.errorMessage = (selfParticipantError as any).message;
        errorDetails.errorDetails = (selfParticipantError as any).details;
        errorDetails.errorHint = (selfParticipantError as any).hint;
        errorDetails.errorStatus = (selfParticipantError as any).status;
        errorDetails.errorStatusText = (selfParticipantError as any).statusText;
        
        // Try to stringify the whole error
        try {
          errorDetails.fullError = JSON.stringify(selfParticipantError, Object.getOwnPropertyNames(selfParticipantError), 2);
        } catch (e) {
          errorDetails.fullError = String(selfParticipantError);
        }
      }
      
      console.error("Error adding current user as participant:", errorDetails);
      
      // Try to diagnose: check if we can read from the table at all
      const { data: tableCheck, error: tableCheckError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .limit(0);
      
      console.log("Table accessibility check:", {
        canRead: tableCheck !== null,
        readError: tableCheckError,
      });
      
      // Clean up conversation if participants failed
      await supabase.from("conversations").delete().eq("id", newConversationId);
      return null;
    }

    // Then add the other user as participant (RLS allows this once we're a participant)
    const { data: otherUserProfile, error: otherProfileError } = await supabase
      .from("users")
      .select("id")
      .eq("id", otherUserId)
      .maybeSingle();

    if (otherProfileError) {
      console.error("Error checking other user profile:", otherProfileError);
      // Clean up conversation
      await supabase.from("conversations").delete().eq("id", newConversationId);
      return null;
    }

    if (!otherUserProfile) {
      console.error("Other user profile missing; cannot add participant");
      await supabase.from("conversations").delete().eq("id", newConversationId);
      return null;
    }

    const { error: otherParticipantError } = await supabase
      .from("conversation_participants")
      .insert({
        conversation_id: newConversationId,
        user_id: otherUserId,
      });

    if (otherParticipantError) {
      console.error("Error adding other user as participant:", otherParticipantError);
      // If we can't add the other participant, clean up the conversation so we
      // don't leave orphaned records.
      await supabase.from("conversations").delete().eq("id", newConversationId);
      return null;
    }

    return newConversationId;
  } catch (error) {
    console.error("Error in createDirectConversation:", error);
    return null;
  }
}

/**
 * Get all conversations for the current user
 */
export async function getConversations(
  supabaseClient?: any
): Promise<Conversation[]> {
  const supabase = supabaseClient || createClient();
  
  if (!supabase) {
    console.error("Supabase client not available");
    return [];
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    // Get conversations where user is a participant (with fallback if nested user RLS fails)
    let conversations: any[] | null = null;
    let convoError: any = null;

    const { data: conversationsWithUsers, error: convoWithUsersError } = await supabase
      .from("conversations")
      .select(`
        *,
        conversation_participants(
          *
        )
      `)
      .order("updated_at", { ascending: false });

    if (convoWithUsersError) {
      convoError = convoWithUsersError;
      // Fallback without nested users (some deployments may lack permissive users RLS)
      const { data: conversationsFallback, error: convoFallbackError } = await supabase
        .from("conversations")
        .select(`
          *,
          conversation_participants(
            conversation_id,
            user_id,
            joined_at,
            last_read_at
          )
        `)
        .order("updated_at", { ascending: false });

      if (convoFallbackError) {
        console.error("Error fetching conversations (fallback):", convoFallbackError);
        return [];
      }
      conversations = conversationsFallback;
    } else {
      conversations = conversationsWithUsers;
    }

    // If participants have no embedded user info, fetch user profiles in one query
    const participantIds = new Set<string>();
    conversations?.forEach((conv: any) => {
      conv.conversation_participants?.forEach((p: any) => {
        if (p?.user_id) participantIds.add(p.user_id);
      });
    });

    const userMap: Record<string, any> = {};
    if (participantIds.size > 0) {
      const { data: userRows, error: usersError } = await supabase
        .from("users")
        .select("id, first_name, last_name, username, image_url")
        .in("id", Array.from(participantIds));

      if (!usersError && userRows) {
        userRows.forEach((u: any) => {
          userMap[u.id] = {
            id: u.id,
            name:
              [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
              u.username ||
              "User",
            username: u.username,
            avatar: u.image_url,
          };
        });
      }
    }

    if (!conversations) {
      return [];
    }

    // Filter to only conversations where current user is a participant
    // and enrich with last message and unread count
    const enrichedConversations = await Promise.all(
      conversations
        .filter((conv: any) =>
          conv.conversation_participants.some(
            (p: any) => p.user_id === user.id
          )
        )
        .map(async (conv: any) => {
          // Get last message
          const { data: lastMessageData } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count (messages after last_read_at)
          const participant = conv.conversation_participants.find(
            (p: any) => p.user_id === user.id
          );
          const lastReadAt = participant?.last_read_at;

          let unreadCount = 0;
          if (lastReadAt) {
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .gt("created_at", lastReadAt)
              .neq("sender_id", user.id);
            unreadCount = count || 0;
          } else if (lastMessageData && lastMessageData.sender_id !== user.id) {
            // If never read and there's a message from someone else
            unreadCount = 1;
          }

          // Format participants with user data
          const participants: ConversationParticipant[] =
            conv.conversation_participants.map((p: any) => {
              const userData = p.user || userMap[p.user_id];
              const fullName = userData
                ? [userData.first_name, userData.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || userData.username || userData.name || "User"
                : "User";

              return {
                conversationId: p.conversation_id,
                userId: p.user_id,
                joinedAt: p.joined_at,
                lastReadAt: p.last_read_at,
                user: userData
                  ? {
                      id: userData.id || p.user_id,
                      name: fullName,
                      username: userData.username,
                      avatar: userData.image_url || userData.avatar,
                    }
                  : undefined,
              };
            });

          return {
            id: conv.id,
            type: conv.type,
            createdAt: conv.created_at,
            updatedAt: conv.updated_at,
            participants,
            lastMessage: lastMessageData
              ? {
                  id: lastMessageData.id,
                  conversationId: lastMessageData.conversation_id,
                  senderId: lastMessageData.sender_id,
                  content: lastMessageData.content,
                  createdAt: lastMessageData.created_at,
                  editedAt: lastMessageData.edited_at,
                }
              : null,
            unreadCount,
          };
        })
    );

    return enrichedConversations;
  } catch (error) {
    console.error("Error in getConversations:", error);
    return [];
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getMessages(
  conversationId: string,
  supabaseClient?: any
): Promise<Message[]> {
  const supabase = supabaseClient || createClient();
  
  if (!supabase) {
    console.error("Supabase client not available");
    return [];
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    // Verify user is a participant
    const { data: participant, error: participantError } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    // If user is not a participant, return empty array silently
    // (This is expected for new conversations that are still being set up)
    // We don't log errors here because:
    // - PGRST116 (not found) is expected when conversation is new
    // - Empty error objects {} are also expected
    // - Real errors will be caught elsewhere or have meaningful error info
    if (!participant) {
      return [];
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    if (!messages) {
      return [];
    }

    return messages.map((msg: any) => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      content: msg.content,
      createdAt: msg.created_at,
      editedAt: msg.edited_at,
    }));
  } catch (error) {
    console.error("Error in getMessages:", error);
    return [];
  }
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  supabaseClient?: any
): Promise<Message | null> {
  const supabase = supabaseClient || createClient();
  
  if (!supabase) {
    console.error("Supabase client not available");
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated");
      return null;
    }

    // Verify user is a participant (use maybeSingle to avoid errors when not found)
    let { data: participant, error: participantCheckError } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    // If not a participant, attempt to add the current user as a participant (self-heal)
    if (!participant) {
      const { error: addSelfError } = await supabase
        .from("conversation_participants")
        .upsert({
          conversation_id: conversationId,
          user_id: user.id,
        });

      if (addSelfError) {
        // Only log real errors with meaningful information
        const hasRealError =
          addSelfError.code &&
          addSelfError.code !== "PGRST116" &&
          addSelfError.message &&
          typeof addSelfError.message === "string" &&
          addSelfError.message.trim().length > 0;

        if (hasRealError) {
          console.error("Error adding participant:", addSelfError);
        }

        // Fallback to returning null if we still cannot add the participant
        return null;
      }

      // Re-fetch participant after successful upsert
      const { data: participantAfterAdd } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();

      participant = participantAfterAdd;
    }

    if (!participant) {
      // At this point, participant should exist. If not, return null quietly.
      return null;
    }

    // Trim and validate content
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      console.error("Message content cannot be empty");
      return null;
    }

    // Insert message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: trimmedContent,
      })
      .select()
      .single();

    if (error || !message) {
      console.error("Error sending message:", error);
      return null;
    }

    // Update conversation updated_at (should be handled by trigger, but ensure it)
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    // Fire notifications to other participants (best-effort, non-blocking, via server API)
    (async () => {
      try {
        // Fetch participants excluding sender
        const { data: participants, error: participantsError } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conversationId);

        if (participantsError || !participants) return;

        // Fetch sender profile for name
        let senderName = "Someone";
        const { data: senderProfile } = await supabase
          .from("users")
          .select("first_name,last_name,username")
          .eq("id", user.id)
          .maybeSingle();

        if (senderProfile) {
          senderName =
            [senderProfile.first_name, senderProfile.last_name]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            senderProfile.username ||
            "Someone";
        }

        const messagePreview =
          trimmedContent.length > 120
            ? `${trimmedContent.slice(0, 117)}...`
            : trimmedContent;

        const recipients = participants
          .map((p: any) => p.user_id)
          .filter((id: string) => id !== user.id);

        await Promise.all(
          recipients.map((recipientId: string) =>
            fetch("/api/notifications/message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipientId,
                senderId: user.id,
                senderName,
                messagePreview,
                conversationId,
              }),
            }).catch(() => null)
          )
        );
      } catch (notifyErr) {
        console.warn("Notification send skipped/error:", notifyErr);
      }
    })();

    return {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      content: message.content,
      createdAt: message.created_at,
      editedAt: message.edited_at,
    };
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return null;
  }
}

/**
 * Mark messages as read in a conversation
 */
export async function markConversationAsRead(
  conversationId: string,
  supabaseClient?: any
): Promise<boolean> {
  const supabase = supabaseClient || createClient();
  
  if (!supabase) {
    console.error("Supabase client not available");
    return false;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    // Update last_read_at for the current user in this conversation
    const { error } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error marking conversation as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in markConversationAsRead:", error);
    return false;
  }
}

/**
 * Set up real-time subscription for new messages in a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (message: Message) => void,
  supabaseClient?: any
): () => void {
  const supabase = supabaseClient || createClient();
  
  if (!supabase) {
    console.error("Supabase client not available");
    return () => {};
  }

  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: any) => {
        const message: Message = {
          id: payload.new.id,
          conversationId: payload.new.conversation_id,
          senderId: payload.new.sender_id,
          content: payload.new.content,
          createdAt: payload.new.created_at,
          editedAt: payload.new.edited_at,
        };
        callback(message);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Set up real-time subscription for conversation updates (new messages in any conversation)
 */
export function subscribeToConversations(
  callback: (conversationId: string) => void,
  supabaseClient?: any
): () => void {
  const supabase = supabaseClient || createClient();
  
  if (!supabase) {
    console.error("Supabase client not available");
    return () => {};
  }

  const channel = supabase
    .channel("conversations")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
      },
      (payload: any) => {
        callback(payload.new.id);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

