import { createClient } from "@/lib/supabase/client";

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
    const { data: newConversation, error: createError } = await supabase
      .from("conversations")
      .insert({
        type: "direct",
      })
      .select()
      .single();

    if (createError || !newConversation) {
      // Only log if there's a real error with meaningful content
      if (createError && createError.message && typeof createError.message === "string" && createError.message.trim().length > 0) {
        console.error("Error creating conversation:", createError);
      } else if (!newConversation) {
        console.error("Failed to create conversation: No conversation returned");
      }
      return null;
    }

    // Add both users as participants
    const { error: participantsError } = await supabase
      .from("conversation_participants")
      .insert([
        {
          conversation_id: newConversation.id,
          user_id: currentUserId,
        },
        {
          conversation_id: newConversation.id,
          user_id: otherUserId,
        },
      ]);

    if (participantsError) {
      console.error("Error adding participants:", participantsError);
      // Clean up conversation if participants failed
      await supabase.from("conversations").delete().eq("id", newConversation.id);
      return null;
    }

    return newConversation.id;
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

    // Get conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        *,
        conversation_participants(
          *,
          user:users(id, first_name, last_name, username, image_url)
        )
      `)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return [];
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
            .single();

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
              const userData = p.user;
              const fullName = userData
                ? [userData.first_name, userData.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || userData.username || "User"
                : "User";

              return {
                conversationId: p.conversation_id,
                userId: p.user_id,
                joinedAt: p.joined_at,
                lastReadAt: p.last_read_at,
                user: userData
                  ? {
                      id: userData.id,
                      name: fullName,
                      username: userData.username,
                      avatar: userData.image_url,
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

