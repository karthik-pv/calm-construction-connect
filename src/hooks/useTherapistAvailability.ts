import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AvailabilitySlot {
  id: string;
  therapist_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

// Days of the week mapping
export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// Generate default availability (9am-5pm, Mon-Fri)
export const generateDefaultAvailability = (
  therapistId: string
): Partial<AvailabilitySlot>[] => {
  return [1, 2, 3, 4, 5].map((day) => ({
    therapist_id: therapistId,
    day_of_week: day,
    start_time: "09:00:00",
    end_time: "17:00:00",
    is_available: true,
  }));
};

// Hook to fetch therapist's availability
export function useTherapistAvailability(therapistId: string | null) {
  return useQuery({
    queryKey: ["therapistAvailability", therapistId],
    queryFn: async () => {
      if (!therapistId) return [];

      const { data, error } = await supabase
        .from("therapist_availability")
        .select("*")
        .eq("therapist_id", therapistId)
        .eq("is_available", true);

      if (error) throw error;

      // Return actual data from database
      return data || [];
    },
    enabled: !!therapistId,
  });
}

// Hook to manage therapist's own availability
export function useManageAvailability() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch own availability
  const fetchAvailability = useQuery<AvailabilitySlot[]>({
    queryKey: ["myAvailability", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("therapist_availability")
        .select("*")
        .eq("therapist_id", user.id)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching my availability:", error);
        throw new Error(error.message);
      }

      // If no availability found, create default Monday-Friday, 9am-5pm schedule
      if (!data || data.length === 0) {
        console.log("No availability found, creating default schedule");

        try {
          // Generate default availability slots
          const defaultSlots = generateDefaultAvailability(user.id);

          // Insert default slots into database
          const { data: insertedData, error: insertError } = await supabase
            .from("therapist_availability")
            .insert(defaultSlots)
            .select();

          if (insertError) {
            console.error("Error creating default availability:", insertError);
            return [];
          }

          return insertedData || [];
        } catch (error) {
          console.error("Error in default availability creation:", error);
          return [];
        }
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Add a new availability slot
  const addAvailability = useMutation({
    mutationFn: async (newSlot: {
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_available?: boolean;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("therapist_availability")
        .insert([
          {
            therapist_id: user.id,
            day_of_week: newSlot.day_of_week,
            start_time: newSlot.start_time,
            end_time: newSlot.end_time,
            is_available: newSlot.is_available !== false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error adding availability slot:", error);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Availability slot added successfully");
      queryClient.invalidateQueries({ queryKey: ["myAvailability"] });
    },
    onError: (error) => {
      toast.error(`Error adding availability slot: ${error.message}`);
    },
  });

  // Update or create availability slot
  const updateAvailability = useMutation({
    mutationFn: async (slot: {
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_available?: boolean;
      id?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // If we have an ID, update the existing slot
      if (slot.id) {
        const updates: any = {};
        if (slot.day_of_week !== undefined)
          updates.day_of_week = slot.day_of_week;
        if (slot.start_time !== undefined) updates.start_time = slot.start_time;
        if (slot.end_time !== undefined) updates.end_time = slot.end_time;
        if (slot.is_available !== undefined)
          updates.is_available = slot.is_available;

        const { data, error } = await supabase
          .from("therapist_availability")
          .update(updates)
          .eq("id", slot.id)
          .eq("therapist_id", user.id) // Ensure user only updates their own slots
          .select()
          .single();

        if (error) {
          console.error("Error updating availability slot:", error);
          throw new Error(error.message);
        }

        return data;
      }
      // Otherwise create a new one
      else {
        const { data, error } = await supabase
          .from("therapist_availability")
          .insert([
            {
              therapist_id: user.id,
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_available: slot.is_available !== false,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("Error creating availability slot:", error);
          throw new Error(error.message);
        }

        return data;
      }
    },
    onSuccess: () => {
      toast.success("Availability updated successfully");
      queryClient.invalidateQueries({ queryKey: ["myAvailability"] });
    },
    onError: (error) => {
      toast.error(`Error updating availability: ${error.message}`);
    },
  });

  // Delete an availability slot
  const deleteAvailability = useMutation({
    mutationFn: async (slotId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("therapist_availability")
        .delete()
        .eq("id", slotId)
        .eq("therapist_id", user.id); // Ensure user only deletes their own slots

      if (error) {
        console.error("Error deleting availability slot:", error);
        throw new Error(error.message);
      }

      return { id: slotId };
    },
    onSuccess: () => {
      toast.success("Availability slot deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["myAvailability"] });
    },
    onError: (error) => {
      toast.error(`Error deleting availability slot: ${error.message}`);
    },
  });

  // Update or create day availability (for the UI in the screenshot)
  const updateDayAvailability = useMutation({
    mutationFn: async (slot: {
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_available: boolean;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // First check if an entry already exists for this day
      const { data: existingSlots, error: fetchError } = await supabase
        .from("therapist_availability")
        .select("*")
        .eq("therapist_id", user.id)
        .eq("day_of_week", slot.day_of_week);

      if (fetchError) {
        console.error("Error checking existing availability:", fetchError);
        throw new Error(fetchError.message);
      }

      // If entry exists, update it
      if (existingSlots && existingSlots.length > 0) {
        const { data, error } = await supabase
          .from("therapist_availability")
          .update({
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available,
          })
          .eq("id", existingSlots[0].id)
          .eq("therapist_id", user.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating day availability:", error);
          throw new Error(error.message);
        }

        return data;
      }
      // Otherwise create a new entry
      else {
        const { data, error } = await supabase
          .from("therapist_availability")
          .insert([
            {
              therapist_id: user.id,
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_available: slot.is_available,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("Error creating day availability:", error);
          throw new Error(error.message);
        }

        return data;
      }
    },
    onSuccess: () => {
      toast.success("Availability updated successfully");
      queryClient.invalidateQueries({ queryKey: ["myAvailability"] });
    },
    onError: (error) => {
      toast.error(`Error updating availability: ${error.message}`);
    },
  });

  return {
    availability: fetchAvailability.data || [],
    isLoading: fetchAvailability.isLoading,
    isError: fetchAvailability.isError,
    error: fetchAvailability.error,
    addAvailability,
    updateAvailability,
    deleteAvailability,
    updateDayAvailability,
  };
}

// Helper function to check if a time slot is available for a specific date
export function useCheckTimeSlotAvailability() {
  return async (
    therapistId: string,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<boolean> => {
    // Get the day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay();

    // Format date for filtering appointments
    const dateString = date.toISOString().split("T")[0];

    // First, check if the therapist is available on this day/time based on their settings
    const { data: availabilitySlots, error: availabilityError } = await supabase
      .from("therapist_availability")
      .select("*")
      .eq("therapist_id", therapistId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_available", true);

    if (availabilityError) {
      console.error("Error checking availability:", availabilityError);
      throw new Error(availabilityError.message);
    }

    // Check if the requested time fits within any available slots
    const timeIsInAvailableSlot = availabilitySlots.some((slot) => {
      return startTime >= slot.start_time && endTime <= slot.end_time;
    });

    if (!timeIsInAvailableSlot) {
      console.log(
        `Time slot ${startTime}-${endTime} is outside therapist's availability`
      );
      return false; // Not available based on therapist's general availability
    }

    // Now check if there are any conflicting appointments for the specific date
    // IMPORTANT: We need to get ALL appointments regardless of date to ensure we catch any booked slots
    const { data: existingAppointments, error: appointmentsError } =
      await supabase
        .from("appointments")
        .select("*")
        .eq("therapist_id", therapistId)
        .in("status", ["pending", "confirmed"]);

    if (appointmentsError) {
      console.error("Error checking existing appointments:", appointmentsError);
      throw new Error(appointmentsError.message);
    }

    // Filter appointments for just this date
    const appointmentsOnThisDate = existingAppointments.filter(
      (appointment) => {
        const appointmentDate = new Date(appointment.start_time)
          .toISOString()
          .split("T")[0];
        return appointmentDate === dateString;
      }
    );

    // Debug info
    console.log(
      `Checking for conflicts on ${dateString} for time ${startTime}-${endTime}`
    );
    console.log(
      `Found ${appointmentsOnThisDate.length} existing appointments on this date`
    );

    if (appointmentsOnThisDate.length > 0) {
      console.log(`Appointments on ${dateString}:`);
      appointmentsOnThisDate.forEach((apt) => {
        const aptStart = new Date(apt.start_time);
        const aptEnd = new Date(apt.end_time);
        console.log(
          `- ID ${
            apt.id
          }: ${aptStart.toLocaleTimeString()} to ${aptEnd.toLocaleTimeString()} (${
            apt.status
          })`
        );
      });
    }

    // Convert time strings to comparable values for the given date
    const createTimeValue = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes; // Convert to minutes since midnight
    };

    const requestedStartMinutes = createTimeValue(startTime);
    const requestedEndMinutes = createTimeValue(endTime);

    // Check for appointment conflicts
    const hasConflict = appointmentsOnThisDate.some((appointment) => {
      const apptStartTime = new Date(appointment.start_time);
      const apptEndTime = new Date(appointment.end_time);

      // Convert appointment times to minutes since midnight for comparison
      const apptStartMinutes =
        apptStartTime.getHours() * 60 + apptStartTime.getMinutes();
      const apptEndMinutes =
        apptEndTime.getHours() * 60 + apptEndTime.getMinutes();

      // Check for overlap using simple minute-based comparisons (more reliable than Date objects)
      const overlaps =
        (requestedStartMinutes >= apptStartMinutes &&
          requestedStartMinutes < apptEndMinutes) || // New start during existing
        (requestedEndMinutes > apptStartMinutes &&
          requestedEndMinutes <= apptEndMinutes) || // New end during existing
        (requestedStartMinutes <= apptStartMinutes &&
          requestedEndMinutes >= apptEndMinutes); // New encompasses existing

      if (overlaps) {
        console.log(
          `CONFLICT DETECTED: Requested ${startTime}-${endTime} overlaps with existing appointment at ${apptStartTime.toLocaleTimeString()}-${apptEndTime.toLocaleTimeString()}`
        );
      }

      return overlaps;
    });

    return !hasConflict; // Available if no conflicts
  };
}
