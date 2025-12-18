"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Message } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { format } from "date-fns";

interface MessageThreadProps {
  conversationId: string;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  otherParticipant?: {
    name: string;
    avatar?: string | null;
  };
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return new Date(dateString).toLocaleDateString();
}

export function MessageThread({
  conversationId,
  messages,
  onSendMessage,
  isLoading = false,
  otherParticipant,
}: MessageThreadProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Scroll to bottom when messages change or conversation changes
  useEffect(() => {
    // Use a small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      if (messagesEndRef.current) {
        const scrollContainer = messagesEndRef.current.closest('.overflow-y-auto');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        } else {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, conversationId]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(trimmed);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    
    msgs.forEach((msg) => {
      const msgDate = format(new Date(msg.createdAt), "MMM d, yyyy");
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: currentDate, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    });
    
    return groups;
  };

  const messageGroups = messages.length > 0 ? groupMessagesByDate(messages) : [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={group.date} className="space-y-3">
              {/* Date Separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs text-muted-foreground uppercase font-medium">
                  {group.date.toUpperCase()}
                </span>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              
              {/* Messages for this date */}
              {group.messages.map((message) => {
                const isOwnMessage = message.senderId === user?.id;
                const messageDate = new Date(message.createdAt);
                const timeStr = format(messageDate, "h:mm a");
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      isOwnMessage ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "flex flex-col max-w-[90%] sm:max-w-[80%]",
                      !isOwnMessage && "items-start"
                    )}>
                      {/* Message Bubble */}
                      <div
                        className={cn(
                          "rounded-lg px-4 py-3 text-sm whitespace-pre-wrap",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted border border-border text-foreground"
                        )}
                      >
                        {message.content}
                      </div>
                      
                      {/* Timestamp and Avatar */}
                      <div className={cn(
                        "flex items-end gap-2 mt-1",
                        isOwnMessage ? "justify-end" : "justify-start"
                      )}>
                        <span className="text-xs text-muted-foreground">
                          {timeStr}
                        </span>
                        {!isOwnMessage && otherParticipant && (
                          <div className="flex-shrink-0">
                            {otherParticipant.avatar ? (
                              <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                <Image
                                  src={otherParticipant.avatar}
                                  alt={otherParticipant.name}
                                  fill
                                  className="object-cover"
                                  sizes="24px"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-[10px] font-medium text-muted-foreground">
                                  {otherParticipant.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-muted/30 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 rounded-lg border border-border bg-background p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message ..."
              className="w-full min-h-[60px] max-h-[160px] resize-none border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none"
              disabled={isSending}
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className={cn(
              "px-6 py-3 rounded-lg font-medium text-sm transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2"
            )}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                SEND <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

