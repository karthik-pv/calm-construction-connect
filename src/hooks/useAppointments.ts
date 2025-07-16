import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendCancellationEmail } from "@/lib/emailService";

export interface Appointment {
  id: string;
  therapist_id: string;
  patient_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "canceled" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
  therapist?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    specialization?: string;
    user_role?: string;
  };
  patient?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// Hook for patients to fetch their appointments
export function usePatientAppointments() {
  const { user } = useAuth();

  return useQuery<Appointment[]>({
    queryKey: ["patientAppointments", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          therapist:therapist_id(id, full_name, avatar_url, specialization, user_role)
        `
        )
        .eq("patient_id", user.id)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching patient appointments:", error);
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!user?.id,
  });
}

// Hook for therapists to fetch their appointments
export function useTherapistAppointments() {
  const { user } = useAuth();

  return useQuery<Appointment[]>({
    queryKey: ["therapistAppointments", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          patient:patient_id(id, full_name, avatar_url)
        `
        )
        .eq("therapist_id", user.id)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching therapist appointments:", error);
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!user?.id,
  });
}

// Hook to book a new appointment
export function useBookAppointment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentData: {
      therapist_id: string;
      title: string;
      description?: string;
      start_time: string;
      end_time: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Get therapist info to use in notification
      const { data: therapistData, error: therapistError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", appointmentData.therapist_id)
        .single();

      if (therapistError) {
        console.error("Error fetching therapist info:", therapistError);
      }

      // Get patient info for notification
      const { data: patientData, error: patientError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (patientError) {
        console.error("Error fetching patient info:", patientError);
      }

      // Log appointment details before saving
      console.log("Creating appointment with times:", {
        start: appointmentData.start_time,
        end: appointmentData.end_time,
        startDate: new Date(appointmentData.start_time).toLocaleString(),
        endDate: new Date(appointmentData.end_time).toLocaleString(),
      });

      // Create the appointment
      const { data, error } = await supabase
        .from("appointments")
        .insert([
          {
            therapist_id: appointmentData.therapist_id,
            patient_id: user.id,
            title: appointmentData.title,
            description: appointmentData.description,
            start_time: appointmentData.start_time,
            end_time: appointmentData.end_time,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error booking appointment:", error);
        throw new Error(error.message);
      }

      // Log created appointment
      console.log("Appointment created successfully:", {
        id: data.id,
        start: data.start_time,
        end: data.end_time,
      });

      // Format date for notification
      const startTime = new Date(appointmentData.start_time);
      const formattedDate = startTime.toLocaleDateString();
      const formattedTime = startTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const endTime = new Date(appointmentData.end_time);
      const formattedEndTime = endTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Instead of sending notifications, just log the action
      console.log(
        `Appointment requested with ${
          therapistData?.full_name || "therapist"
        } on ${formattedDate} from ${formattedTime} to ${formattedEndTime}`
      );

      return data;
    },
    onSuccess: () => {
      toast.success(
        "Appointment request sent! You'll be notified when it's confirmed."
      );
      queryClient.invalidateQueries({ queryKey: ["patientAppointments"] });
    },
    onError: (error) => {
      toast.error(`Error booking appointment: ${error.message}`);
    },
  });
}

// Hook to update appointment status (for therapists)
export function useUpdateAppointmentStatus() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      status,
      patientId,
      appointmentDateStr,
      appointmentTimeStr,
    }: {
      appointmentId: string;
      status: "confirmed" | "canceled" | "completed" | "cancelled";
      patientId: string;
      appointmentDateStr?: string;
      appointmentTimeStr?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Find the specific appointment to get its details
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select("*, patient:patient_id(email)")
        .eq("id", appointmentId)
        .single();

      if (appointmentError) {
        console.error("Error fetching appointment details:", appointmentError);
      }

      // Get therapist info to use in notification
      const { data: therapistData, error: therapistError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (therapistError) {
        console.error("Error fetching therapist info:", therapistError);
      }

      console.log(
        `Attempting to update appointment ${appointmentId} status to ${status}`
      );

      // We need to store the result of the update to use after the conditional logic.
      let updateResult: { data: any; error: any | null } = {
        data: null,
        error: null,
      };

      // For cancellation, try both spellings if needed
      let targetStatus = status;
      if (status === "canceled") {
        targetStatus = "cancelled"; // Try British English spelling first
      }

      // First update attempt
      updateResult = await supabase
        .from("appointments")
        .update({ status: targetStatus, updated_at: new Date().toISOString() })
        .eq("id", appointmentId)
        .select()
        .single();

      // If the first attempt fails with a constraint violation, try the other spelling
      if (
        updateResult.error &&
        updateResult.error.message.includes("violates check constraint") &&
        status === "canceled"
      ) {
        console.log("First attempt failed, trying 'canceled' spelling");
        updateResult = await supabase
          .from("appointments")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointmentId)
          .select()
          .single();
      }

      // After all attempts, check for a final error
      if (updateResult.error) {
        console.error("Error updating appointment:", updateResult.error);
        throw new Error(updateResult.error.message);
      }

      console.log("Successfully updated appointment status in database.");

      // If the update was a cancellation, send the email
      if (status === "canceled" || status === "cancelled") {
        console.log("--- Status is cancellation, preparing email. ---");
        const patientEmail = (appointmentData?.patient as any)?.email;
        const therapistName = therapistData?.full_name;
        const appointmentTime = appointmentData?.start_time
          ? new Date(appointmentData.start_time).toLocaleString()
          : "an upcoming";

        if (patientEmail && therapistName) {
          await sendCancellationEmail(
            patientEmail,
            therapistName,
            appointmentTime
          );
        } else {
          console.error(
            "Could not send cancellation email: missing patient email or therapist name."
          );
        }
      }

      // Get appointment details for logging
      const formattedDate = appointmentData?.start_time
        ? new Date(appointmentData.start_time).toLocaleDateString()
        : "unknown date";
      const formattedTime = appointmentData?.start_time
        ? new Date(appointmentData.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "unknown time";
      const appointmentTitle = appointmentData?.title || "Appointment";

      // Log the status change instead of sending notifications
      console.log(
        `Changed appointment "${appointmentTitle}" status to ${status} on ${formattedDate} at ${formattedTime}`
      );

      return updateResult.data;
    },
    onSuccess: (_, variables) => {
      const messageMap: Record<string, string> = {
        confirmed: "Appointment confirmed",
        canceled: "Appointment canceled",
        cancelled: "Appointment canceled",
        completed: "Appointment marked as completed",
      };

      toast.success(messageMap[variables.status]);
      queryClient.invalidateQueries({ queryKey: ["therapistAppointments"] });
    },
    onError: (error) => {
      toast.error(`Error updating appointment status: ${error.message}`);
    },
  });
}

