import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/shared/PageTitle";
import { useAuth } from "@/contexts/AuthContext";
import {
  Brain,
  Calendar,
  Clock,
  MessageCircle,
  Users,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useChatConversations } from "@/hooks/useChat";
import { useQueryClient } from "@tanstack/react-query";
import { usePatientAppointments, Appointment } from "@/hooks/useAppointments";
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  differenceInHours,
} from "date-fns";
import { Conversation } from "@/hooks/useChat";
import { RapidAlertButton } from "@/components/RapidAlert/RapidAlertButton";

// Define type for combined updates
type UpdateItem =
  | {
      id: string;
      type: "message";
      data: Conversation;
      time: string;
      timestamp: number;
    }
  | {
      id: string;
      type: "appointment";
      data: Appointment;
      time: string;
      timestamp: number;
    };

export default function PatientDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch chat conversations with frequent refresh to ensure unread counts are current
  const { data: conversations = [] } = useChatConversations({
    refetchInterval: 3000, // More frequent refresh (3 seconds)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch appointments
  const { data: appointments = [], isLoading: loadingAppointments } =
    usePatientAppointments();

  // Force refresh of chat conversations when component mounts
  useEffect(() => {
    if (profile?.id) {
      console.log("Dashboard mounted - refreshing chat conversations");
      queryClient.invalidateQueries({
        queryKey: ["chatConversations", profile.id],
      });
      queryClient.refetchQueries({
        queryKey: ["chatConversations", profile.id],
      });
    }
  }, [profile?.id, queryClient]);

  // Calculate number of conversations with unread messages
  // Only count conversations where the unread messages are from other users, not from the current user
  const unreadConversationsCount = conversations.filter(
    (conv) => conv.unreadCount > 0 && conv.lastMessageSenderId !== profile?.id
  ).length;

  // Format dates for better display - MOVED UP before it's used
  const formatAppointmentDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);

      if (isToday(date)) {
        return `Today at ${format(date, "h:mm a")}`;
      }

      if (isTomorrow(date)) {
        return `Tomorrow at ${format(date, "h:mm a")}`;
      }

      const isWithinWeek = differenceInHours(date, new Date()) < 168; // 7 days

      if (isWithinWeek) {
        return `${format(date, "EEEE")} at ${format(date, "h:mm a")}`;
      }

      return format(date, "MMMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  // Get most recent conversations with unread messages
  const recentUnreadConversations = conversations
    .filter(
      (conv) => conv.unreadCount > 0 && conv.lastMessageSenderId !== profile?.id
    )
    .slice(0, 5); // Allow up to 5 unread messages if there are no appointments

  // Get upcoming appointments
  const upcomingAppointments = appointments
    .filter(
      (apt) =>
        apt.status === "confirmed" && new Date(apt.start_time) > new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
    .slice(0, 5); // Allow up to 5 appointments if there are no messages

  // Helper function to get timestamp from message time string
  const getMessageTimestamp = (timeString: string): number => {
    const now = new Date().getTime();

    if (timeString.includes("Just now")) return now;
    if (timeString.includes("m ago")) {
      const minutes = parseInt(timeString.split("m")[0]);
      return now - minutes * 60 * 1000;
    }
    if (timeString.includes("h ago")) {
      const hours = parseInt(timeString.split("h")[0]);
      return now - hours * 60 * 60 * 1000;
    }
    if (timeString.includes("d ago")) {
      const days = parseInt(timeString.split("d")[0]);
      return now - days * 24 * 60 * 60 * 1000;
    }
    if (timeString.includes("Today")) return now - 12 * 60 * 60 * 1000;
    if (timeString.includes("Yesterday")) return now - 36 * 60 * 60 * 1000;

    return now - 48 * 60 * 60 * 1000;
  };

  // Combine and limit updates to maximum 5 total
  const allUpdates: UpdateItem[] = [
    // Add message updates
    ...recentUnreadConversations.map((conv) => ({
      id: `chat-${conv.id}`,
      type: "message" as const,
      data: conv,
      time: conv.lastMessageTime,
      // Use helper function to calculate timestamp
      timestamp: getMessageTimestamp(conv.lastMessageTime),
    })),

    // Add appointment updates
    ...upcomingAppointments.map((apt) => ({
      id: `apt-${apt.id}`,
      type: "appointment" as const,
      data: apt,
      time: formatAppointmentDate(apt.start_time),
      // Sort by actual timestamp
      timestamp: new Date(apt.start_time).getTime(),
    })),
  ]
    // Sort by most recent/upcoming
    .sort((a, b) => {
      // For appointments, sort by closest to current time (ascending order)
      if (a.type === "appointment" && b.type === "appointment") {
        return a.timestamp - b.timestamp;
      }
      // For messages, sort by most recent first (descending order)
      if (a.type === "message" && b.type === "message") {
        return b.timestamp - a.timestamp;
      }
      // Messages always come before appointments
      if (a.type === "message" && b.type === "appointment") {
        return -1;
      }
      // Appointments after messages
      return 1;
    })
    // Limit to 5 total updates
    .slice(0, 5);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <PageTitle
          title={`Welcome, ${profile?.full_name?.split(" ")[0] || "there"}!`}
          subtitle="Your mental wellness dashboard"
        />

        <div className="max-w-md mx-auto">
          <RapidAlertButton />
        </div>

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <Link to="/patient/chatbot">
              <Card className="h-full glass-card hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <span>Mental Health Assistant</span>
                  </CardTitle>
                  <CardDescription>
                    Chat with our AI assistant about your mental wellbeing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our AI can provide support, resources, and coping strategies
                    for common mental health challenges.
                  </p>
                  <Button className="w-full mt-4 glass-button">
                    Start Chatting
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/patient/experts">
              <Card className="h-full glass-card hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Find an Expert</span>
                  </CardTitle>
                  <CardDescription>
                    Connect with professionals specializing in construction
                    worker well-being
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Browse experts specializing in construction worker mental
                    health, relationships, finances, and more.
                  </p>
                  <Button className="w-full mt-4 glass-button">
                    Browse Experts
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/patient/chat">
              <Card className="h-full glass-card hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span>My Messages</span>
                    {unreadConversationsCount > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 glass-badge">
                        {unreadConversationsCount}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Chat with your therapists and coaches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {unreadConversationsCount > 0
                      ? `You have ${unreadConversationsCount} unread ${
                          unreadConversationsCount === 1
                            ? "conversation"
                            : "conversations"
                        }`
                      : "View and respond to messages from your care team"}
                  </p>
                  <Button className="w-full mt-4 glass-button">
                    Open Chat
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/patient/appointments">
              <Card className="h-full glass-card hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>My Appointments</span>
                  </CardTitle>
                  <CardDescription>
                    Manage your therapy and coaching sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {upcomingAppointments.length > 0
                      ? `Next appointment: ${formatAppointmentDate(
                          upcomingAppointments[0].start_time
                        )}`
                      : "No upcoming appointments"}
                  </p>
                  <Button className="w-full mt-4 glass-button">
                    Manage Appointments
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/patient/anxiety-calmer">
              <Card className="h-full glass-card hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Anxiety Calmer</span>
                  </CardTitle>
                  <CardDescription>
                    Reduce stress with calming sounds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Listen to calming sounds and guided meditations to reduce
                    anxiety and stress.
                  </p>
                  <Button className="w-full mt-4 glass-button">
                    Start Relaxing
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Latest Updates</CardTitle>
              <CardDescription>
                Recent activity and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAppointments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {allUpdates.length > 0 ? (
                    allUpdates.map((update) => (
                      <div
                        key={update.id}
                        className="flex items-start gap-4 p-3 rounded-lg glass-card"
                      >
                        {update.type === "message" && (
                          <>
                            <div className="rounded-full glass-avatar p-2">
                              <MessageCircle className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                New message from {update.data.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {update.data.lastMessage.length > 60
                                  ? `"${update.data.lastMessage.substring(
                                      0,
                                      60
                                    )}..."`
                                  : `"${update.data.lastMessage}"`}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {update.data.lastMessageTime}
                              </p>
                            </div>
                          </>
                        )}

                        {update.type === "appointment" && (
                          <>
                            <div className="rounded-full glass-avatar p-2">
                              <Clock className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {isToday(parseISO(update.data.start_time))
                                  ? "Appointment today"
                                  : isTomorrow(parseISO(update.data.start_time))
                                  ? "Appointment tomorrow"
                                  : "Upcoming appointment"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {update.data.title || "Session"} with{" "}
                                {update.data.therapist?.full_name ||
                                  "your therapist"}{" "}
                                at{" "}
                                {formatAppointmentDate(update.data.start_time)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {update.data.status === "confirmed"
                                  ? "Confirmed"
                                  : update.data.status}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No recent updates</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 glass-button"
                        asChild
                      >
                        <Link to="/patient/appointments">
                          Book an Appointment
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
