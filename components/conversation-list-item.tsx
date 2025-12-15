"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Conversation } from "@/lib/messages";
import { cn } from "@/lib/utils";
// Using a simple time formatting function instead of date-fns

interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId: string;
  isSelected?: boolean;
}

export function ConversationListItem({
  conversation,
  currentUserId,
  isSelected,
}: ConversationListItemProps) {
  // Get the other participant (for direct messages)
  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== currentUserId
  );

  // For group chats, show multiple participants
  const isGroup = conversation.type === "group";
  const displayName = isGroup
    ? `Group Chat (${conversation.participants.length})`
    : otherParticipant?.user?.name || "Unknown User";

  const displayAvatar = isGroup
    ? null
    : otherParticipant?.user?.avatar;

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const lastMessageTime = conversation.lastMessage
    ? formatTimeAgo(conversation.lastMessage.createdAt)
    : null;

  return (
    <Link href={`/messages/${conversation.id}`}>
      <Card
        className={cn(
          "transition-all duration-200 cursor-pointer mb-2",
          isSelected
            ? "ring-2 ring-primary bg-primary/5"
            : "hover:bg-muted/50"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {displayAvatar ? (
              <Image
                src={displayAvatar}
                alt={displayName}
                width={40}
                height={40}
                className="rounded-full w-10 h-10 object-cover flex-shrink-0"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-muted-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-sm font-semibold truncate">{displayName}</h3>
                {conversation.unreadCount && conversation.unreadCount > 0 && (
                  <Badge variant="default" className="text-xs flex-shrink-0">
                    {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                  </Badge>
                )}
              </div>
              {conversation.lastMessage && (
                <>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                    {conversation.lastMessage.senderId === currentUserId
                      ? `You: ${conversation.lastMessage.content}`
                      : conversation.lastMessage.content}
                  </p>
                  {lastMessageTime && (
                    <p className="text-xs text-muted-foreground">{lastMessageTime}</p>
                  )}
                </>
              )}
              {!conversation.lastMessage && (
                <p className="text-xs text-muted-foreground italic">No messages yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

