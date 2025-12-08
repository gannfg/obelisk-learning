"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  FileText,
  MessageSquare,
  Award,
  UserPlus,
  CheckCircle2,
  BookOpen,
  Users,
  FolderKanban,
  Trophy,
  Settings,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Notification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  formatNotificationTime,
  NotificationType,
} from "@/lib/notifications";
import { SupabaseClient } from "@supabase/supabase-js";

interface NotificationsDropdownProps {
  userId: string;
  supabase: SupabaseClient;
}

export function NotificationsDropdown({
  userId,
  supabase,
}: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      const [notifs, count] = await Promise.all([
        getUserNotifications(userId, supabase, { limit: 20 }),
        getUnreadNotificationCount(userId, supabase),
      ]);

      setNotifications(notifs);
      setNotificationCount(count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch notifications when changes occur
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id, userId, supabase);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      setNotificationCount((prev) => Math.max(0, prev - 1));
    }
    setOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId, supabase);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setNotificationCount(0);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "welcome":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "invitation":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "submission":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "assignment":
        return <CheckCircle2 className="h-4 w-4 text-orange-500" />;
      case "course":
        return <BookOpen className="h-4 w-4 text-indigo-500" />;
      case "achievement":
        return <Award className="h-4 w-4 text-yellow-500" />;
      case "feedback":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "team":
        return <Users className="h-4 w-4 text-cyan-500" />;
      case "project":
        return <FolderKanban className="h-4 w-4 text-pink-500" />;
      case "badge":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "system":
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <div className="px-3 py-2 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {notificationCount > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">
                    {notificationCount} new
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all read
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="py-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  asChild
                  className={cn(
                    "flex items-start gap-3 px-3 py-3 cursor-pointer",
                    !notification.read && "bg-muted/50"
                  )}
                >
                  <Link
                    href={notification.link || "#"}
                    onClick={() => handleNotificationClick(notification)}
                    className="flex items-start gap-3 w-full"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex-shrink-0",
                        !notification.read && "relative"
                      )}
                    >
                      {getNotificationIcon(notification.type)}
                      {!notification.read && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium mb-0.5",
                          !notification.read && "font-semibold"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatNotificationTime(notification.created_at)}
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No notifications
              </p>
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="flex items-center justify-center w-full text-sm font-medium"
              >
                View All Notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

