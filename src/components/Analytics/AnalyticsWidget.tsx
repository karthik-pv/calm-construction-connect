import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Calendar,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";

interface AnalyticsData {
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  appointmentsBooked: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  appointmentsPending: number;
  monthlyData: Array<{
    month: string;
    messages: number;
    appointments: number;
  }>;
}

interface AnalyticsWidgetProps {
  expertId: string | undefined;
}

// Custom hook to fetch analytics data
function useTherapistAnalytics(expertId: string | undefined) {
  return useQuery<AnalyticsData>({
    queryKey: ["therapistAnalytics", expertId],
    queryFn: async () => {
      if (!expertId) throw new Error("Expert ID is required");

      // Fetch message statistics
      const {
        data: sentMessages,
        error: sentError,
        count: sentCount,
      } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", expertId);

      const {
        data: receivedMessages,
        error: receivedError,
        count: receivedCount,
      } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", expertId);

      // Fetch appointment statistics
      const {
        data: bookedAppointments,
        error: bookedError,
        count: bookedCount,
      } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("therapist_id", expertId);

      const {
        data: completedAppointments,
        error: completedError,
        count: completedCount,
      } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("therapist_id", expertId)
        .eq("status", "completed");

      const {
        data: cancelledAppointments,
        error: cancelledError,
        count: cancelledCount,
      } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("therapist_id", expertId)
        .in("status", ["cancelled", "canceled"]);

      const {
        data: pendingAppointments,
        error: pendingError,
        count: pendingCount,
      } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("therapist_id", expertId)
        .eq("status", "pending");

      // Fetch monthly data for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: monthlyMessages, error: monthlyMessagesError } =
        await supabase
          .from("chat_messages")
          .select("created_at")
          .eq("sender_id", expertId)
          .gte("created_at", sixMonthsAgo.toISOString());

      const { data: monthlyAppointments, error: monthlyAppointmentsError } =
        await supabase
          .from("appointments")
          .select("created_at")
          .eq("therapist_id", expertId)
          .gte("created_at", sixMonthsAgo.toISOString());

      // Check for errors
      if (
        sentError ||
        receivedError ||
        bookedError ||
        completedError ||
        cancelledError ||
        pendingError ||
        monthlyMessagesError ||
        monthlyAppointmentsError
      ) {
        console.error("Error fetching analytics data:", {
          sentError,
          receivedError,
          bookedError,
          completedError,
          cancelledError,
          pendingError,
          monthlyMessagesError,
          monthlyAppointmentsError,
        });
        throw new Error("Failed to fetch analytics data");
      }

      // Process monthly data
      const monthlyData = [];
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = months[date.getMonth()];
        const year = date.getFullYear();
        const monthKey = `${monthName} ${year}`;

        const messagesInMonth = (monthlyMessages || []).filter((msg) => {
          const msgDate = new Date(msg.created_at);
          return (
            msgDate.getMonth() === date.getMonth() &&
            msgDate.getFullYear() === year
          );
        }).length;

        const appointmentsInMonth = (monthlyAppointments || []).filter(
          (apt) => {
            const aptDate = new Date(apt.created_at);
            return (
              aptDate.getMonth() === date.getMonth() &&
              aptDate.getFullYear() === year
            );
          }
        ).length;

        monthlyData.push({
          month: monthKey,
          messages: messagesInMonth,
          appointments: appointmentsInMonth,
        });
      }

      return {
        totalMessages: (sentCount || 0) + (receivedCount || 0),
        sentMessages: sentCount || 0,
        receivedMessages: receivedCount || 0,
        appointmentsBooked: bookedCount || 0,
        appointmentsCompleted: completedCount || 0,
        appointmentsCancelled: cancelledCount || 0,
        appointmentsPending: pendingCount || 0,
        monthlyData,
      };
    },
    enabled: !!expertId,
  });
}

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  secondary: "#6b7280",
};

