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
  Check,
  X,
  Loader2,
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
  deleteNotification,
} from "@/lib/notifications";
import { SupabaseClient } from "@supabase/supabase-js";
import { acceptTeamInvitation, rejectTeamInvitation } from "@/lib/team-invitations";

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
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      const [notifs, count] = await Promise.all([
        getUserNotifications(userId, supabase, { limit: 20 }),
        getUnreadNotificationCount(userId, supabase),
      ]);

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
                await deleteNotification(notif.id, userId, supabase);
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
      
      // Recalculate unread count after filtering
      const unreadCount = filtered.filter(n => !n.read).length;
      setNotificationCount(unreadCount);
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
    // Mark as read if not already read
    if (!notification.read) {
      await markNotificationAsRead(notification.id, userId, supabase);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      setNotificationCount((prev) => Math.max(0, prev - 1));
    }

    // If it's a team invitation notification, check if invitation is already processed
    if (notification.type === "team" && notification.metadata?.type === "team_invitation" && notification.metadata?.invitation_id) {
      try {
        const { data: invitation, error: invitationError } = await supabase
          .from("team_invitations")
          .select("status")
          .eq("id", notification.metadata.invitation_id)
          .maybeSingle();

        // If invitation doesn't exist or is already accepted or rejected, remove the notification
        if (invitationError || !invitation || (invitation.status === "accepted" || invitation.status === "rejected")) {
          await deleteNotification(notification.id, userId, supabase);
          fetchNotifications();
        }
      } catch (error) {
        // Ignore errors checking invitation status
      }
    }

    setOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId, supabase);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setNotificationCount(0);
  };

  const handleAcceptInvitation = async (notification: Notification) => {
    if (!notification.metadata?.invitation_id) return;

    setProcessingInvitation(notification.id);
    try {
      const success = await acceptTeamInvitation(
        notification.metadata.invitation_id,
        userId,
        supabase
      );

      // Always delete notification after processing (whether success or failure)
      // If it failed, the invitation was likely already processed
      await deleteNotification(notification.id, userId, supabase);
      fetchNotifications();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      // Still try to delete notification if invitation was already processed
      try {
        await deleteNotification(notification.id, userId, supabase);
        fetchNotifications();
      } catch (deleteError) {
        console.error("Error deleting notification:", deleteError);
      }
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleRejectInvitation = async (notification: Notification) => {
    if (!notification.metadata?.invitation_id) return;

    setProcessingInvitation(notification.id);
    try {
      const success = await rejectTeamInvitation(
        notification.metadata.invitation_id,
        userId,
        supabase
      );

      // Always delete notification after processing
      await deleteNotification(notification.id, userId, supabase);
      fetchNotifications();
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      // Still try to delete notification
      try {
        await deleteNotification(notification.id, userId, supabase);
        fetchNotifications();
      } catch (deleteError) {
        console.error("Error deleting notification:", deleteError);
      }
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Optimistically remove the notification from the UI
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    if (notificationToDelete && !notificationToDelete.read) {
      setNotificationCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    
    try {
      const success = await deleteNotification(notificationId, userId, supabase);
      if (!success) {
        // If deletion failed, restore the notification
      fetchNotifications();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      // Restore the notification on error
      fetchNotifications();
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "welcome":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "invitation":
        return <UserPlus className="h-4 w-4 text-green-700 dark:text-green-500" />;
      case "submission":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "assignment":
        return <CheckCircle2 className="h-4 w-4 text-orange-500" />;
      case "course":
        return <BookOpen className="h-4 w-4 text-indigo-500" />;
      case "achievement":
        return <Award className="h-4 w-4 text-yellow-500" />;
      case "feedback":
        return <MessageSquare className="h-4 w-4 text-green-700 dark:text-green-500" />;
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
              {notifications.map((notification) => {
                const isTeamInvitation =
                  notification.type === "team" &&
                  notification.metadata?.type === "team_invitation" &&
                  notification.metadata?.invitation_id;

                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "group flex flex-col items-start gap-3 px-3 py-3",
                      !notification.read && "bg-muted/50",
                      !isTeamInvitation && "cursor-pointer",
                      "hover:bg-muted/60 focus:bg-muted/60 hover:text-foreground focus:text-foreground transition-colors"
                    )}
                    onSelect={(e) => {
                      if (isTeamInvitation) {
                        e.preventDefault();
                      } else {
                        handleNotificationClick(notification);
                        if (notification.link && notification.link !== "#") {
                          window.location.href = notification.link;
                        }
                      }
                    }}
                  >
                    <div className="flex items-start gap-3 w-full relative">
                      <button
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                        className="absolute top-0 right-0 p-1.5 rounded-md hover:bg-muted/80 transition-all opacity-0 group-hover:opacity-100 z-10"
                        aria-label="Delete notification"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                      </button>
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
                            "text-sm font-medium mb-0.5 text-foreground",
                            !notification.read && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {formatNotificationTime(notification.created_at)}
                        </p>
                        {isTeamInvitation && (
                          <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptInvitation(notification)}
                              disabled={processingInvitation === notification.id}
                              className="h-6 text-xs px-2"
                            >
                              {processingInvitation === notification.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 mr-1" />
                              )}
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectInvitation(notification)}
                              disabled={processingInvitation === notification.id}
                              className="h-6 text-xs px-2"
                            >
                              {processingInvitation === notification.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <X className="h-3 w-3 mr-1" />
                              )}
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
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

