import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  UserCircle2,
  Clock,
  FileText,
  Calendar,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [patient, setPatient] = useState<any>(null);
  const [patientNotes, setPatientNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  // Load patient data
  useEffect(() => {
    if (!id) return;

    const fetchPatient = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          throw error;
        }

        setPatient(data);
      } catch (error) {
        console.error("Error fetching patient:", error);
        toast.error("Failed to load patient information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  // Load patient notes
  useEffect(() => {
    if (!id || !profile?.id) return;

    const loadPatientNotes = async () => {
      setIsLoadingNotes(true);
      try {
        const { data, error } = await supabase
          .from("patient_notes")
          .select("notes")
          .eq("patient_id", id)
          .eq("therapist_id", profile?.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        setPatientNotes(data?.notes || "");
      } catch (err) {
        console.error("Error loading patient notes:", err);
        toast.error("Failed to load patient notes");
      } finally {
        setIsLoadingNotes(false);
      }
    };

    loadPatientNotes();
  }, [id, profile?.id]);

  // Load appointments
  useEffect(() => {
    if (!id || !profile?.id) return;

    const fetchAppointments = async () => {
      setLoadingAppointments(true);
      try {
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .or(`patient_id.eq.${id},therapist_id.eq.${profile?.id}`)
          .order("start_time", { ascending: true });

        if (error) {
          throw error;
        }

        // Filter only future appointments
        const futureAppointments = data.filter(
          (apt) => new Date(apt.start_time) > new Date()
        );

        setAppointments(futureAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Failed to load appointments");
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [id, profile?.id]);

  // Handle saving patient notes
  const handleSaveNotes = async () => {
    if (!id || !profile?.id) return;

    setIsSavingNotes(true);
    try {
      // Check if notes already exist for this patient
      const { data: existingNote, error: checkError } = await supabase
        .from("patient_notes")
        .select("id")
        .eq("patient_id", id)
        .eq("therapist_id", profile.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      let result;

      if (existingNote) {
        // Update existing notes
        result = await supabase
          .from("patient_notes")
          .update({
            notes: patientNotes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingNote.id);
      } else {
        // Insert new notes
        result = await supabase.from("patient_notes").insert({
          patient_id: id,
          therapist_id: profile.id,
          notes: patientNotes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (result.error) {
        throw result.error;
      }

      toast.success("Notes saved successfully");
    } catch (err) {
      console.error("Error saving patient notes:", err);
      toast.error("Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Get tags for patient (mock implementation)
  const getTags = () => {
    const tags: Record<string, string[]> = {
      "patient-1": ["Anxiety", "Sleep Issues"],
      "patient-2": ["Depression", "Anxiety"],
      "patient-3": ["PTSD", "Anger Management"],
    };

    return tags[id || ""] || ["Stress", "Work-Life Balance"];
  };

  // Format appointment date
  const formatAppointmentDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mr-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <PageTitle
            title="Patient Profile"
            subtitle="View and manage patient information"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            <div className="grid gap-6 mt-8 grid-cols-1 md:grid-cols-2">
              <Skeleton className="h-52 w-full" />
              <Skeleton className="h-52 w-full" />
            </div>
          </div>
        ) : !patient ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Patient not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/therapist/chat")}
            >
              Return to Chat
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
              <Avatar className="h-24 w-24">
                <AvatarImage src={patient.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {patient.full_name?.charAt(0) || "P"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h2 className="text-3xl font-bold">{patient.full_name}</h2>
                <p className="text-muted-foreground">{patient.email}</p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {getTags().map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-6 flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/therapist/chat/${patient.id}`)}
                  >
                    Send Message
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="appointments" className="mt-8">
              <TabsList className="mb-6">
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="appointments">
                <Card className="bg-black/30 border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Upcoming Appointments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingAppointments ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : appointments.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          No upcoming appointments
                        </p>
                        <Button variant="outline" className="mt-4">
                          Schedule Appointment
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {appointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="p-4 rounded-lg bg-black/20 border border-border"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">
                                  {appointment.title || "Therapy Session"}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {formatAppointmentDate(
                                    appointment.start_time
                                  )}
                                </p>
                              </div>
                              <Badge>{appointment.status || "Scheduled"}</Badge>
                            </div>
                            {appointment.notes && (
                              <p className="mt-3 text-sm border-t border-border pt-3">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes">
                <Card className="bg-black/30 border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserCircle2 className="h-5 w-5 mr-2" />
                      Patient Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingNotes ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">
                            Issues & Concerns
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {getTags().map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2">
                            Treatment Notes
                          </h3>
                          <textarea
                            value={patientNotes}
                            onChange={(e) => setPatientNotes(e.target.value)}
                            placeholder="Add your private notes about this patient here..."
                            className="w-full h-40 rounded-md border border-border bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={handleSaveNotes}
                            disabled={isSavingNotes}
                          >
                            {isSavingNotes ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4 mr-2" />
                            )}
                            Save Notes
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="bg-black/30 border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Treatment History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">
                        Treatment history will be shown here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
