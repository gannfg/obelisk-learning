"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { ConversationListItem } from "@/components/conversation-list-item";
import { MessageThread } from "@/components/message-thread";
import {
  getConversations,
  createDirectConversation,
  getMessages,
  sendMessage,
  markConversationAsRead,
  subscribeToMessages,
  type Conversation,
  type Message,
} from "@/lib/messages";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { MessageSquare, Loader2, MoreVertical, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function MessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuth();
  const supabase = createClient();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messagesCache, setMessagesCache] = useState<Record<string, Message[]>>({});
  const messagesCacheRef = useRef<Record<string, Message[]>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const ensureStarting = useRef(false);
  const loadingRef = useRef(false);
  const messagesLoadingRef = useRef<Record<string, boolean>>({});
  const previousConvIdRef = useRef<string | null>(null);

  // Extract conversation ID from pathname
  const conversationId = pathname?.match(/\/messages\/([^/]+)/)?.[1];

  // Load conversations
  useEffect(() => {
    async function loadConversations() {
      if (loadingRef.current) return;
      if (!user || !supabase) {
        setLoading(false);
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      try {
        const convs = await getConversations(supabase);
        setConversations(convs);
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    }

    loadConversations();

    // Set up real-time subscription for conversation updates
    if (!supabase) return;
    
    const channel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        () => {
          // Only reload if not currently loading
          if (!loadingRef.current) {
            loadConversations();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
        },
        () => {
          if (!loadingRef.current) {
            loadConversations();
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, supabase]);

  // Update selected conversation when conversationId or conversations change
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const found = conversations.find((c) => c.id === conversationId);
      if (found && found.id !== selectedConversation?.id) {
        setSelectedConversation(found);
      }
    } else if (!conversationId && selectedConversation) {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, [conversationId ?? null, conversations, selectedConversation?.id ?? null]);

  // Load messages when conversation is selected - with caching
  useEffect(() => {
    const convId = selectedConversation?.id ?? null;
    
    // Skip if same conversation
    if (convId === previousConvIdRef.current) {
      return;
    }
    
    previousConvIdRef.current = convId;
    
    if (!convId || !supabase) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    // At this point, convId is guaranteed to be non-null
    const conversationId: string = convId;

    // Check cache first - use ref which is always up to date
    const cachedMessages = messagesCacheRef.current[conversationId];
    if (cachedMessages && cachedMessages.length > 0) {
      // Use cached messages immediately - no loading state
      setMessages(cachedMessages);
      setLoadingMessages(false);
      // Still mark as read in background
      markConversationAsRead(conversationId, supabase).catch(console.error);
      return;
    }

    // Only load if not already loading for this conversation
    if (messagesLoadingRef.current[conversationId]) {
      return;
    }

    async function loadMessages() {
      messagesLoadingRef.current[conversationId] = true;
      setLoadingMessages(true);
      try {
        const msgs = await getMessages(conversationId, supabase);
        setMessages(msgs);
        // Cache the messages in both state and ref
        setMessagesCache((prev) => {
          const updated = {
            ...prev,
            [conversationId]: msgs,
          };
          messagesCacheRef.current = updated;
          return updated;
        });
        await markConversationAsRead(conversationId, supabase);
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        messagesLoadingRef.current[conversationId] = false;
        setLoadingMessages(false);
      }
    }

    loadMessages();
  }, [selectedConversation?.id ?? null, supabase]);

  // Subscribe to new messages and update cache
  useEffect(() => {
    const convId = selectedConversation?.id;
    if (!convId || !supabase) return;

    const unsubscribe = subscribeToMessages(
      convId,
      (newMessage) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          const updated = [...prev, newMessage];
          // Update cache
          setMessagesCache((cache) => ({
            ...cache,
            [convId]: updated,
          }));
          return updated;
        });
        markConversationAsRead(convId, supabase).catch(console.error);
      },
      supabase
    );

    return () => {
      unsubscribe();
    };
  }, [selectedConversation?.id ?? null, supabase]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation?.id || !supabase) return;

    const convId = selectedConversation.id;
    const sentMessage = await sendMessage(convId, content, supabase);
    if (sentMessage) {
      // Optimistically update
      const updated = [...messages, sentMessage];
      setMessages(updated);
      // Update cache
      setMessagesCache((cache) => ({
        ...cache,
        [convId]: updated,
      }));
      
      // Refresh to get latest state (in case of server-side updates)
      try {
        const updatedMessages = await getMessages(convId, supabase);
        setMessages(updatedMessages);
        setMessagesCache((cache) => ({
          ...cache,
          [convId]: updatedMessages,
        }));
      } catch (error) {
        console.error("Error refreshing messages:", error);
      }
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    router.push(`/messages/${conversation.id}`);
  };

  // Get other participant
  const otherParticipant = selectedConversation?.participants.find(
    (p) => p.userId !== user?.id
  );

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w`;
    return `${Math.floor(diffInDays / 30)}mo`;
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to view your messages.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Messages</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your conversations and messages.
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[320px_1fr] gap-4 sm:gap-6 h-[calc(100vh-200px)] sm:h-[calc(100vh-240px)] min-h-[600px]">
          {/* Left Panel - Conversation List */}
          <Card className={cn(
            "flex flex-col overflow-hidden",
            selectedConversation && "hidden lg:flex"
          )}>
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Conversations</h2>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto bg-card">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length > 0 ? (
                <div className="divide-y divide-border">
                  {conversations.map((conversation) => {
                    const other = conversation.participants.find((p) => p.userId !== user.id);
                    const isSelected = selectedConversation?.id === conversation.id;
                    
                    return (
                      <button
                        key={conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                        className={cn(
                          "w-full p-3 hover:bg-muted/50 transition-colors text-left",
                          isSelected && "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          {other?.user?.avatar ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-border">
                              <Image
                                src={other.user.avatar}
                                alt={other.user.name || "User"}
                                fill
                                className="object-cover"
                                sizes="40px"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-muted-foreground">
                                {other?.user?.name?.charAt(0).toUpperCase() || "U"}
                              </span>
                            </div>
                          )}
                          
                          {/* Name and Time */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-semibold truncate">
                                {other?.user?.name || "Unknown User"}
                              </span>
                              {conversation.lastMessage && (
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {formatTimeAgo(conversation.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            {other?.user?.username && (
                              <p className="text-xs text-muted-foreground truncate">
                                @{other.user.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a conversation from the Social page.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Right Panel - Active Conversation */}
          {selectedConversation ? (
            <Card className="flex flex-col overflow-hidden">
              {/* Header */}
              <div className="border-b border-border p-4 bg-muted/30 flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedConversation(null);
                    router.push("/messages");
                  }}
                  className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                
                {otherParticipant?.user?.avatar ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-border">
                    <Image
                      src={otherParticipant.user.avatar}
                      alt={otherParticipant.user.name || "User"}
                      fill
                      className="object-cover"
                      sizes="40px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-muted-foreground">
                      {otherParticipant?.user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate text-lg">
                    {otherParticipant?.user?.name || "Unknown User"}
                  </h3>
                  {otherParticipant?.user?.username && (
                    <p className="text-xs text-muted-foreground truncate">
                      @{otherParticipant.user.username}
                    </p>
                  )}
                </div>
                
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              {/* Message Thread */}
              <div className="flex-1 min-h-0 overflow-hidden bg-card flex flex-col">
                <MessageThread
                  conversationId={selectedConversation.id}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={loadingMessages}
                  otherParticipant={
                    selectedConversation.type === "direct" && otherParticipant
                      ? {
                          name: otherParticipant.user?.name || "Unknown",
                          avatar: otherParticipant.user?.avatar || undefined,
                        }
                      : undefined
                  }
                />
              </div>
            </Card>
          ) : (
            <Card className="hidden lg:flex flex-1 items-center justify-center">
              <div className="text-center p-12">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a conversation from the list to start messaging.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
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
