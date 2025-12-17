"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ConversationListItem } from "@/components/conversation-list-item";
import {
  getConversations,
  createDirectConversation,
  type Conversation,
} from "@/lib/messages";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { MessageSquare, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function MessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const ensureStarting = useRef(false);

  useEffect(() => {
    async function loadConversations() {
      if (!user || !supabase) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const convs = await getConversations(supabase);
        setConversations(convs);
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();

    // If navigated with ?userId=... ensure a conversation exists, then redirect
    const targetUserId = searchParams?.get("userId");
    if (user && targetUserId && !ensureStarting.current) {
      ensureStarting.current = true;
      (async () => {
        const convId = await createDirectConversation(targetUserId);
        if (convId) {
          router.replace(`/messages/${convId}`);
        } else {
          // If creation failed, stay on list but clear the param
          router.replace("/messages");
        }
      })().finally(() => {
        ensureStarting.current = false;
      });
    }

    // Set up real-time subscription for conversation updates
    if (supabase && user) {
      const channel = supabase
        .channel("conversations-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
          },
          () => {
            // Reload conversations when there's a change
            loadConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, supabase]);

  if (!user) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to view your messages.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-8">
        <h1 className="mb-3 text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
          Messages
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Your conversations and messages.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              currentUserId={user.id}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start a conversation from the Social page.
          </p>
        </Card>
      )}
    </div>
  );
}

// Wrap in Suspense to satisfy useSearchParams requirement
export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
      <MessagesPageInner />
    </Suspense>
  );
}

