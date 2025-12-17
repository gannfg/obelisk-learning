"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MessageThread } from "@/components/message-thread";
import {
  getMessages,
  sendMessage,
  getConversations,
  markConversationAsRead,
  subscribeToMessages,
  type Message,
  type Conversation,
} from "@/lib/messages";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { ArrowLeft, Loader2, Users } from "lucide-react";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const { user } = useAuth();
  const supabase = createClient();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load conversation and messages
  useEffect(() => {
    async function loadData() {
      if (!user || !supabase || !conversationId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load all conversations to find this one
        const conversations = await getConversations(supabase);
        const foundConversation = conversations.find((c) => c.id === conversationId);

        if (!foundConversation) {
          console.error("Conversation not found");
          setLoading(false);
          return;
        }

        setConversation(foundConversation);

        // Load messages
        setLoadingMessages(true);
        const msgs = await getMessages(conversationId, supabase);
        setMessages(msgs);
        setLoadingMessages(false);

        // Mark as read
        await markConversationAsRead(conversationId, supabase);
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [conversationId, user, supabase]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId || !supabase) return;

    const unsubscribe = subscribeToMessages(
      conversationId,
      (newMessage) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
        // Mark as read
        markConversationAsRead(conversationId, supabase);
      },
      supabase
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, supabase]);

  const handleSendMessage = async (content: string) => {
    if (!conversationId || !supabase) return;

    const sentMessage = await sendMessage(conversationId, content, supabase);
    if (sentMessage) {
      setMessages((prev) => [...prev, sentMessage]);
      // Reload to get latest state
      const updatedMessages = await getMessages(conversationId, supabase);
      setMessages(updatedMessages);
    }
  };

  // Get other participant
  const otherParticipant = conversation?.participants.find(
    (p) => p.userId !== user?.id
  );

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!conversation || !user) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Conversation not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/messages">Back to Messages</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[100vh] flex-col px-3 py-3 sm:container sm:h-auto sm:px-4 sm:py-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/messages">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Link>
        </Button>
      </div>

      <div className="flex flex-1 flex-col rounded-lg border border-border bg-muted/10 backdrop-blur-sm overflow-hidden">
        {/* Chat Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/90 p-3 sm:p-4 flex items-center gap-3">
          {otherParticipant?.user?.avatar ? (
            <Image
              src={otherParticipant.user.avatar}
              alt={otherParticipant.user.name}
              width={40}
              height={40}
              className="rounded-full w-10 h-10 object-cover"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {conversation.type === "group" ? (
                <Users className="h-5 w-5 text-muted-foreground" />
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  {otherParticipant?.user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">
              {conversation.type === "group"
                ? `Group Chat (${conversation.participants.length})`
                : otherParticipant?.user?.name || "Unknown User"}
            </h3>
            {conversation.type === "direct" && otherParticipant?.user?.username && (
              <p className="text-xs text-muted-foreground truncate">
                @{otherParticipant.user.username}
              </p>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 min-h-0">
          <MessageThread
            conversationId={conversationId}
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={loadingMessages}
            otherParticipant={
              conversation.type === "direct" && otherParticipant
                ? {
                    name: otherParticipant.user?.name || "Unknown",
                    avatar: otherParticipant.user?.avatar || undefined,
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

