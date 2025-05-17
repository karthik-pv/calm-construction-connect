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

/**
 * Custom hook to manage notifications for the current user
 */
export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);

  // Get all notifications for the current user
  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log("Fetching notifications for user:", user.id);

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

        console.log(
          `Found ${data?.length || 0} notifications in database:`,
          data
        );

        // Map 'read' to 'is_read' for consistency in the frontend
        const mappedData = data.map((item) => ({
          ...item,
          is_read: item.read,
        })) as Notification[];

        if (!hasInitiallyFetched) {
          setHasInitiallyFetched(true);
        }

        return mappedData;
      } catch (e) {
        console.error("Unexpected error in notificationsQuery:", e);
        return []; // Return empty array instead of throwing
      }
    },
    enabled: !!user?.id,
    retry: 3, // Retry failed requests 3 times
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000, // Automatically check for new notifications every minute
  });

  // Force a refresh when the component mounts
  useEffect(() => {
    if (user?.id && !hasInitiallyFetched) {
      console.log("Initial notification fetch for user:", user.id);
      notificationsQuery.refetch();
    }
  }, [user?.id, notificationsQuery, hasInitiallyFetched]);

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

  // Log the notification status whenever it changes
  useEffect(() => {
    console.log("Current notification state:", {
      total: notificationsQuery.data?.length || 0,
      unread: unreadCount,
      isLoading: notificationsQuery.isLoading,
      isError: notificationsQuery.isError,
    });
  }, [
    notificationsQuery.data,
    unreadCount,
    notificationsQuery.isLoading,
    notificationsQuery.isError,
  ]);

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
    refetch: notificationsQuery.refetch,
  };
}

/**
 * Function to send a notification to a specific user
 * This is designed to be called from anywhere in the application,
 * and will reliably store the notification in the database.
 */
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
  const retryCount = 3; // Number of retry attempts

  // Log notification attempt
  console.log(`Attempting to send notification to user ${userId}`, {
    title,
    type,
    message: message.substring(0, 30) + "...",
  });

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
    read: false,
  };

  // Only add optional fields if they exist
  if (link) {
    notificationData.link = link;
  }

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      // First try a simple insert without selecting
      const { error } = await supabase
        .from("notifications")
        .insert([notificationData]);

      if (!error) {
        console.log(`Notification sent successfully on attempt ${attempt}`);
        return {
          id: "unknown", // We don't need the ID for most operations
          user_id: userId,
          title,
          message,
          type,
          link,
          is_read: false,
          created_at: new Date().toISOString(),
        };
      }

      // If there was an error, log it and try alternative methods
      console.error(`Attempt ${attempt} failed:`, error.message);

      // If this was a constraint error, we might need to handle it differently
      if (error.message.includes("violates check constraint")) {
        console.warn("Constraint violation - check notification type values");
      }

      // If it's the final attempt, try the RPC function as a last resort
      if (attempt === retryCount) {
        console.log("Trying RPC function as final attempt");
        const { error: rpcError } = await supabase.rpc("create_notification", {
          p_user_id: userId,
          p_title: title,
          p_message: message,
          p_type: type,
          p_link: link || null,
        });

        if (!rpcError) {
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
        }

        console.error("RPC attempt failed:", rpcError);
      }

      // Wait before retrying with exponential backoff
      if (attempt < retryCount) {
        const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms, etc.
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (e) {
      console.error(`Unexpected error on attempt ${attempt}:`, e);

      // Wait before retrying
      if (attempt < retryCount) {
        const delay = Math.pow(2, attempt) * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // If we've exhausted all retries, log the failure but don't throw
  // This ensures that even if notifications fail, other operations can continue
  console.error(`Failed to send notification after ${retryCount} attempts`);
  return null;
}
