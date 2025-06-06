// src/hooks/useChat.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { UserProfile } from "@/contexts/AuthContext";

export interface ChatMessage {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    user_role?: string;
  };
  receiver?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    user_role?: string;
  };
}

export interface ChatPartner extends UserProfile {} // Reuse UserProfile for partners

export interface Conversation {
  id: string;
  name: string;
  profilePic?: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderId: string; // ID of the user who sent the last message
  online: boolean;
  unreadCount: number;
  user_role?: string;
}

// Format a timestamp as a relative time string
export const formatMessageTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
};

// --- Fetch Chat Partners (Users the current user has messaged or received messages from) ---
const fetchChatPartners = async (userId: string): Promise<ChatPartner[]> => {
  // Find unique IDs of users the current user has chatted with
  const { data: messagePartners, error: messageError } = await supabase.rpc(
    "get_chat_partners",
    { current_user_id: userId }
  );

  if (messageError) {
    console.error("Error fetching chat partner IDs:", messageError);
    throw new Error(messageError.message);
  }

  if (!messagePartners || messagePartners.length === 0) {
    return [];
  }

  // Fetch profile details for these partners
  const partnerIds = messagePartners.map((p: any) => p.other_user_id);

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*") // Select all profile fields for partners
    .in("id", partnerIds);

  if (profileError) {
    console.error("Error fetching chat partner profiles:", profileError);
    throw new Error(profileError.message);
  }

  return profiles || [];
};

// You need to create this PostgreSQL function in Supabase SQL Editor:
/*
CREATE OR REPLACE FUNCTION get_chat_partners(current_user_id uuid)
RETURNS TABLE(other_user_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT partner_id
  FROM (
    SELECT receiver_id as partner_id FROM public.chat_messages WHERE sender_id = current_user_id
    UNION
    SELECT sender_id as partner_id FROM public.chat_messages WHERE receiver_id = current_user_id
  ) AS partners;
END;
$$ LANGUAGE plpgsql;
*/

export function useChatPartners() {
  const { user } = useAuth();
  return useQuery<ChatPartner[], Error>({
    queryKey: ["chatPartners", user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return fetchChatPartners(user.id);
    },
    enabled: !!user?.id, // Only run if user ID is available
  });
}

// --- Fetch Messages for a Specific Conversation ---
const fetchMessages = async (
  userId: string,
  partnerId: string
): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      `
      *,
      sender:sender_id(id, full_name, avatar_url, user_role),
      receiver:receiver_id(id, full_name, avatar_url, user_role)
    `
    )
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    throw new Error(error.message);
  }
  return data || [];
};

export function useChatMessages(partnerId: string | null) {
  const { user } = useAuth();
  const queryKey = ["chatMessages", user?.id, partnerId];

  return useQuery<ChatMessage[], Error>({
    queryKey: queryKey,
    queryFn: () => {
      if (!user?.id || !partnerId)
        throw new Error("User or partner ID missing");
      return fetchMessages(user.id, partnerId);
    },
    enabled: !!user?.id && !!partnerId, // Only run query if both IDs are present
    refetchInterval: 3000, // Refetch every 3 seconds to keep messages up to date
    refetchOnWindowFocus: true, // Refetch when user returns to this window
    staleTime: 2000, // Consider data stale after 2 seconds to ensure frequent updates
  });
}

// --- Send Message ---
const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string
) => {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([{ sender_id: senderId, receiver_id: receiverId, content }])
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    toast.error("Failed to send message.");
    throw new Error(error.message);
  }
  return data;
};

export function useSendChatMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      receiverId,
      content,
    }: {
      receiverId: string;
      content: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      if (!content.trim()) throw new Error("Message cannot be empty");
      return sendMessage(user.id, receiverId, content);
    },
    onSuccess: (newMessage, variables) => {
      // Optimistically update the messages list or invalidate
      queryClient.invalidateQueries({
        queryKey: ["chatMessages", user?.id, variables.receiverId],
      });
      // Also invalidate chat partners list in case this is a new conversation
      queryClient.invalidateQueries({ queryKey: ["chatPartners", user?.id] });
    },
    onError: (error) => {
      console.error("Mutation error sending message:", error);
      // Toast handled in sendMessage
    },
  });
}

