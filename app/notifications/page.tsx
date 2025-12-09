"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import {
  Notification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  formatNotificationTime,
  NotificationType,
} from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (!user || loading) return;

    const fetchNotifications = async () => {
      if (!supabase) {
        console.error("Supabase client not configured.");
        setLoadingNotifications(false);
        return;
      }
      try {
        const notifs = await getUserNotifications(user.id, supabase);
        setNotifications(notifs);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription
    if (!supabase) return;
    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, loading, supabase]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user || !supabase) return;

    await markNotificationAsRead(notificationId, user.id, supabase);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    if (!user || !supabase) return;

    await markAllNotificationsAsRead(user.id, supabase);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "welcome":
        return <Mail className="h-5 w-5 text-blue-500" />;
      case "message":
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case "invitation":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case "submission":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "assignment":
        return <CheckCircle2 className="h-5 w-5 text-orange-500" />;
      case "course":
        return <BookOpen className="h-5 w-5 text-indigo-500" />;
      case "achievement":
        return <Award className="h-5 w-5 text-yellow-500" />;
      case "feedback":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case "team":
        return <Users className="h-5 w-5 text-cyan-500" />;
      case "project":
        return <FolderKanban className="h-5 w-5 text-pink-500" />;
      case "badge":
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case "system":
        return <Settings className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading || loadingNotifications) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Please sign in to view your notifications.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              You're all caught up! New notifications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "transition-colors",
                !notification.read && "bg-muted/50 border-primary/20"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                    {!notification.read && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3
                          className={cn(
                            "text-sm font-medium mb-1",
                            !notification.read && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatNotificationTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="flex-shrink-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {notification.link && (
                      <div className="mt-3">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={notification.link}>View</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

