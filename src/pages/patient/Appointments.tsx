import { useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  usePatientAppointments,
  useCancelAppointment,
  Appointment,
} from "@/hooks/useAppointments";

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
        >
          Pending
        </Badge>
      );
    case "confirmed":
      return (
        <Badge
          variant="outline"
          className="bg-green-500/20 text-green-300 border-green-500/50"
        >
          Confirmed
        </Badge>
      );
    case "canceled":
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className="bg-red-500/20 text-red-300 border-red-500/50"
        >
          Canceled
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/20 text-blue-300 border-blue-500/50"
        >
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Helper function to format date
const formatAppointmentDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return format(date, "EEEE, MMMM d, yyyy");
  } catch (error) {
    return dateString;
  }
};

// Helper function to format time
const formatAppointmentTime = (
  startDateString: string,
  endDateString: string
) => {
  try {
    const startDate = parseISO(startDateString);
    const endDate = parseISO(endDateString);
    return `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
  } catch (error) {
    return `${startDateString} - ${endDateString}`;
  }
};

// Helper function to format expertise areas/specializations
const formatSpecialization = (specialization: string | undefined) => {
  if (!specialization) return "";

  try {
    // Try to parse if it looks like JSON
    if (specialization.startsWith("[") && specialization.endsWith("]")) {
      const parsedArray = JSON.parse(specialization);
      return Array.isArray(parsedArray)
        ? parsedArray.join(", ")
        : specialization.replace(/["\[\]]/g, "");
    }

    // If it contains commas, split and clean
    if (specialization.includes(",")) {
      return specialization
        .split(",")
        .map((item) => item.trim().replace(/["\[\]]/g, ""))
        .join(", ");
    }

    // If it has quotes or brackets but isn't valid JSON, just clean it
    return specialization.replace(/["\[\]]/g, "");
  } catch (e) {
    // If parsing fails, just clean up visible quotes and brackets
    return specialization.replace(/["\[\]]/g, "");
  }
};

// Appointment card component
const AppointmentCard = ({
  appointment,
  onCancel,
}: {
  appointment: Appointment;
  onCancel: (appointment: Appointment) => void;
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Card className="bg-black/50 border-border backdrop-blur-md hover:border-primary/50 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{appointment.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              {appointment.therapist?.full_name || "Therapist"}
              {appointment.therapist?.specialization && (
                <span className="ml-1 text-xs">
                  ({formatSpecialization(appointment.therapist.specialization)})
                </span>
              )}
            </CardDescription>
          </div>
          {getStatusBadge(appointment.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-primary" />
          {formatAppointmentDate(appointment.start_time)}
        </div>
        <div className="flex items-center text-sm">
          <Clock className="h-4 w-4 mr-2 text-primary" />
          {formatAppointmentTime(appointment.start_time, appointment.end_time)}
        </div>
        {appointment.description && (
          <p className="text-xs text-muted-foreground">
            {appointment.description}
          </p>
        )}

        {/* Action buttons based on status */}
        {appointment.status === "pending" && (
          <div className="flex justify-end mt-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  Cancel Appointment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Appointment</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel this appointment? This
                    action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="font-semibold">{appointment.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatAppointmentDate(appointment.start_time)} at{" "}
                    {formatAppointmentTime(
                      appointment.start_time,
                      appointment.end_time
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Keep Appointment
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onCancel(appointment);
                      setIsDialogOpen(false);
                    }}
                  >
                    Yes, Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function PatientAppointments() {
  const { data: appointments, isLoading, isError } = usePatientAppointments();
  const cancelAppointment = useCancelAppointment();
  const [appointmentToCancel, setAppointmentToCancel] =
    useState<Appointment | null>(null);

  const handleCancelAppointment = async (appointment: Appointment) => {
    try {
      // Format the date and time for the notification
      const appointmentDate = new Date(
        appointment.start_time
      ).toLocaleDateString();
      const appointmentTime = new Date(
        appointment.start_time
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      await cancelAppointment.mutateAsync({
        appointmentId: appointment.id,
        therapistId: appointment.therapist_id,
        appointmentDate,
        appointmentTime,
      });

      setAppointmentToCancel(null);
    } catch (error) {
      console.error("Error canceling appointment:", error);
    }
  };

  // Filter appointments by status
  const pendingAppointments =
    appointments?.filter((apt) => apt.status === "pending") || [];
  const confirmedAppointments =
    appointments?.filter((apt) => apt.status === "confirmed") || [];
  const pastAppointments =
    appointments?.filter((apt) =>
      ["completed", "canceled", "cancelled"].includes(apt.status)
    ) || [];

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Appointments</h3>
      <p className="text-muted-foreground max-w-sm">{message}</p>
      <Button asChild className="mt-4">
        <Link to="/patient/experts">Find an Expert</Link>
      </Button>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <PageTitle
            title="My Appointments"
            subtitle="Manage your scheduled appointments"
          />
          <Button asChild>
            <Link to="/patient/experts">Book New Appointment</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading your appointments...</p>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-64 text-center">
            <div>
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-lg font-semibold">
                Error Loading Appointments
              </p>
              <p className="text-muted-foreground mt-1">
                Please try again later
              </p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-6">
              <TabsTrigger value="upcoming" className="relative">
                Upcoming
                {pendingAppointments.length + confirmedAppointments.length >
                  0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                    {pendingAppointments.length + confirmedAppointments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingAppointments.length > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs rounded-full bg-yellow-500 text-black">
                    {pendingAppointments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {pendingAppointments.length + confirmedAppointments.length ===
              0 ? (
                renderEmptyState(
                  "You don't have any upcoming appointments. Book an appointment with an expert."
                )
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...pendingAppointments, ...confirmedAppointments]
                    .sort(
                      (a, b) =>
                        new Date(a.start_time).getTime() -
                        new Date(b.start_time).getTime()
                    )
                    .map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onCancel={handleCancelAppointment}
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending">
              {pendingAppointments.length === 0 ? (
                renderEmptyState(
                  "You don't have any pending appointments awaiting confirmation."
                )
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingAppointments
                    .sort(
                      (a, b) =>
                        new Date(a.start_time).getTime() -
                        new Date(b.start_time).getTime()
                    )
                    .map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onCancel={handleCancelAppointment}
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="confirmed">
              {confirmedAppointments.length === 0 ? (
                renderEmptyState("You don't have any confirmed appointments.")
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {confirmedAppointments
                    .sort(
                      (a, b) =>
                        new Date(a.start_time).getTime() -
                        new Date(b.start_time).getTime()
                    )
                    .map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onCancel={handleCancelAppointment}
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastAppointments.length === 0 ? (
                renderEmptyState("You don't have any past appointments.")
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pastAppointments
                    .sort(
                      (a, b) =>
                        new Date(b.start_time).getTime() -
                        new Date(a.start_time).getTime()
                    ) // Most recent first
                    .map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onCancel={handleCancelAppointment}
                      />
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