// --- Realtime Subscription Hook ---
export function useChatSubscription(partnerId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user?.id || !partnerId) {
      // Clean up channel if it exists
      if (channel) {
        supabase.removeChannel(channel);
        setChannel(null);
      }
      return;
    }

    // Only create new channel if one doesn't exist
    if (channel) {
      console.log("Channel already exists, not recreating");
      return;
    }

    console.log(
      `Setting up realtime subscription for user ${user.id} with partner ${partnerId}`
    );

    const newChannel = supabase
      .channel(`chat-${user.id}-${partnerId}`)
      // Listen for messages sent BY the user
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `sender_id=eq.${user.id}`, // Filter for messages sent BY me
        },
        async (payload) => {
          console.log("Realtime INSERT received (sent by me):", payload);
          await queryClient.invalidateQueries({
            queryKey: ["chatMessages", user.id, partnerId],
          });
        }
      )
      // Listen for messages received BY the user
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `receiver_id=eq.${user.id}`, // Filter for messages sent TO me
        },
        async (payload) => {
          console.log("Realtime INSERT received (sent to me):", payload);
          // Check if the message is from the currently active partner
          if (payload.new.sender_id === partnerId) {
            await queryClient.invalidateQueries({
              queryKey: ["chatMessages", user.id, partnerId],
            });
            // Could optimistically update
          } else {
            // Just log for non-active chat partners
            console.log("Received message from non-active chat partner");
          }
          // Invalidate partners list if it's a new sender
          await queryClient.invalidateQueries({
            queryKey: ["chatPartners", user?.id],
          });
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(`Subscribed to chat channel for user ${user.id}`);
        }
        if (status === "CHANNEL_ERROR") {
          console.error("Realtime channel error:", err);
          console.error("Chat connection error.");
        }
        if (status === "TIMED_OUT") {
          console.warn("Realtime connection timed out.");
          console.warn("Chat connection timed out, attempting to reconnect.");
        }
      });

    setChannel(newChannel);

    // Cleanup: Remove channel on component unmount or when partnerId/userId changes
    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
        setChannel(null);
      }
    };
    // Re-run effect if the active partnerId or user changes
  }, [partnerId, user?.id, queryClient, channel]);

  return {
    isSubscribed: !!channel,
  };
}