// Hook to cancel appointment (for patients)
export function useCancelAppointment() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      therapistId,
      appointmentDateStr,
      appointmentTimeStr,
    }: {
      appointmentId: string;
      therapistId: string;
      appointmentDateStr?: string;
      appointmentTimeStr?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Find the specific appointment to get its details
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single();

      if (appointmentError) {
        console.error("Error fetching appointment details:", appointmentError);
      }

      // Get patient info to use in notification
      const { data: patientData, error: patientError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (patientError) {
        console.error("Error fetching patient info:", patientError);
      }

      // First, check what status values are allowed in the database
      console.log("Attempting to cancel appointment:", appointmentId);

      // Cancel the appointment - use exact same spelling as in the database constraint
      const { data, error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled", // Try this spelling first (British English)
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)
        .eq("patient_id", user.id) // Ensure user only cancels their own appointments
        .select()
        .single();

      // If that fails, try the American English spelling
      if (error && error.message.includes("violates check constraint")) {
        console.log("First attempt failed, trying 'canceled' spelling");
        const secondAttempt = await supabase
          .from("appointments")
          .update({
            status: "canceled", // American English spelling
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointmentId)
          .eq("patient_id", user.id)
          .select()
          .single();

        if (secondAttempt.error) {
          console.error("Second attempt also failed:", secondAttempt.error);
          throw new Error(secondAttempt.error.message);
        }

        console.log("Successfully canceled appointment with second attempt");
        return secondAttempt.data;
      }

      if (error) {
        console.error("Error canceling appointment:", error);
        throw new Error(error.message);
      }

      // Get appointment details for logging
      const formattedDate = appointmentData?.start_time
        ? new Date(appointmentData.start_time).toLocaleDateString()
        : "unknown date";
      const formattedTime = appointmentData?.start_time
        ? new Date(appointmentData.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "unknown time";
      const appointmentTitle = appointmentData?.title || "the appointment";

      // Log cancellation instead of sending notifications
      console.log(
        `Patient ${
          patientData?.full_name || user.id
        } canceled appointment "${appointmentTitle}" on ${formattedDate} at ${formattedTime}`
      );

      return data;
    },
    onSuccess: () => {
      toast.success("Appointment canceled successfully");
      queryClient.invalidateQueries({ queryKey: ["patientAppointments"] });
    },
    onError: (error) => {
      toast.error(`Error canceling appointment: ${error.message}`);
    },
  });
}
