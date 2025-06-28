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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  Check,
  X,
  AlertCircle,
  User,
  CalendarCheck,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import {
  useTherapistAppointments,
  useUpdateAppointmentStatus,
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
  onUpdateStatus,
}: {
  appointment: Appointment;
  onUpdateStatus: (
    appointmentId: string,
    status: "confirmed" | "canceled" | "completed",
    patientId: string
  ) => void;
}) => {
  const isPending = appointment.status === "pending";
  const isConfirmed = appointment.status === "confirmed";
  const isPast = new Date(appointment.end_time) < new Date();

  return (
    <Card className="glass-card hover:border-primary/50 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{appointment.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={appointment.patient?.avatar_url} />
                  <AvatarFallback className="glass-avatar">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                {appointment.patient?.full_name || "Patient"}
              </div>
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
        {isPending && (
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="glass-button text-xs border-red-500/50 text-red-400 hover:text-red-300 hover:border-red-400"
              onClick={() =>
                onUpdateStatus(
                  appointment.id,
                  "canceled",
                  appointment.patient_id
                )
              }
            >
              <X className="mr-1 h-3 w-3" />
              Decline
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="glass-button text-xs border-green-500/50 text-green-400 hover:text-green-300 hover:border-green-400"
              onClick={() =>
                onUpdateStatus(
                  appointment.id,
                  "confirmed",
                  appointment.patient_id
                )
              }
            >
              <Check className="mr-1 h-3 w-3" />
              Accept
            </Button>
          </div>
        )}

        {isConfirmed && (
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="glass-button text-xs border-red-500/50 text-red-400 hover:text-red-300 hover:border-red-400"
              onClick={() =>
                onUpdateStatus(
                  appointment.id,
                  "canceled",
                  appointment.patient_id
                )
              }
            >
              <X className="mr-1 h-3 w-3" />
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="glass-button text-xs border-blue-500/50 text-blue-400 hover:text-blue-300 hover:border-blue-400"
              onClick={() =>
                onUpdateStatus(
                  appointment.id,
                  "completed",
                  appointment.patient_id
                )
              }
            >
              <CalendarCheck className="mr-1 h-3 w-3" />
              Mark Complete
            </Button>
          </div>
        )}

        {isPast && appointment.status === "confirmed" && (
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              className="glass-button text-xs border-blue-500/50 text-blue-400 hover:text-blue-300 hover:border-blue-400"
              onClick={() =>
                onUpdateStatus(
                  appointment.id,
                  "completed",
                  appointment.patient_id
                )
              }
            >
              <CalendarCheck className="mr-1 h-3 w-3" />
              Mark Complete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function TherapistAppointments() {
  const { data: appointments, isLoading, isError } = useTherapistAppointments();
  const updateAppointmentStatus = useUpdateAppointmentStatus();

  const handleUpdateStatus = (
    appointmentId: string,
    status: "confirmed" | "canceled" | "completed",
    patientId: string
  ) => {
    // Find the appointment to get its date and time
    const appointment = appointments?.find((apt) => apt.id === appointmentId);

    if (!appointment) {
      console.error("Appointment not found");
      return;
    }

    // Format the date and time for the notification
    const appointmentDate = formatAppointmentDate(appointment.start_time);
    const appointmentTime = formatAppointmentTime(
      appointment.start_time,
      appointment.end_time
    );

    updateAppointmentStatus.mutate({
      appointmentId,
      status,
      patientId,
      appointmentDateStr: appointmentDate,
      appointmentTimeStr: appointmentTime,
    });
  };

  // Filter appointments by status
  const pendingAppointments =
    appointments?.filter((apt) => apt.status === "pending") || [];
  const confirmedAppointments =
    appointments?.filter(
      (apt) =>
        apt.status === "confirmed" && new Date(apt.start_time) > new Date()
    ) || [];
  const todayAppointments =
    appointments?.filter((apt) => {
      if (apt.status !== "confirmed") return false;
      const appointmentDate = new Date(apt.start_time);
      const today = new Date();
      return (
        appointmentDate.getDate() === today.getDate() &&
        appointmentDate.getMonth() === today.getMonth() &&
        appointmentDate.getFullYear() === today.getFullYear()
      );
    }) || [];
  const pastAppointments =
    appointments?.filter(
      (apt) =>
        apt.status === "completed" ||
        apt.status === "canceled" ||
        apt.status === "cancelled" ||
        (apt.status === "confirmed" && new Date(apt.end_time) < new Date())
    ) || [];

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Appointments</h3>
      <p className="text-muted-foreground max-w-sm">{message}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <PageTitle
            title="Appointments"
            subtitle="Manage your patient appointments"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading appointments...</p>
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
          <>
            {/* Today's appointments highlight */}
            {todayAppointments.length > 0 && (
              <Card className="bg-primary/10 border-primary/20 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl">
                    Today's Appointments
                  </CardTitle>
                  <CardDescription>
                    You have {todayAppointments.length} appointment
                    {todayAppointments.length > 1 ? "s" : ""} scheduled for
                    today
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {todayAppointments
                    .sort(
                      (a, b) =>
                        new Date(a.start_time).getTime() -
                        new Date(b.start_time).getTime()
                    )
                    .map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onUpdateStatus={handleUpdateStatus}
                      />
                    ))}
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="pending">
              <TabsList className="mb-6">
                <TabsTrigger value="pending" className="relative">
                  Pending
                  {pendingAppointments.length > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs rounded-full bg-yellow-500 text-black">
                      {pendingAppointments.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {pendingAppointments.length === 0 ? (
                  renderEmptyState(
                    "You don't have any pending appointment requests."
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
                          onUpdateStatus={handleUpdateStatus}
                        />
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upcoming">
                {confirmedAppointments.length === 0 ? (
                  renderEmptyState(
                    "You don't have any upcoming confirmed appointments."
                  )
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
                          onUpdateStatus={handleUpdateStatus}
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
                          onUpdateStatus={handleUpdateStatus}
                        />
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all">
                {appointments.length === 0 ? (
                  renderEmptyState("You don't have any appointments.")
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {appointments
                      .sort((a, b) => {
                        // Sort by status (pending first), then by date
                        if (a.status === "pending" && b.status !== "pending")
                          return -1;
                        if (a.status !== "pending" && b.status === "pending")
                          return 1;
                        return (
                          new Date(a.start_time).getTime() -
                          new Date(b.start_time).getTime()
                        );
                      })
                      .map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onUpdateStatus={handleUpdateStatus}
                        />
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