// Hook for fetching chat conversations (unique users the current user has chatted with)
export const useChatConversations = (
  options: {
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
  } = {}
) => {
  const { profile } = useAuth();
  const userRole = profile?.user_role;

  const fetchConversations = async (): Promise<Conversation[]> => {
    if (!profile?.id) return [];

    // Different query logic based on user role
    const targetRole = userRole === "patient" ? "therapist" : "patient";

    // First, get all users of the target role as potential conversation partners
    const { data: potentialPartners, error: partnersError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_role", targetRole);

    if (partnersError) {
      console.error("Error fetching potential partners:", partnersError);
      toast.error("Failed to load conversation partners");
      throw partnersError;
    }

    // For each user, check if there are any messages between them and the current user
    const conversations: Conversation[] = await Promise.all(
      (potentialPartners || []).map(async (user) => {
        // Get the most recent message between these users
        const { data: recentMessages, error: messagesError } = await supabase
          .from("chat_messages")
          .select("*")
          .or(
            `and(sender_id.eq.${profile.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${profile.id})`
          )
          .order("created_at", { ascending: false })
          .limit(1);

        if (messagesError) {
          console.error("Error fetching recent messages:", messagesError);
          throw messagesError;
        }

        const lastMessage = recentMessages?.[0];

        // Count unread messages (where receiver is current user and they haven't been read)
        const { count: unreadCount, error: unreadError } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("sender_id", user.id)
          .eq("receiver_id", profile.id)
          .eq("read", false);

        if (unreadError) {
          console.error("Error counting unread messages:", unreadError);
          throw unreadError;
        }

        return {
          id: user.id,
          name: user.full_name || "Unknown User",
          profilePic: user.avatar_url || undefined,
          lastMessage: lastMessage?.content || "No messages yet",
          lastMessageTime: lastMessage
            ? formatMessageTime(lastMessage.created_at)
            : "",
          lastMessageSenderId: lastMessage?.sender_id || "",
          online: user.status === "active",
          unreadCount: unreadCount || 0,
          user_role: user.user_role,
        };
      })
    );

    // Sort conversations: first by whether there are messages, then by those with unread messages, then by most recent
    return conversations
      .filter((conv) => conv.lastMessageTime !== "") // Only show conversations with messages
      .sort((a, b) => {
        // First sort by unread count (desc)
        if (a.unreadCount !== b.unreadCount) {
          return b.unreadCount - a.unreadCount;
        }

        // Then by recency of last message
        const aTime = a.lastMessageTime;
        const bTime = b.lastMessageTime;

        if (aTime === "Just now") return -1;
        if (bTime === "Just now") return 1;
        if (aTime === "Today" && bTime !== "Just now") return -1;
        if (bTime === "Today" && aTime !== "Just now") return 1;
        if (aTime === "Yesterday" && !["Just now", "Today"].includes(bTime))
          return -1;
        if (bTime === "Yesterday" && !["Just now", "Today"].includes(aTime))
          return 1;

        return 0; // Default case
      });
  };

  return useQuery<Conversation[], Error>({
    queryKey: ["chatConversations", profile?.id],
    queryFn: fetchConversations,
    enabled: !!profile?.id,
    refetchInterval: options.refetchInterval || 10000, // Default to 10 seconds or use provided option
    refetchOnWindowFocus: options.refetchOnWindowFocus,
    refetchOnMount: options.refetchOnMount,
  });
};

// Hook for marking messages as read
export const useMarkMessagesAsRead = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (senderId: string) => {
      if (!profile?.id)
        throw new Error("You must be logged in to mark messages as read");

      console.log(
        `Marking messages from ${senderId} as read for ${profile.id}`
      );

      try {
        // First, check if there are any unread messages to update
        const { data: unreadMessages, error: checkError } = await supabase
          .from("chat_messages")
          .select("id, content")
          .eq("sender_id", senderId)
          .eq("receiver_id", profile.id)
          .eq("read", false);

        if (checkError) {
          console.error("Error checking unread messages:", checkError);
          throw checkError;
        }

        if (!unreadMessages || unreadMessages.length === 0) {
          console.log("No unread messages found to mark as read");
          return [];
        }

        console.log(
          `Found ${unreadMessages.length} unread messages to mark as read`
        );

        // Now update the messages
        const { data, error } = await supabase
          .from("chat_messages")
          .update({ read: true })
          .eq("sender_id", senderId)
          .eq("receiver_id", profile.id)
          .eq("read", false)
          .select();

        if (error) {
          console.error("Supabase error marking messages as read:", error);
          throw error;
        }

        console.log(
          `Successfully marked ${
            data?.length || 0
          } messages as read in the database`
        );
        return data;
      } catch (err) {
        console.error("Error in markMessagesAsRead mutation:", err);
        toast.error("Failed to mark messages as read");
        throw err;
      }
    },
    onSuccess: (data, senderId) => {
      console.log(`Success callback: Updated ${data?.length || 0} messages`);

      // Invalidate and refetch the messages query for this specific conversation
      queryClient.invalidateQueries({
        queryKey: ["chatMessages", profile?.id, senderId],
      });

      // Invalidate the conversations list with the correct key to update unread counts
      queryClient.invalidateQueries({
        queryKey: ["chatConversations", profile?.id],
      });

      // Force a refetch to ensure UI updates immediately
      queryClient.refetchQueries({
        queryKey: ["chatConversations", profile?.id],
      });
    },
    onError: (error) => {
      console.error("Error marking messages as read:", error);
      toast.error("Failed to mark messages as read");
    },
  });
};

// Hook for fetching all available experts for a patient to chat with
export const useAvailableTherapists = () => {
  const { profile } = useAuth();

  const fetchExperts = async (): Promise<Conversation[]> => {
    if (!profile?.id || profile.user_role !== "patient") return [];

    const { data: experts, error } = await supabase
      .from("profiles")
      .select("*")
      .in("user_role", [
        "therapist",
        "relationship_expert",
        "financial_expert",
        "dating_coach",
        "health_wellness_coach",
      ])
      .eq("status", "active");

    if (error) {
      console.error("Error fetching experts:", error);
      toast.error("Failed to load available experts");
      throw error;
    }

    return (experts || []).map((expert) => ({
      id: expert.id,
      name: expert.full_name || "Unnamed Expert",
      profilePic: expert.avatar_url || undefined,
      lastMessage: "Start a conversation",
      lastMessageTime: "",
      lastMessageSenderId: "",
      online: expert.status === "active",
      unreadCount: 0,
      user_role: expert.user_role,
    }));
  };

  return useQuery<Conversation[], Error>({
    queryKey: ["available-experts"],
    queryFn: fetchExperts,
    enabled: !!profile?.id && profile.user_role === "patient",
  });
};
