"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { Loader2, Paperclip, Send } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user?.id;
            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}
              >
                {!isOwnMessage && otherParticipant && (
                  <div className="mr-2 flex-shrink-0">
                    {otherParticipant.avatar ? (
                      <Image
                        src={otherParticipant.avatar}
                        alt={otherParticipant.name}
                        width={32}
                        height={32}
                        className="rounded-full w-8 h-8 object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          {otherParticipant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-col max-w-[90%] sm:max-w-[80%]">
                  {!isOwnMessage && (
                    <p className="text-xs text-muted-foreground mb-1 px-1">
                      {otherParticipant?.name || "User"}
                    </p>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border"
                    )}
                  >
                    {message.content}
                  </div>
                  <p className="text-xs text-muted-foreground px-1 mt-0.5">
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {/* Mobile pill-style composer */}
      <div className="border-t border-border bg-background/80 p-2 sm:hidden">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 shadow-sm">
          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center text-muted-foreground/70"
            aria-label="Add attachment (coming soon)"
            disabled
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 min-h-[34px] max-h-[120px] resize-none border-0 bg-transparent text-sm focus:outline-none focus-visible:outline-none"
            disabled={isSending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            aria-label="Send message"
            className="h-8 w-8 inline-flex items-center justify-center text-primary disabled:text-muted-foreground/60"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop composer */}
      <div className="hidden sm:block border-t border-border bg-background/80 p-4 space-y-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[72px] max-h-[160px] resize-y text-sm"
          disabled={isSending}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              "Send"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

