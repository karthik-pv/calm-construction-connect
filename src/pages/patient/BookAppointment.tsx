import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  format,
  parseISO,
  addHours,
  addDays,
  isSameDay,
  getDay,
  nextDay,
} from "date-fns";
import { Calendar, Clock, Loader, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useBookAppointment } from "@/hooks/useAppointments";
import {
  useTherapistAvailability,
  DAYS_OF_WEEK,
  useCheckTimeSlotAvailability,
} from "@/hooks/useTherapistAvailability";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Map day of week number to string (0 = Sunday, 1 = Monday, etc.)
const DAY_MAP = DAYS_OF_WEEK.reduce((acc, day) => {
  acc[day.value] = day.label;
  return acc;
}, {} as Record<number, string>);

// Map day name to day of week number
const DAY_TO_NUMBER: Record<string, number> = DAYS_OF_WEEK.reduce(
  (acc, day) => {
    acc[day.label] = day.value;
    return acc;
  },
  {} as Record<string, number>
);

// Generate time slots from start time to end time in 1-hour increments
const generateTimeSlots = (startTime: string, endTime: string): string[] => {
  const slots: string[] = [];
  // Use a date that won't have daylight saving time issues
  const start = parseISO(`2000-01-01T${startTime}`);
  const end = parseISO(`2000-01-01T${endTime}`);

  let currentSlot = start;
  while (currentSlot < end) {
    slots.push(format(currentSlot, "HH:mm:ss"));
    currentSlot = addHours(currentSlot, 1);
  }

  return slots;
};

// Calculate the next occurrence of a specific day of week
const getNextDayOccurrence = (dayOfWeek: number): Date => {
  const today = new Date();
  const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToAdd = (dayOfWeek - todayDayOfWeek + 7) % 7;

  // If today is the target day and it's early enough, use today
  if (daysToAdd === 0) {
    return today;
  }

  // Otherwise, get the next occurrence
  const nextOccurrence = new Date(today);
  nextOccurrence.setDate(today.getDate() + daysToAdd);
  return nextOccurrence;
};

// Define the therapist profile interface
interface TherapistProfile {
  id: string;
  full_name: string;
  user_role: string;
  specialization?: string;
  avatar_url?: string;
}

