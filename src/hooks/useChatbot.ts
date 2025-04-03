import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useGeminiChat } from "./useGeminiChat";

export interface ChatbotMessage {
  id: string;
  user_id: string;
  user_message: string;
  bot_response: string;
  created_at: string;
}

// Function to fetch chatbot messages
export async function fetchChatbotMessages(userId: string | undefined) {
  if (!userId) throw new Error("User not authenticated");
  
  const { data, error } = await supabase
    .from("chatbot_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
    
  if (error) {
    console.error("Error fetching chatbot messages:", error);
    throw error;
  }
  
  return data as ChatbotMessage[];
}

// Function to send a message to the chatbot
export async function sendChatbotMessage(
  userId: string, 
  message: string, 
  botResponse: string
) {
  const { data, error } = await supabase
    .from("chatbot_messages")
    .insert([
      {
        user_id: userId,
        user_message: message,
        bot_response: botResponse,
      },
    ])
    .select();
    
  if (error) {
    console.error("Error sending chatbot message:", error);
    toast.error("Failed to send message. Please try again.");
    throw error;
  }
  
  return data[0] as ChatbotMessage;
}

// Hook to fetch chatbot messages
export function useChatbotMessages() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ["chatbotMessages", profile?.id],
    queryFn: () => fetchChatbotMessages(profile?.id),
    enabled: !!profile?.id,
  });
}

// Hook to send a message to the chatbot
export function useSendChatbotMessage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { getGeminiResponse } = useGeminiChat();
  
  return useMutation({
    mutationFn: async (message: string) => {
      if (!profile?.id) throw new Error("User not authenticated");
      
      // Get response from Gemini AI - language detection now happens internally
      const botResponse = await getGeminiResponse(message);
      
      // Save both the user message and AI response
      return sendChatbotMessage(profile.id, message, botResponse);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbotMessages", profile?.id] });
    },
    onError: (error) => {
      console.error("Error in sendChatbotMessage mutation:", error);
      toast.error("Failed to get AI response. Please try again.");
    },
  });
} 