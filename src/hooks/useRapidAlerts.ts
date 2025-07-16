import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendBulkRapidAlertEmails } from "@/lib/emailService";

export interface RapidAlert {
  id: string;
  patient_id: string;
  handled: boolean;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Therapist {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  user_role: string;
}

// Hook for patients to create rapid alerts
export function useCreateRapidAlert() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id || !profile?.full_name)
        throw new Error("User not authenticated or profile not loaded");

      // Check for recent rapid alerts from this user
      const sixHoursAgo = new Date(
        Date.now() - 6 * 60 * 60 * 1000
      ).toISOString();
      const { data: recentAlerts, error: recentAlertsError } = await supabase
        .from("rapid_alerts")
        .select("id, created_at")
        .eq("patient_id", user.id)
        .gte("created_at", sixHoursAgo)
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentAlertsError) {
        console.error("Error checking for recent alerts:", recentAlertsError);
        throw new Error(
          "Could not verify your alert status. Please try again."
        );
      }

      if (recentAlerts && recentAlerts.length > 0) {
        throw new Error("You can only raise one rapid alert every 6 hours.");
      }

      const { data, error } = await supabase
        .from("rapid_alerts")
        .insert([
          {
            patient_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating rapid alert:", error);
        throw new Error(error.message);
      }

      // Fetch all therapists to send them an email
      const { data: therapists, error: therapistsError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, user_role")
        .in("user_role", [
          "therapist",
          "relationship_expert",
          "financial_expert",
          "dating_coach",
          "health_wellness_coach",
        ]);

      if (therapistsError) {
        console.error("Error fetching therapists:", therapistsError);
        // Don't block the alert if email fails
      } else if (therapists && therapists.length > 0) {
        const therapistEmails = therapists.map((t) => t.email);
        sendBulkRapidAlertEmails(therapistEmails, profile.full_name);
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Rapid alert sent successfully");
      queryClient.invalidateQueries({ queryKey: ["rapidAlerts"] });
    },
    onError: (error) => {
      toast.error(`Error creating rapid alert: ${error.message}`);
    },
  });
}

// Hook to fetch all therapists
export function useTherapistsList() {
  return useQuery<Therapist[]>({
    queryKey: ["therapistsList"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, user_role")
        .in("user_role", [
          "therapist",
          "relationship_expert",
          "financial_expert",
          "dating_coach",
          "health_wellness_coach",
        ]);

      if (error) {
        console.error("Error fetching therapists:", error);
        throw new Error(error.message);
      }

      return data || [];
    },
  });
}

// Hook for therapists to fetch rapid alerts
export function useRapidAlerts() {
  const { user } = useAuth();

  return useQuery<RapidAlert[]>({
    queryKey: ["rapidAlerts"],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("rapid_alerts")
        .select(
          `
          *,
          patient:patient_id(id, full_name, avatar_url)
        `
        )
        .eq("handled", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rapid alerts:", error);
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for therapists to handle rapid alerts
export function useHandleRapidAlert() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("rapid_alerts")
        .update({
          handled: true,
          handled_by: user.id,
          handled_at: new Date().toISOString(),
        })
        .eq("id", alertId)
        .select()
        .single();

      if (error) {
        console.error("Error handling rapid alert:", error);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Rapid alert handled successfully");
      queryClient.invalidateQueries({ queryKey: ["rapidAlerts"] });
    },
    onError: (error) => {
      toast.error(`Error handling rapid alert: ${error.message}`);
    },
  });
}
