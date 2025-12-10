import { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "welcome"
  | "message"
  | "invitation"
  | "submission"
  | "assignment"
  | "course"
  | "achievement"
  | "feedback"
  | "team"
  | "project"
  | "badge"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, any>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  params: CreateNotificationParams,
  supabase: SupabaseClient
): Promise<Notification | null> {
  try {
    // Ensure metadata is a proper JSONB object
    const metadata = params.metadata && typeof params.metadata === 'object' 
      ? params.metadata 
      : {};

    const notificationData = {
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
      metadata: metadata,
    };

    const { data, error } = await supabase
      .from("notifications")
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        notificationData,
      });
      
      // If it's an RLS policy error, provide more context
      if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('permission')) {
        console.error("RLS Policy Error: User may not have permission to create notifications for this user_id");
      }
      
      return null;
    }

    if (!data) {
      console.error("No data returned from notification insert");
      return null;
    }

    return data as Notification;
  } catch (error: any) {
    console.error("Error creating notification (catch):", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return null;
  }
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  supabase: SupabaseClient,
  options?: {
    limit?: number;
    unreadOnly?: boolean;
  }
): Promise<Notification[]> {
  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (options?.unreadOnly) {
      query = query.eq("read", false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    return (data || []) as Notification[];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(
  userId: string,
  supabase: SupabaseClient
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting notification:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
}

/**
 * Format notification time (e.g., "2 hours ago")
 */
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType) {
  // This will be used in the UI component
  return type;
}