// Helper to format specialization for display
const formatSpecialization = (specialization: string | undefined) => {
  if (!specialization) return "";

  try {
    // Try to parse if it looks like JSON
    if (specialization.startsWith("[") && specialization.endsWith("]")) {
      try {
        const parsedArray = JSON.parse(specialization);
        if (Array.isArray(parsedArray)) {
          return parsedArray
            .map((item) =>
              typeof item === "string"
                ? item.replace(/["\[\]]/g, "")
                : String(item)
            )
            .join(", ");
        } else {
          return specialization.replace(/["\[\]]/g, "");
        }
      } catch {
        // If parsing fails, fallback to simple replacement
        return specialization.replace(/["\[\]]/g, "");
      }
    }

    // If it contains commas, split and clean each item
    if (specialization.includes(",")) {
      return specialization
        .split(",")
        .map((item) => item.trim().replace(/["\[\]]/g, ""))
        .join(", ");
    }

    // If it has quotes or brackets but isn't valid JSON, just clean it
    return specialization.replace(/["\[\]]/g, "");
  } catch (e) {
    // If any error occurs, just clean up visible quotes and brackets
    return specialization.replace(/["\[\]]/g, "");
  }
};

// Store selected date for each day of the week
interface SelectedDates {
  [key: string]: Date;
}

const BookAppointment = () => {
  const { therapistId } = useParams<{ therapistId: string }>();
  const navigate = useNavigate();
  const { toast: showToast } = useToast();
  const { user } = useAuth();
  const checkSlotAvailability = useCheckTimeSlotAvailability();

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [selectedDates, setSelectedDates] = useState<SelectedDates>({});
  const [availabilityByDay, setAvailabilityByDay] = useState<
    Record<string, any[]>
  >({});
  const [timeSlotsByDay, setTimeSlotsByDay] = useState<
    Record<string, string[]>
  >({});

  // Use the hook to fetch therapist availability with proper dependency array
  const {
    data: availabilitySlots = [],
    isLoading: availabilityLoading,
    error: availabilityError,
  } = useTherapistAvailability(therapistId || null);

  // Use hooks for booking and fetching therapist details
  const { mutateAsync: bookAppointment } = useBookAppointment();

  // Fetch therapist profile with caching enabled
  const {
    data: therapistProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["therapistProfile", therapistId],
    queryFn: async () => {
      if (!therapistId) throw new Error("Therapist ID is required");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", therapistId)
        .single();

      if (error) throw error;
      return data as TherapistProfile;
    },
    enabled: !!therapistId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Memoize the formatted specialization to avoid recalculating on each render
  const formattedSpecialization = useMemo(() => {
    return formatSpecialization(therapistProfile?.specialization);
  }, [therapistProfile?.specialization]);

  // Group availability by day when data is loaded - optimized with useCallback
  const processAvailability = useCallback(() => {
    if (availabilitySlots && availabilitySlots.length > 0) {
      const grouped: Record<string, any[]> = {};
      const timeSlots: Record<string, string[]> = {};
      const dates: SelectedDates = {};

      // Group availability by day of week
      availabilitySlots.forEach((slot) => {
        const day = DAY_MAP[slot.day_of_week];
        if (!grouped[day]) {
          grouped[day] = [];
          // Initialize the selected date for this day
          dates[day] = getNextDayOccurrence(slot.day_of_week);
        }
        grouped[day].push(slot);

        // Generate 1-hour slots for each day's availability
        if (!timeSlots[day]) {
          timeSlots[day] = generateTimeSlots(slot.start_time, slot.end_time);
        } else {
          // Merge time slots if there are multiple availability periods in a day
          const newSlots = generateTimeSlots(slot.start_time, slot.end_time);
          timeSlots[day] = [
            ...new Set([...timeSlots[day], ...newSlots]),
          ].sort();
        }
      });

      setAvailabilityByDay(grouped);
      setTimeSlotsByDay(timeSlots);
      setSelectedDates(dates);

      // Set default selected day (first day with availability)
      const firstDay = Object.keys(grouped)[0];
      if (firstDay && !selectedDay) setSelectedDay(firstDay);

      return { timeSlots, grouped, dates };
    }
    return null;
  }, [availabilitySlots, selectedDay]);

  // Use effect to process availability data once when it loads
  useEffect(() => {
    const result = processAvailability();
    if (result) {
      // Only fetch booked slots if we have availability data
      fetchBookedSlots(result.timeSlots, result.grouped, result.dates);
    }
  }, [availabilitySlots, processAvailability]);

  // Optimized function to fetch booked slots
  const fetchBookedSlots = async (
    timeSlots: Record<string, string[]>,
    availability: Record<string, any[]>,
    dates: SelectedDates
  ) => {
    if (!therapistId || Object.keys(timeSlots).length === 0) return;

    setCheckingSlots(true);
    const booked: Record<string, string[]> = {};

    try {
      // Get all pending and confirmed appointments for this therapist in one query
      const { data: existingAppointments, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("therapist_id", therapistId)
        .in("status", ["pending", "confirmed"]);

      if (error) {
        console.error("Error fetching appointments:", error);
        setCheckingSlots(false);
        return;
      }

      // Process all days in parallel using Promise.all
      await Promise.all(
        Object.keys(timeSlots).map(async (day) => {
          booked[day] = [];
          const targetDate = dates[day];
          if (!targetDate) return;

          const dateString = targetDate.toISOString().split("T")[0];

          // Filter appointments for just this date
          const appointmentsOnThisDate = existingAppointments.filter(
            (appointment) => {
              const appointmentDate = new Date(appointment.start_time)
                .toISOString()
                .split("T")[0];
              return appointmentDate === dateString;
            }
          );

          // Helper to convert time strings to minutes
          const timeToMinutes = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(":").map(Number);
            return hours * 60 + minutes;
          };

          // Check each slot for conflicts
          for (const slot of timeSlots[day]) {
            const slotStartMinutes = timeToMinutes(slot);
            const slotEndMinutes = timeToMinutes(
              format(addHours(parseISO(`2000-01-01T${slot}`), 1), "HH:mm:ss")
            );

            // Check if this slot conflicts with any existing appointment
            const isBooked = appointmentsOnThisDate.some((appointment) => {
              const apptStart = new Date(appointment.start_time);
              const apptEnd = new Date(appointment.end_time);

              const apptStartMinutes =
                apptStart.getHours() * 60 + apptStart.getMinutes();
              const apptEndMinutes =
                apptEnd.getHours() * 60 + apptEnd.getMinutes();

              // Check for time overlap
              return (
                (slotStartMinutes >= apptStartMinutes &&
                  slotStartMinutes < apptEndMinutes) ||
                (slotEndMinutes > apptStartMinutes &&
                  slotEndMinutes <= apptEndMinutes) ||
                (slotStartMinutes <= apptStartMinutes &&
                  slotEndMinutes >= apptEndMinutes)
              );
            });

            if (isBooked) {
              booked[day].push(slot);
            }
          }
        })
      );

      setBookedSlots(booked);
    } catch (error) {
      console.error("Error checking booked slots:", error);
    } finally {
      setCheckingSlots(false);
    }
  };

  // Optimized handler for day change
  const handleDayChange = useCallback(
    (day: string) => {
      setSelectedDay(day);
      setSelectedTime(null);

      // Re-check slot availability for the newly selected day
      if (therapistId && selectedDates[day]) {
        // We're going to do a complete refresh of slots for this day
        const daySlots = timeSlotsByDay[day] || [];
        const targetDate = selectedDates[day];

        // Temporarily mark all slots as checking
        setCheckingSlots(true);

        // Fetch all appointments for this therapist
        supabase
          .from("appointments")
          .select("*")
          .eq("therapist_id", therapistId)
          .in("status", ["pending", "confirmed"])
          .then(
            ({ data: appointments, error }) => {
              if (error) {
                console.error("Error fetching appointments:", error);
                setCheckingSlots(false);
                return;
              }

              // Filter appointments for the selected date
              const dateString = targetDate.toISOString().split("T")[0];
              const appointmentsOnThisDate = appointments.filter(
                (appointment) => {
                  const appointmentDate = new Date(appointment.start_time)
                    .toISOString()
                    .split("T")[0];
                  return appointmentDate === dateString;
                }
              );

              // Helper to convert time strings to minutes since midnight
              const timeToMinutes = (timeStr: string) => {
                const [hours, minutes] = timeStr.split(":").map(Number);
                return hours * 60 + minutes;
              };

              // Find conflicting slots
              const newBookedSlots = [...(bookedSlots[day] || [])];

              // Check each slot against appointments
              for (const slot of daySlots) {
                const slotStartMinutes = timeToMinutes(slot);
                const slotEndTime = format(
                  addHours(parseISO(`2000-01-01T${slot}`), 1),
                  "HH:mm:ss"
                );
                const slotEndMinutes = timeToMinutes(slotEndTime);

                // Check if this slot conflicts with any appointment
                const isBooked = appointmentsOnThisDate.some((appointment) => {
                  const apptStart = new Date(appointment.start_time);
                  const apptEnd = new Date(appointment.end_time);

                  const apptStartMinutes =
                    apptStart.getHours() * 60 + apptStart.getMinutes();
                  const apptEndMinutes =
                    apptEnd.getHours() * 60 + apptEnd.getMinutes();

                  // Check for time overlap
                  return (
                    (slotStartMinutes >= apptStartMinutes &&
                      slotStartMinutes < apptEndMinutes) ||
                    (slotEndMinutes > apptStartMinutes &&
                      slotEndMinutes <= apptEndMinutes) ||
                    (slotStartMinutes <= apptStartMinutes &&
                      slotEndMinutes >= apptEndMinutes)
                  );
                });

                if (isBooked && !newBookedSlots.includes(slot)) {
                  newBookedSlots.push(slot);
                }
              }

              // Update the booked slots for this day
              setBookedSlots((prev) => ({
                ...prev,
                [day]: newBookedSlots,
              }));
              setCheckingSlots(false);
            },
            (error) => {
              console.error("Error in handleDayChange:", error);
              setCheckingSlots(false);
            }
          );
      }
    },
    [therapistId, selectedDates, timeSlotsByDay, bookedSlots]
  );

  const handleBookAppointment = async () => {
    if (!therapistId || !selectedDay || !selectedTime) {
      showToast({
        title: "Error",
        description: "Please select a day and time for your appointment",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Get the selected date for the chosen day
      const appointmentDate = selectedDates[selectedDay];
      if (!appointmentDate) {
        throw new Error("Invalid date selected");
      }

      // Set the hours and minutes from the selected time slot
      const [hours, minutes] = selectedTime.split(":").map(Number);

      // Create a new Date object for the appointment
      const startDateTime = new Date(appointmentDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      // Calculate end time (1 hour after start time)
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(startDateTime.getHours() + 1);

      // Format for database storage
      const startISO = startDateTime.toISOString();
      const endISO = endDateTime.toISOString();

      // First, verify this slot is still available
      // Add the selected slot to booked slots immediately to prevent double booking
      setBookedSlots((prev) => ({
        ...prev,
        [selectedDay]: [...(prev[selectedDay] || []), selectedTime],
      }));

      // Book the appointment
      await bookAppointment({
        therapist_id: therapistId,
        title: `Appointment with ${therapistProfile?.full_name || "therapist"}`,
        description: notes,
        start_time: startISO,
        end_time: endISO,
      });

      toast.success(
        "Appointment request sent! You'll be notified when confirmed."
      );

      // Navigate to appointments page
      navigate("/patient/appointments");
    } catch (error: any) {
      toast.error(`Error booking appointment: ${error.message}`);

      // Remove the slot from booked slots if booking failed
      if (selectedDay && selectedTime) {
        setBookedSlots((prev) => ({
          ...prev,
          [selectedDay]: (prev[selectedDay] || []).filter(
            (slot) => slot !== selectedTime
          ),
        }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Memoized loading state
  const isLoading = profileLoading || availabilityLoading || checkingSlots;
  const error = profileError || availabilityError;

  // Show error message if there's an error
  if (error) {
    return (
      <DashboardLayout>
        <PageTitle title="Book Appointment" />
        <div className="text-red-500 p-4 bg-red-500/10 rounded-md">
          Failed to load therapist information. Please try again later.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageTitle title="Book Appointment" />

      {isLoading ? (
        <div className="max-w-7xl mx-auto space-y-4 p-2">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6 p-2">
          {therapistProfile && (
            <Card className="bg-black/30 backdrop-blur-md border-primary/20 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl">
                  Booking with {therapistProfile.full_name}
                </CardTitle>
                <CardDescription className="text-base opacity-90">
                  {therapistProfile.user_role?.replace("_", " ")}
                  {therapistProfile.specialization &&
                    ` • ${formattedSpecialization}`}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-black/30 backdrop-blur-md border-primary/20 shadow-lg overflow-hidden h-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">
                  Select Appointment Time
                </CardTitle>
                <CardDescription>
                  Choose an available 1-hour slot for your appointment
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {Object.keys(availabilityByDay).length > 0 ? (
                  <Tabs
                    value={selectedDay || Object.keys(availabilityByDay)[0]}
                    className="w-full"
                  >
                    <TabsList className="w-full justify-start mb-4 flex-nowrap overflow-x-auto hidden-scrollbar">
                      {Object.keys(availabilityByDay).map((day) => (
                        <TabsTrigger
                          key={day}
                          value={day}
                          onClick={() => handleDayChange(day)}
                          className="whitespace-nowrap min-w-fit py-2 px-4"
                        >
                          {day} ({format(selectedDates[day], "MMM d")})
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {Object.entries(timeSlotsByDay).map(([day, slots]) => (
                      <TabsContent key={day} value={day} className="mt-0 pt-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {slots.map((slot, index) => {
                            const isBooked = bookedSlots[day]?.includes(slot);
                            return (
                              <Button
                                key={index}
                                variant={
                                  selectedTime === slot
                                    ? "default"
                                    : isBooked
                                    ? "destructive"
                                    : "outline"
                                }
                                className={`flex items-center justify-center gap-2 h-12 transition-all ${
                                  selectedTime === slot
                                    ? "shadow-md border border-primary/30"
                                    : isBooked
                                    ? "opacity-50"
                                    : "hover:bg-primary/10"
                                }`}
                                onClick={() =>
                                  !isBooked && setSelectedTime(slot)
                                }
                                disabled={isBooked}
                                title={
                                  isBooked ? "This slot is already booked" : ""
                                }
                              >
                                {isBooked ? (
                                  <AlertCircle className="h-4 w-4" />
                                ) : (
                                  <Clock className="h-4 w-4" />
                                )}
                                <span>
                                  {format(
                                    parseISO(`2000-01-01T${slot}`),
                                    "h:mm a"
                                  )}
                                </span>
                              </Button>
                            );
                          })}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Calendar className="mx-auto h-12 w-12 opacity-20" />
                    <p className="mt-4 text-lg">
                      No availability found for this therapist
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-black/30 backdrop-blur-md border-primary/20 shadow-lg h-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Appointment Details</CardTitle>
                <CardDescription>
                  Add any notes for the therapist (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  <div>
                    <p className="font-medium mb-2 text-base">Selected Time</p>
                    {selectedDay &&
                    selectedTime &&
                    selectedDates[selectedDay] ? (
                      <div className="rounded-md border border-primary/20 p-4 bg-black/20">
                        <p className="flex items-center gap-2 font-medium text-base">
                          <Calendar className="h-5 w-5 text-primary" />
                          {selectedDay},{" "}
                          {format(selectedDates[selectedDay], "MMMM d, yyyy")}
                        </p>
                        <p className="flex items-center gap-2 text-muted-foreground mt-1">
                          <Clock className="h-4 w-4" />
                          {format(
                            parseISO(`2000-01-01T${selectedTime}`),
                            "h:mm a"
                          )}{" "}
                          -{" "}
                          {format(
                            addHours(parseISO(`2000-01-01T${selectedTime}`), 1),
                            "h:mm a"
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground p-4 border border-dashed border-border/50 rounded-md bg-black/10 text-center">
                        Please select a day and time
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="font-medium mb-2 block text-base"
                      htmlFor="notes"
                    >
                      Notes (Optional)
                    </label>
                    <Textarea
                      id="notes"
                      placeholder="Add any specific topics you'd like to discuss or questions you have"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={5}
                      className="resize-none bg-black/20 border-primary/20 focus:border-primary/40"
                    />
                  </div>

                  <Button
                    className="w-full h-12 text-base font-medium shadow-md transition-all"
                    disabled={!selectedDay || !selectedTime || submitting}
                    onClick={handleBookAppointment}
                  >
                    {submitting && (
                      <Loader className="mr-2 h-5 w-5 animate-spin" />
                    )}
                    Book Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add global styles for hiding scrollbars */}
      <style>
        {`
          .hidden-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .hidden-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </DashboardLayout>
  );
};

export default BookAppointment;
