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
  deleteNotification,
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
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { acceptTeamInvitation, rejectTeamInvitation } from "@/lib/team-invitations";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

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
        
        // Filter out notifications for already-processed team invitations
        const validNotifications = await Promise.all(
          notifs.map(async (notif) => {
            if (notif.type === "team" && notif.metadata?.type === "team_invitation" && notif.metadata?.invitation_id) {
              try {
                const { data: invitation, error: invitationError } = await supabase
                  .from("team_invitations")
                  .select("status")
                  .eq("id", notif.metadata.invitation_id)
                  .maybeSingle();

                // If invitation doesn't exist or is already processed, delete the notification
                if (invitationError || !invitation || (invitation.status === "accepted" || invitation.status === "rejected")) {
                  await deleteNotification(notif.id, user.id, supabase);
                  return null; // Filter out this notification
                }
              } catch (error) {
                // Ignore errors, keep the notification
              }
            }
            return notif;
          })
        );

        // Remove null values (deleted notifications)
        const filtered = validNotifications.filter((n): n is Notification => n !== null);
        setNotifications(filtered);
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

  const handleAcceptInvitation = async (notification: Notification) => {
    if (!user || !supabase || !notification.metadata?.invitation_id) return;

    setProcessingInvitation(notification.id);
    try {
      const success = await acceptTeamInvitation(
        notification.metadata.invitation_id,
        user.id,
        supabase
      );

      // Always delete notification after processing (whether success or failure)
      // If it failed, the invitation was likely already processed
      await deleteNotification(notification.id, user.id, supabase);
      const notifs = await getUserNotifications(user.id, supabase);
      setNotifications(notifs);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      // Still try to delete notification if invitation was already processed
      try {
        await deleteNotification(notification.id, user.id, supabase);
        const notifs = await getUserNotifications(user.id, supabase);
        setNotifications(notifs);
      } catch (deleteError) {
        console.error("Error deleting notification:", deleteError);
      }
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleRejectInvitation = async (notification: Notification) => {
    if (!user || !supabase || !notification.metadata?.invitation_id) return;

    setProcessingInvitation(notification.id);
    try {
      const success = await rejectTeamInvitation(
        notification.metadata.invitation_id,
        user.id,
        supabase
      );

      // Always delete notification after processing
      await deleteNotification(notification.id, user.id, supabase);
      const notifs = await getUserNotifications(user.id, supabase);
      setNotifications(notifs);
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      // Still try to delete notification
      try {
        await deleteNotification(notification.id, user.id, supabase);
        const notifs = await getUserNotifications(user.id, supabase);
        setNotifications(notifs);
      } catch (deleteError) {
        console.error("Error deleting notification:", deleteError);
      }
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!user || !supabase) return;
    try {
      await deleteNotification(notificationId, user.id, supabase);
      const notifs = await getUserNotifications(user.id, supabase);
      setNotifications(notifs);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
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
      <div className="container mx-auto px-3 py-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-3 py-4">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Please sign in to view your notifications.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 py-4 max-w-4xl">
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
                "group transition-colors hover:bg-muted/50 hover:text-foreground",
                !notification.read && "bg-muted/50 border-primary/20"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4 relative">
                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 z-10"
                    aria-label="Delete notification"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
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
                            "text-sm font-medium mb-1 text-foreground",
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
                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                      {notification.type === "team" &&
                        notification.metadata?.type === "team_invitation" &&
                        notification.metadata?.invitation_id && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptInvitation(notification)}
                              disabled={processingInvitation === notification.id}
                              className="flex-1"
                            >
                              {processingInvitation === notification.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 mr-2" />
                              )}
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectInvitation(notification)}
                              disabled={processingInvitation === notification.id}
                              className="flex-1"
                            >
                              {processingInvitation === notification.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <X className="h-4 w-4 mr-2" />
                              )}
                              Reject
                            </Button>
                          </>
                        )}
                      {notification.link &&
                        notification.type !== "team" &&
                        !(notification.metadata?.type === "team_invitation") && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={notification.link}>View</Link>
                          </Button>
                        )}
                    </div>
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

