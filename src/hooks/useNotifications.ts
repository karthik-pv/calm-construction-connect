import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  type:
    | "appointment_request"
    | "appointment_confirmed"
    | "appointment_rejected"
    | "system";
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all notifications for the current user
  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching notifications:", error);
          return []; // Return empty array instead of throwing
        }

        // Map 'read' to 'is_read' for consistency in the frontend
        return data.map((item) => ({
          ...item,
          is_read: item.read,
        })) as Notification[];
      } catch (e) {
        console.error("Unexpected error in notificationsQuery:", e);
        return []; // Return empty array instead of throwing
      }
    },
    enabled: !!user?.id,
    retry: 3, // Retry failed requests 3 times
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Create a new notification
  const createNotification = useMutation({
    mutationFn: async (
      notification: Omit<Notification, "id" | "created_at">
    ) => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .insert([
            {
              user_id: notification.user_id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              link: notification.link,
              read: notification.is_read, // Map is_read to read for the database
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("Error creating notification:", error);
          return null; // Return null instead of throwing
        }

        // Map back to our interface format
        return {
          ...data,
          is_read: data.read,
        };
      } catch (e) {
        console.error("Unexpected error in createNotification:", e);
        return null; // Return null instead of throwing
      }
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    },
  });

  // Mark a notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .update({ read: true }) // Use 'read' instead of 'is_read'
          .eq("id", notificationId)
          .select()
          .single();

        if (error) {
          console.error("Error marking notification as read:", error);
          return null; // Return null instead of throwing
        }

        return {
          ...data,
          is_read: data.read,
        };
      } catch (e) {
        console.error("Unexpected error in markAsRead:", e);
        return null; // Return null instead of throwing
      }
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    },
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return null;

      try {
        const { data, error } = await supabase
          .from("notifications")
          .update({ read: true }) // Use 'read' instead of 'is_read'
          .eq("user_id", user.id)
          .eq("read", false) // Use 'read' instead of 'is_read'
          .select();

        if (error) {
          console.error("Error marking all notifications as read:", error);
          return null; // Return null instead of throwing
        }

        return data.map((item) => ({
          ...item,
          is_read: item.read,
        }));
      } catch (e) {
        console.error("Unexpected error in markAllAsRead:", e);
        return null; // Return null instead of throwing
      }
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        toast.success("All notifications marked as read");
      }
    },
  });

  // Delete a notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", notificationId);

        if (error) {
          console.error("Error deleting notification:", error);
          return null; // Return null instead of throwing
        }

        return { id: notificationId };
      } catch (e) {
        console.error("Unexpected error in deleteNotification:", e);
        return null; // Return null instead of throwing
      }
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    },
  });

  // Count unread notifications
  const unreadCount =
    notificationsQuery.data?.filter((n) => !n.is_read).length || 0;

  return {
    notifications: notificationsQuery.data || [],
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    error: notificationsQuery.error,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

// Function to send notification to a user
export async function sendNotification({
  userId,
  title,
  message,
  link,
  type = "system",
}: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  type?:
    | "appointment_request"
    | "appointment_confirmed"
    | "appointment_rejected"
    | "system";
}) {
  console.log(`Attempting to send notification to user ${userId}`, {
    title,
    type,
    message: message.substring(0, 30) + "...",
  });

  try {
    // Create the basic notification payload with guaranteed fields
    const notificationData: {
      user_id: string;
      title: string;
      message: string;
      type:
        | "appointment_request"
        | "appointment_confirmed"
        | "appointment_rejected"
        | "system";
      read: boolean;
      link?: string;
    } = {
      user_id: userId,
      title,
      message,
      type,
      // Use read field directly instead of is_read for the database
      read: false,
    };

    // Only add optional fields if they exist
    if (link) {
      notificationData.link = link;
    }

    // First approach: Insert with select to get the complete record back
    console.log("Sending notification - first attempt with select");
    const { data, error } = await supabase
      .from("notifications")
      .insert([notificationData])
      .select()
      .single();

    if (error) {
      console.error("First notification attempt failed:", error);

      // Second approach: Insert without select
      console.log("Sending notification - second attempt without select");
      const fallbackResult = await supabase
        .from("notifications")
        .insert([notificationData]);

      if (fallbackResult.error) {
        console.error(
          "Second notification attempt failed:",
          fallbackResult.error
        );

        // Third approach: Use RPC if available
        try {
          console.log("Sending notification - third attempt via direct SQL");
          const { error: rpcError } = await supabase.rpc(
            "create_notification",
            {
              p_user_id: userId,
              p_title: title,
              p_message: message,
              p_type: type,
              p_link: link || null,
            }
          );

          if (rpcError) {
            console.error("Third notification attempt failed:", rpcError);
            return null;
          }

          console.log("Notification sent successfully via RPC");
          return {
            id: "unknown",
            user_id: userId,
            title,
            message,
            type,
            link,
            is_read: false,
            created_at: new Date().toISOString(),
          };
        } catch (rpcError) {
          console.error("RPC notification attempt error:", rpcError);

          // Final fallback: Check if the notifications table exists and has proper columns
          const { data: tableInfo, error: tableError } = await supabase
            .from("information_schema.columns")
            .select("column_name, table_name")
            .eq("table_name", "notifications")
            .eq("table_schema", "public");

          if (tableError) {
            console.error("Error checking notifications table:", tableError);
          } else {
            console.log("Notifications table structure:", tableInfo);
          }

          return null;
        }
      }

      console.log("Notification sent successfully without returning data");
      return {
        id: "unknown",
        user_id: userId,
        title,
        message,
        type,
        link,
        is_read: false,
        created_at: new Date().toISOString(),
      };
    }

    console.log("Notification sent successfully with complete data");
    return {
      ...data,
      is_read: data.read,
    };
  } catch (error) {
    console.error("Unexpected error in sendNotification:", error);
    return null;
  }
}
