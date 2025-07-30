import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type SessionType = "breathing" | "meditation" | "grounding" | string; // Allow other types

export interface AnxietySessionStartData {
  session_type: SessionType;
  duration_seconds?: number; // Optional duration
}

export interface AnxietySession extends AnxietySessionStartData {
  id: number; // Session ID returned from DB
  user_id: string;
  started_at: string;
  completed_at?: string;
}

export interface AnxietyCalmerMedia {
  id: string;
  name: string;
  description: string | null;
  media_url: string;
  media_type: "audio" | "video";
  duration: number | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// --- Start Session ---
const startSession = async (
  userId: string,
  sessionData: AnxietySessionStartData
): Promise<AnxietySession> => {
  const { data, error } = await supabase
    .from("anxiety_calmer_sessions")
    .insert([
      {
        user_id: userId,
        session_type: sessionData.session_type,
        duration_seconds: sessionData.duration_seconds,
        // started_at is default now()
      },
    ])
    .select()
    .single(); // Return the created session

  if (error) {
    console.error("Error starting anxiety session:", error);
    toast.error("Failed to start session.");
    throw new Error(error.message);
  }
  return data;
};

export function useStartAnxietySession() {
  const { user } = useAuth();
  // No query invalidation needed usually, unless showing session history

  return useMutation({
    mutationFn: async (
      sessionData: AnxietySessionStartData
    ): Promise<AnxietySession> => {
      if (!user?.id) throw new Error("User not authenticated");
      return startSession(user.id, sessionData);
    },
    onError: (error) => {
      console.error("Mutation error starting session:", error);
      // Toast handled in startSession
    },
  });
}

// --- Complete Session ---
const completeSession = async (sessionId: number, userId: string) => {
  // Ensure user can only complete their own sessions (handled by RLS too)
  const { data, error } = await supabase
    .from("anxiety_calmer_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", userId) // Ensure ownership
    .select()
    .single();

  if (error) {
    console.error("Error completing anxiety session:", error);
    toast.error("Failed to mark session as complete.");
    throw new Error(error.message);
  }
  return data;
};

export function useCompleteAnxietySession() {
  const { user } = useAuth();
  // No query invalidation typically needed here unless displaying history

  return useMutation({
    mutationFn: async (sessionId: number) => {
      if (!user?.id) throw new Error("User not authenticated");
      return completeSession(sessionId, user.id);
    },
    onError: (error) => {
      console.error("Mutation error completing session:", error);
      // Toast handled in completeSession
    },
  });
}

export function useAnxietyCalmer() {
  return useQuery<AnxietyCalmerMedia[]>({
    queryKey: ["anxietyCalmer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anxiety_calmer")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching anxiety calmer data:", error);
        throw new Error(error.message);
      }

      return data || [];
    },
  });
}