export function AnalyticsWidget({ expertId }: AnalyticsWidgetProps) {
  const { data: analytics, isLoading, error } = useTherapistAnalytics(expertId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-black/40 border-border backdrop-blur-md">
            <CardHeader>
              <div className="h-6 bg-gray-600 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-600 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="bg-black/40 border-border backdrop-blur-md">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Failed to load analytics data</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const appointmentStatusData = [
    {
      name: "Completed",
      value: analytics.appointmentsCompleted,
      color: COLORS.success,
    },
    {
      name: "Pending",
      value: analytics.appointmentsPending,
      color: COLORS.warning,
    },
    {
      name: "Cancelled",
      value: analytics.appointmentsCancelled,
      color: COLORS.danger,
    },
  ].filter((item) => item.value > 0);

  const messageBreakdownData = [
    { name: "Sent", value: analytics.sentMessages, color: COLORS.primary },
    {
      name: "Received",
      value: analytics.receivedMessages,
      color: COLORS.secondary,
    },
  ].filter((item) => item.value > 0);

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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Summary Cards */}
      <motion.div
        variants={item}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="bg-black/40 border-border backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Total Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.sentMessages} sent, {analytics.receivedMessages}{" "}
              received
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-border backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-warning" />
              Appointments Booked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.appointmentsBooked}
            </div>
            <p className="text-xs text-muted-foreground">Total bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-border backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.appointmentsCompleted}
            </div>
            <p className="text-xs text-success">
              {analytics.appointmentsBooked > 0
                ? `${Math.round(
                    (analytics.appointmentsCompleted /
                      analytics.appointmentsBooked) *
                      100
                  )}% completion rate`
                : "No appointments yet"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-border backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-danger" />
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.appointmentsCancelled}
            </div>
            <p className="text-xs text-danger">
              {analytics.appointmentsBooked > 0
                ? `${Math.round(
                    (analytics.appointmentsCancelled /
                      analytics.appointmentsBooked) *
                      100
                  )}% cancellation rate`
                : "No cancellations"}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity Bar Chart */}
        <motion.div variants={item}>
          <Card className="bg-black/40 border-border backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Monthly Activity
              </CardTitle>
              <CardDescription>
                Messages and appointments over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#f9fafb",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="messages"
                    fill={COLORS.primary}
                    name="Messages"
                  />
                  <Bar
                    dataKey="appointments"
                    fill={COLORS.success}
                    name="Appointments"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appointment Status Pie Chart */}
        <motion.div variants={item}>
          <Card className="bg-black/40 border-border backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Appointment Status
              </CardTitle>
              <CardDescription>
                Breakdown of appointment statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointmentStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={appointmentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {appointmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#f9fafb",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-300">
                  <p className="text-muted-foreground">
                    No appointment data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Message Breakdown Pie Chart */}
        <motion.div variants={item}>
          <Card className="bg-black/40 border-border backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Message Breakdown
              </CardTitle>
              <CardDescription>Sent vs received messages</CardDescription>
            </CardHeader>
            <CardContent>
              {messageBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={messageBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {messageBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#f9fafb",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-300">
                  <p className="text-muted-foreground">
                    No message data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Overview */}
        <motion.div variants={item}>
          <Card className="bg-black/40 border-border backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Overview
              </CardTitle>
              <CardDescription>Key performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Rate</span>
                <span className="text-sm text-muted-foreground">
                  {analytics.receivedMessages > 0
                    ? `${Math.round(
                        (analytics.sentMessages / analytics.receivedMessages) *
                          100
                      )}%`
                    : "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm text-success">
                  {analytics.appointmentsBooked > 0
                    ? `${Math.round(
                        (analytics.appointmentsCompleted /
                          analytics.appointmentsBooked) *
                          100
                      )}%`
                    : "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Active Conversations
                </span>
                <span className="text-sm text-primary">
                  {analytics.receivedMessages > 0 ? "Active" : "No activity"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Avg. Monthly Appointments
                </span>
                <span className="text-sm text-muted-foreground">
                  {analytics.monthlyData.length > 0
                    ? Math.round(
                        analytics.monthlyData.reduce(
                          (sum, month) => sum + month.appointments,
                          0
                        ) / analytics.monthlyData.length
                      )
                    : 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
