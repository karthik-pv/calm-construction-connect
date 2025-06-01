import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Calendar,
  Clock,
  FileText,
  MessageCircle,
  PlusCircle,
  Users,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTherapistAppointments, Appointment } from "@/hooks/useAppointments";
import { format, parseISO } from "date-fns";
import { useChatConversations } from "@/hooks/useChat";
import { RapidAlertsWidget } from "@/components/RapidAlert/RapidAlertsWidget";
import { AnalyticsWidget } from "@/components/Analytics/AnalyticsWidget";

// Types for the real data
interface Patient {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  issue_type?: string;
}

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface UrgentRequest {
  id: string;
  patient_id: string;
  expert_id: string;
  issue: string;
  priority: "high" | "medium" | "low";
  created_at: string;
  patient?: {
    full_name?: string;
    avatar_url?: string;
  };
}

// Mapped display names for each expert role
const EXPERT_ROLE_DISPLAY = {
  therapist: "Therapist",
  relationship_expert: "Relationship Expert",
  financial_expert: "Financial Expert",
  dating_coach: "Dating Coach",
  health_wellness_coach: "Health & Wellness Coach",
};

// Define custom hooks for data fetching
function usePatientCount(expertId: string | undefined) {
  return useQuery<number, Error>({
    queryKey: ["patientCount", expertId],
    queryFn: async () => {
      if (!expertId) return 0;

      // Get count of unique patients for this expert
      const { data, error, count } = await supabase
        .from("expert_client")
        .select("client_id", { count: "exact", head: true })
        .eq("expert_id", expertId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!expertId,
  });
}

function useUnreadMessagesCount(expertId: string | undefined) {
  return useQuery<number, Error>({
    queryKey: ["unreadMessages", expertId],
    queryFn: async () => {
      if (!expertId) return 0;

      const { data, error, count } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", expertId)
        .eq("read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!expertId,
  });
}

function useRecentMessages(expertId: string | undefined) {
  return useQuery<Message[], Error>({
    queryKey: ["recentMessages", expertId],
    queryFn: async () => {
      if (!expertId) return [];

      // Get recent messages where the expert is the receiver
      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          `
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read,
          sender:sender_id(full_name, avatar_url)
        `
        )
        .eq("receiver_id", expertId)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      // Transform the data to match the Message type
      const formattedData = (data || []).map((item) => {
        // Check if sender is an array and handle it accordingly
        const senderData = Array.isArray(item.sender)
          ? item.sender[0]
          : item.sender;

        return {
          ...item,
          sender: senderData,
        };
      });

      return formattedData;
    },
    enabled: !!expertId,
  });
}

function useUrgentPatientRequests(expertId: string | undefined) {
  return useQuery<UrgentRequest[], Error>({
    queryKey: ["urgentRequests", expertId],
    queryFn: async () => {
      if (!expertId) return [];

      // In a real app, you would have a dedicated table for urgent requests
      // This is a simplified version using chat messages with priority flags

      // For simplicity, we'll use unread messages as "urgent requests"
      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          `
          id,
          sender_id,
          content,
          created_at,
          sender:sender_id(full_name, avatar_url)
        `
        )
        .eq("receiver_id", expertId)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      // Transform to urgent requests format
      const formattedData = (data || []).map((msg) => {
        // Check if sender is an array and handle it accordingly
        const senderData = Array.isArray(msg.sender)
          ? msg.sender[0]
          : msg.sender;

        return {
          id: msg.id.toString(),
          patient_id: msg.sender_id,
          expert_id: expertId,
          issue: msg.content,
          priority: "high" as const, // Assuming unread messages are high priority
          created_at: msg.created_at,
          patient: senderData,
        };
      });

      return formattedData;
    },
    enabled: !!expertId,
  });
}

// Colors for charts
const COLORS = ["#9b87f5", "#7E69AB", "#D6BCFA", "#553C9A", "#805AD5"];

// Expert Dashboard component - used by all expert types
export default function ExpertDashboard() {
  const { user, profile } = useAuth();
  const expertId = user?.id;
  const [timeOfDay, setTimeOfDay] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const queryClient = useQueryClient();

  // Use the same appointment hook as the Appointments page
  const { data: appointments = [], isLoading: loadingAppointments } =
    useTherapistAppointments();

  // Fetch chat conversations with frequent refresh to ensure unread counts are current
  const { data: conversations = [], isLoading: loadingConversations } =
    useChatConversations({
      refetchInterval: 3000, // More frequent refresh (3 seconds)
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    });

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

  // Other custom hooks remain
  const { data: patientCount = 0, isLoading: loadingPatients } =
    usePatientCount(expertId);
  const { data: recentMessages = [], isLoading: loadingMessages } =
    useRecentMessages(expertId);
  const { data: urgentRequests = [], isLoading: loadingUrgent } =
    useUrgentPatientRequests(expertId);

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
  const upcomingAppointments =
    appointments?.filter(
      (apt) =>
        apt.status === "confirmed" && new Date(apt.start_time) > new Date()
    ) || [];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay("morning");
    else if (hour < 18) setTimeOfDay("afternoon");
    else setTimeOfDay("evening");

    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatAppointmentDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Check if appointment is today
      if (date.toDateString() === today.toDateString()) {
        return `Today at ${format(date, "h:mm a")}`;
      }

      // Check if appointment is tomorrow
      if (date.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow at ${format(date, "h:mm a")}`;
      }

      // Otherwise show day of week
      return `${format(date, "EEEE")} at ${format(date, "h:mm a")}`;
    } catch (error) {
      return dateString;
    }
  };

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

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isTomorrow =
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();

    const timeString = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      return `Today at ${timeString}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${timeString}`;
    } else {
      return `${date.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
      })} at ${timeString}`;
    }
  };

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

  // Get professional title based on role
  const getProfessionalTitle = () => {
    if (!profile) return "Professional";

    switch (profile.user_role) {
      case "therapist":
        return "Dr.";
      case "relationship_expert":
        return "Counselor";
      case "financial_expert":
        return "Advisor";
      case "dating_coach":
        return "Coach";
      case "health_wellness_coach":
        return "Coach";
      default:
        return "Professional";
    }
  };

  // Get client noun based on expert role
  const getClientNoun = () => {
    if (!profile) return "Client";

    switch (profile.user_role) {
      case "therapist":
        return "Patient";
      case "relationship_expert":
        return "Client";
      case "financial_expert":
        return "Client";
      case "dating_coach":
        return "Client";
      case "health_wellness_coach":
        return "Client";
      default:
        return "Client";
    }
  };

  // Get role-specific label for issues
  const getIssuesLabel = () => {
    if (!profile) return "Issues";

    switch (profile.user_role) {
      case "therapist":
        return "Conditions";
      case "relationship_expert":
        return "Relationship Concerns";
      case "financial_expert":
        return "Financial Concerns";
      case "dating_coach":
        return "Dating Challenges";
      case "health_wellness_coach":
        return "Health Concerns";
      default:
        return "Concerns";
    }
  };

  // Get expert role display name
  const getRoleDisplayName = () => {
    if (!profile?.user_role) return "Professional";
    return (
      EXPERT_ROLE_DISPLAY[
        profile.user_role as keyof typeof EXPERT_ROLE_DISPLAY
      ] || "Professional"
    );
  };

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <PageTitle
          title={`Welcome back, ${
            profile?.full_name?.split(" ")[0] || "there"
          }!`}
          subtitle={`${timeOfDay} • ${currentTime.toLocaleDateString()}`}
        />

        {/* Add Rapid Alerts Widget at the top */}
        <div className="max-w-4xl mx-auto">
          <RapidAlertsWidget />
        </div>

        {/* Quick Actions Section */}
        <motion.div
          className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <Link to="/therapist/chat">
              <Card className="h-full bg-black/50 border-border backdrop-blur-md hover:border-primary/50 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span>Messages</span>
                    {unreadConversationsCount > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                        {unreadConversationsCount}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-xs text-muted-foreground">
                    {unreadConversationsCount > 0
                      ? `${unreadConversationsCount} unread ${
                          unreadConversationsCount === 1
                            ? "conversation"
                            : "conversations"
                        }`
                      : "View and respond to client messages"}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full" size="sm">
                    Open Chat
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/therapist/appointments">
              <Card className="h-full bg-black/50 border-border backdrop-blur-md hover:border-primary/50 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Appointments</span>
                    {pendingAppointments.length > 0 && (
                      <span className="ml-auto bg-yellow-500 text-yellow-950 text-xs rounded-full px-2 py-1">
                        {pendingAppointments.length}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-xs text-muted-foreground">
                    {pendingAppointments.length > 0
                      ? `${pendingAppointments.length} pending request${
                          pendingAppointments.length !== 1 ? "s" : ""
                        }`
                      : "Manage upcoming appointments"}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full" size="sm">
                    View Schedule
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/therapist/availability">
              <Card className="h-full bg-black/50 border-border backdrop-blur-md hover:border-primary/50 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Availability</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-xs text-muted-foreground">
                    Set your weekly availability
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full" size="sm">
                    Manage Times
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/therapist/posts/create">
              <Card className="h-full bg-black/50 border-border backdrop-blur-md hover:border-primary/50 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Create Post</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-xs text-muted-foreground">
                    Share resources with all clients
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full" size="sm">
                    New Post
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>
        </motion.div>

        <Tabs defaultValue="overview">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">{getClientNoun()}s</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Summary Cards */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
            >
              <motion.div variants={item}>
                <Card className="bg-black/40 border-border backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total {getClientNoun()}s
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {loadingPatients ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          patientCount || 0
                        )}
                      </div>
                      <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-full">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-xs text-emerald-500 mt-1">
                      ↑ Growing your practice
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="bg-black/40 border-border backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Appointments This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {loadingAppointments ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          upcomingAppointments.length || 0
                        )}
                      </div>
                      <div className="p-2 bg-primary/20 text-primary rounded-full">
                        <Calendar className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {todayAppointments.length > 0
                        ? `${todayAppointments.length} today`
                        : "No appointments today"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="bg-black/40 border-border backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Unread Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {loadingConversations ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          unreadConversationsCount || 0
                        )}
                      </div>
                      <div className="p-2 bg-amber-500/20 text-amber-500 rounded-full">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-xs text-amber-500 mt-1">
                      {unreadConversationsCount > 0
                        ? unreadConversationsCount === 1
                          ? "1 conversation needs attention"
                          : `${unreadConversationsCount} conversations need attention`
                        : "All caught up!"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Urgent Requests */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-black/40 border-border backdrop-blur-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle>Urgent {getClientNoun()} Requests</CardTitle>
                        <Button variant="outline" size="sm">
                          View All
                        </Button>
                      </div>
                      <CardDescription>
                        Requests that need immediate attention
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingUrgent ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="mindful-loader"></div>
                        </div>
                      ) : urgentRequests && urgentRequests.length > 0 ? (
                        <div className="space-y-3">
                          {urgentRequests.map((request) => (
                            <div
                              key={request.id}
                              className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-border"
                            >
                              <div
                                className={`mt-1 rounded-full p-1.5 ${
                                  request.priority === "high"
                                    ? "bg-red-500/20 text-red-500"
                                    : request.priority === "medium"
                                    ? "bg-amber-500/20 text-amber-500"
                                    : "bg-blue-500/20 text-blue-500"
                                }`}
                              >
                                <AlertCircle className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <p className="font-medium">
                                    {request.patient?.full_name ||
                                      `Anonymous ${getClientNoun()}`}
                                  </p>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      request.priority === "high"
                                        ? "bg-red-500/20 text-red-500"
                                        : request.priority === "medium"
                                        ? "bg-amber-500/20 text-amber-500"
                                        : "bg-blue-500/20 text-blue-500"
                                    }`}
                                  >
                                    {request.priority === "high"
                                      ? "Urgent"
                                      : request.priority === "medium"
                                      ? "Important"
                                      : "Normal"}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {request.issue}
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                  <p className="text-xs text-muted-foreground">
                                    {formatMessageTime(request.created_at)}
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2"
                                      asChild
                                    >
                                      <Link
                                        to={`/therapist/chat/${request.patient_id}`}
                                      >
                                        Message
                                      </Link>
                                    </Button>
                                    <Button size="sm" className="h-7 px-2">
                                      Respond
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No urgent requests at the moment
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Upcoming Appointments */}
                <motion.div variants={item}>
                  <Card className="bg-black/40 border-border backdrop-blur-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Today's Schedule</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          asChild
                        >
                          <Link to="/therapist/appointments">
                            <span className="text-xs">View All</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loadingAppointments ? (
                        <div className="flex justify-center items-center py-4">
                          <div className="mindful-loader"></div>
                        </div>
                      ) : todayAppointments.length > 0 ? (
                        todayAppointments.slice(0, 3).map((appointment) => (
                          <div
                            key={appointment.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-border"
                          >
                            <Avatar>
                              <AvatarImage
                                src={appointment.patient?.avatar_url || ""}
                              />
                              <AvatarFallback>
                                {(appointment.patient?.full_name || "A")[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">
                                {appointment.patient?.full_name ||
                                  `Anonymous ${getClientNoun()}`}
                              </p>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {formatAppointmentTime(
                                    appointment.start_time,
                                    appointment.end_time
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {appointment.title || "Consultation"} •{" "}
                                {format(
                                  new Date(appointment.start_time),
                                  "h:mm a"
                                )}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : confirmedAppointments.length > 0 ? (
                        // If no appointments today, show upcoming ones
                        <div>
                          <p className="text-xs text-muted-foreground mb-4">
                            No appointments today. Showing upcoming:
                          </p>
                          {confirmedAppointments
                            .slice(0, 3)
                            .map((appointment) => (
                              <div
                                key={appointment.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-border mb-3"
                              >
                                <Avatar>
                                  <AvatarImage
                                    src={appointment.patient?.avatar_url || ""}
                                  />
                                  <AvatarFallback>
                                    {(appointment.patient?.full_name || "A")[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">
                                    {appointment.patient?.full_name ||
                                      `Anonymous ${getClientNoun()}`}
                                  </p>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    <span>
                                      {formatAppointmentDate(
                                        appointment.start_time
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {appointment.title || "Consultation"}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : pendingAppointments.length > 0 ? (
                        // If no confirmed appointments, but there are pending ones
                        <div>
                          <p className="text-xs text-yellow-400 mb-4">
                            No confirmed appointments. You have{" "}
                            {pendingAppointments.length} pending request
                            {pendingAppointments.length !== 1 ? "s" : ""}.
                          </p>
                          <Button variant="outline" className="w-full" asChild>
                            <Link to="/therapist/appointments">
                              Review Pending Requests
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No upcoming appointments
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/therapist/appointments">
                          <Calendar className="h-4 w-4 mr-2" />
                          View Full Schedule
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>

                {/* Recent Messages */}
                <motion.div variants={item}>
                  <Card className="bg-black/40 border-border backdrop-blur-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Recent Messages</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            to="/therapist/chat"
                            className="flex items-center gap-1"
                          >
                            <span className="text-xs">View All</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loadingMessages ? (
                        <div className="flex justify-center items-center py-4">
                          <div className="mindful-loader"></div>
                        </div>
                      ) : recentMessages && recentMessages.length > 0 ? (
                        recentMessages.map((message) => (
                          <div
                            key={message.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-border"
                          >
                            <Avatar className="relative">
                              <AvatarImage
                                src={message.sender?.avatar_url || ""}
                              />
                              <AvatarFallback>
                                {(message.sender?.full_name || "U")[0]}
                              </AvatarFallback>
                              {!message.read && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"></span>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">
                                  {message.sender?.full_name ||
                                    `Unknown ${getClientNoun()}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatMessageTime(message.created_at)}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No recent messages
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/therapist/chat">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Go to Messages
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="patients">
            <Card className="bg-black/40 border-border backdrop-blur-md mt-6">
              <CardHeader>
                <CardTitle>Your {getClientNoun()}s</CardTitle>
                <CardDescription>
                  Manage your {getClientNoun().toLowerCase()}s and their care
                  plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground py-4">
                  {getClientNoun()} management interface will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card className="bg-black/40 border-border backdrop-blur-md mt-6">
              <CardHeader>
                <CardTitle>Appointment Calendar</CardTitle>
                <CardDescription>
                  Manage your appointment schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAppointments ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="mindful-loader"></div>
                  </div>
                ) : appointments && appointments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2">Time</th>
                          <th className="text-left py-2 px-2">
                            {getClientNoun()}
                          </th>
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-left py-2 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments
                          .sort((a, b) => {
                            // Sort by status (pending first), then by date
                            if (
                              a.status === "pending" &&
                              b.status !== "pending"
                            )
                              return -1;
                            if (
                              a.status !== "pending" &&
                              b.status === "pending"
                            )
                              return 1;
                            return (
                              new Date(a.start_time).getTime() -
                              new Date(b.start_time).getTime()
                            );
                          })
                          .slice(0, 5) // Limit to 5 appointments for the dashboard
                          .map((appointment) => {
                            const appointmentDate = new Date(
                              appointment.start_time
                            );
                            const isToday =
                              appointmentDate.toDateString() ===
                              new Date().toDateString();
                            const isPast = appointmentDate < new Date();

                            return (
                              <tr
                                key={appointment.id}
                                className="border-b border-border/50 hover:bg-black/30"
                              >
                                <td className="py-3 px-2">
                                  <div className="font-medium">
                                    {formatAppointmentDate(
                                      appointment.start_time
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={
                                          appointment.patient?.avatar_url || ""
                                        }
                                      />
                                      <AvatarFallback>
                                        {
                                          (appointment.patient?.full_name ||
                                            "A")[0]
                                        }
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>
                                      {appointment.patient?.full_name ||
                                        `Anonymous ${getClientNoun()}`}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-2">
                                  {appointment.title || "Consultation"}
                                </td>
                                <td className="py-3 px-2">
                                  {appointment.status === "pending" ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                                      Pending
                                    </span>
                                  ) : isPast ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                                      Completed
                                    </span>
                                  ) : isToday ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                                      Today
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-500">
                                      Upcoming
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No appointments scheduled
                    </p>
                    <Button className="mt-4" asChild>
                      <Link to="/therapist/availability">
                        Manage Your Availability
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
              {appointments && appointments.length > 0 && (
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link to="/therapist/appointments">
                      Full Appointment Manager
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/therapist/availability">
                      Manage Availability
                    </Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsWidget expertId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
