import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendNotification } from "./useNotifications";

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

      // Create notification for therapist - don't block the operation
      // if notification fails
      try {
        sendNotification({
          userId: appointmentData.therapist_id,
          title: "New Appointment Request",
          message: `${
            patientData?.full_name || "A patient"
          } has requested an appointment on ${formattedDate} from ${formattedTime} to ${formattedEndTime} for "${
            appointmentData.title
          }".`,
          link: `/therapist/appointments`,
          type: "appointment_request",
        })
          .then(() => console.log("Therapist notification sent successfully"))
          .catch((err) => console.error("Therapist notification error:", err));
      } catch (notificationError) {
        console.error(
          "Failed to send notification to therapist, but appointment was created:",
          notificationError
        );
      }

      // Also send a confirmation notification to the patient
      try {
        sendNotification({
          userId: user.id,
          title: "Appointment Request Submitted",
          message: `You have requested an appointment with ${
            therapistData?.full_name || "a therapist"
          } on ${formattedDate} from ${formattedTime} to ${formattedEndTime}. You'll be notified when it's confirmed.`,
          link: `/patient/appointments`,
          type: "system",
        })
          .then(() =>
            console.log("Patient confirmation notification sent successfully")
          )
          .catch((err) => console.error("Patient notification error:", err));
      } catch (notificationError) {
        console.error(
          "Failed to send confirmation notification to patient:",
          notificationError
        );
      }

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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      status,
      patientId,
      appointmentDate,
      appointmentTime,
    }: {
      appointmentId: string;
      status: "confirmed" | "canceled" | "completed" | "cancelled";
      patientId: string;
      appointmentDate: string;
      appointmentTime: string;
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

      // For cancellation, try both spellings if needed
      let targetStatus = status;
      if (status === "canceled") {
        // Try British English spelling first
        targetStatus = "cancelled";
      }

      // Update the appointment status
      const { data, error } = await supabase
        .from("appointments")
        .update({ status: targetStatus, updated_at: new Date().toISOString() })
        .eq("id", appointmentId)
        .select()
        .single();

      // If British spelling fails, try American spelling
      if (
        error &&
        error.message.includes("violates check constraint") &&
        status === "canceled"
      ) {
        console.log(
          "First attempt failed with 'cancelled', trying 'canceled' spelling"
        );
        const secondAttempt = await supabase
          .from("appointments")
          .update({
            status: "canceled", // American English spelling
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointmentId)
          .select()
          .single();

        if (secondAttempt.error) {
          console.error("Second attempt also failed:", secondAttempt.error);
          throw new Error(secondAttempt.error.message);
        }

        console.log("Successfully updated appointment with second attempt");
        return secondAttempt.data;
      }

      if (error) {
        console.error("Error updating appointment:", error);
        throw new Error(error.message);
      }

      // Get the appointment title for the notification
      const appointmentTitle = appointmentData?.title || "your appointment";

      // Create notification for patient - but don't block status update if notification fails
      try {
        let title = "";
        let message = "";
        let notificationType:
          | "appointment_confirmed"
          | "appointment_rejected"
          | "system" = "appointment_confirmed";

        if (status === "confirmed") {
          title = "Appointment Confirmed";
          message = `${
            therapistData?.full_name || "Your therapist"
          } has confirmed your appointment "${appointmentTitle}" on ${appointmentDate} at ${appointmentTime}.`;
          notificationType = "appointment_confirmed";
        } else if (status === "canceled" || status === "cancelled") {
          title = "Appointment Cancelled";
          message = `${
            therapistData?.full_name || "Your therapist"
          } has cancelled your appointment "${appointmentTitle}" on ${appointmentDate} at ${appointmentTime}.`;
          notificationType = "appointment_rejected";
        } else {
          title = "Appointment Completed";
          message = `Your appointment "${appointmentTitle}" with ${
            therapistData?.full_name || "your therapist"
          } has been marked as completed.`;
          notificationType = "system";
        }

        sendNotification({
          userId: patientId,
          title,
          message,
          link: "/patient/appointments",
          type: notificationType,
        })
          .then(() =>
            console.log(
              `Patient notification for ${status} appointment sent successfully`
            )
          )
          .catch((err) =>
            console.error(`Error sending patient notification: ${err}`)
          );
      } catch (notificationError) {
        console.error(
          `Failed to send ${status} notification to patient:`,
          notificationError
        );
        // Continue with the operation despite notification failure
      }

      // Also send a notification to yourself (the therapist) as a confirmation
      try {
        let selfTitle = "";
        let selfMessage = "";

        if (status === "confirmed") {
          selfTitle = "Appointment Confirmation Sent";
          selfMessage = `You have confirmed the appointment "${appointmentTitle}" on ${appointmentDate} at ${appointmentTime}.`;
        } else if (status === "canceled" || status === "cancelled") {
          selfTitle = "Appointment Cancellation Sent";
          selfMessage = `You have cancelled the appointment "${appointmentTitle}" on ${appointmentDate} at ${appointmentTime}.`;
        } else {
          selfTitle = "Appointment Marked as Completed";
          selfMessage = `You have marked the appointment "${appointmentTitle}" on ${appointmentDate} at ${appointmentTime} as completed.`;
        }

        sendNotification({
          userId: user.id,
          title: selfTitle,
          message: selfMessage,
          link: "/therapist/appointments",
          type: "system",
        })
          .then(() =>
            console.log("Self-confirmation notification sent successfully")
          )
          .catch((err) =>
            console.error(`Error sending self notification: ${err}`)
          );
      } catch (selfNotificationError) {
        console.error(
          "Failed to send self-confirmation notification:",
          selfNotificationError
        );
        // Continue with the operation despite notification failure
      }

      return data;
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
      toast.error(`Error updating appointment: ${error.message}`);
    },
  });
}

// Hook to cancel appointment (for patients)
export function useCancelAppointment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      therapistId,
      appointmentDate,
      appointmentTime,
    }: {
      appointmentId: string;
      therapistId: string;
      appointmentDate: string;
      appointmentTime: string;
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

      // Get the appointment title for the notification
      const appointmentTitle = appointmentData?.title || "the appointment";

      // Notify the therapist - but don't block cancellation if notification fails
      try {
        sendNotification({
          userId: therapistId,
          title: "Appointment Cancelled",
          message: `${
            patientData?.full_name || "A patient"
          } has cancelled their appointment "${appointmentTitle}" on ${appointmentDate} at ${appointmentTime}.`,
          link: "/therapist/appointments",
          type: "appointment_rejected",
        })
          .then(() =>
            console.log(
              "Therapist notification for cancellation sent successfully"
            )
          )
          .catch((err) =>
            console.error(`Error sending therapist notification: ${err}`)
          );
      } catch (notificationError) {
        console.error(
          "Failed to send cancellation notification to therapist:",
          notificationError
        );
        // Continue with cancellation despite notification failure
      }

      // Also send a confirmation notification to the patient
      try {
        sendNotification({
          userId: user.id,
          title: "Appointment Cancellation Confirmed",
          message: `You have cancelled your appointment "${appointmentTitle}" on ${appointmentDate} at ${appointmentTime}.`,
          link: "/patient/appointments",
          type: "system",
        })
          .then(() =>
            console.log("Self-confirmation for cancellation sent successfully")
          )
          .catch((err) =>
            console.error(`Error sending self notification: ${err}`)
          );
      } catch (selfNotificationError) {
        console.error(
          "Failed to send self-confirmation for cancellation:",
          selfNotificationError
        );
        // Continue with cancellation despite notification failure
      }

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
