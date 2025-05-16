import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { Calendar, Clock, FileText, MessageCircle, PlusCircle, Users, ArrowUpRight, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";

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

interface Appointment {
  id: string;
  patient_id: string;
  expert_id: string;
  scheduled_at: string;
  duration_minutes: number;
  appointment_type: string;
  notes?: string;
  patient?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface UrgentRequest {
  id: string;
  patient_id: string;
  expert_id: string;
  issue: string;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  patient?: {
    full_name?: string;
    avatar_url?: string;
  };
}

// Mapped display names for each expert role
const EXPERT_ROLE_DISPLAY = {
  'therapist': 'Therapist',
  'relationship_expert': 'Relationship Expert',
  'financial_expert': 'Financial Expert',
  'dating_coach': 'Dating Coach',
  'health_wellness_coach': 'Health & Wellness Coach'
};

// Define custom hooks for data fetching
function usePatientCount(expertId: string | undefined) {
  return useQuery<number, Error>({
    queryKey: ['patientCount', expertId],
    queryFn: async () => {
      if (!expertId) return 0;
      
      // Get count of unique patients for this expert
      const { data, error, count } = await supabase
        .from('expert_client')
        .select('client_id', { count: 'exact', head: true })
        .eq('expert_id', expertId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!expertId,
  });
}

function useAppointmentsThisWeek(expertId: string | undefined) {
  return useQuery<Appointment[], Error>({
    queryKey: ['appointmentsWeek', expertId],
    queryFn: async () => {
      if (!expertId) return [];
      
      // Get start and end of current week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7); // Next Sunday
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          expert_id,
          scheduled_at,
          duration_minutes,
          appointment_type,
          notes,
          patient:patient_id(full_name, avatar_url)
        `)
        .eq('expert_id', expertId)
        .gte('scheduled_at', startOfWeek.toISOString())
        .lt('scheduled_at', endOfWeek.toISOString())
        .order('scheduled_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!expertId,
  });
}

function useUnreadMessagesCount(expertId: string | undefined) {
  return useQuery<number, Error>({
    queryKey: ['unreadMessages', expertId],
    queryFn: async () => {
      if (!expertId) return 0;
      
      const { data, error, count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', expertId)
        .eq('read', false);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!expertId,
  });
}

function useRecentMessages(expertId: string | undefined) {
  return useQuery<Message[], Error>({
    queryKey: ['recentMessages', expertId],
    queryFn: async () => {
      if (!expertId) return [];
      
      // Get recent messages where the expert is the receiver
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read,
          sender:sender_id(full_name, avatar_url)
        `)
        .eq('receiver_id', expertId)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!expertId,
  });
}

function usePatientIssueDistribution(expertId: string | undefined) {
  return useQuery<{ name: string; value: number }[], Error>({
    queryKey: ['patientIssues', expertId],
    queryFn: async () => {
      if (!expertId) return [];
      
      // This is a simplified implementation - in a real app, you would have a proper 
      // data structure for tracking patient issues
      
      // For now, we'll use a mock implementation that checks patient profiles' specialization field
      // Get all patients for this expert
      const { data: patientRelations, error: relationsError } = await supabase
        .from('expert_client')
        .select('client_id')
        .eq('expert_id', expertId);
      
      if (relationsError) throw relationsError;
      if (!patientRelations || patientRelations.length === 0) return [];
      
      const patientIds = patientRelations.map(rel => rel.client_id);
      
      // Get profiles with issue information
      const { data: patients, error: patientsError } = await supabase
        .from('profiles')
        .select('specialization')
        .in('id', patientIds);
      
      if (patientsError) throw patientsError;
      if (!patients || patients.length === 0) return [];
      
      // Count issues
      const issueCount: Record<string, number> = {};
      patients.forEach(patient => {
        const issue = patient.specialization || 'Other';
        issueCount[issue] = (issueCount[issue] || 0) + 1;
      });
      
      // Convert to chart format
      return Object.entries(issueCount).map(([name, value]) => ({ name, value }));
    },
    enabled: !!expertId,
  });
}

function useUrgentPatientRequests(expertId: string | undefined) {
  return useQuery<UrgentRequest[], Error>({
    queryKey: ['urgentRequests', expertId],
    queryFn: async () => {
      if (!expertId) return [];
      
      // In a real app, you would have a dedicated table for urgent requests
      // This is a simplified version using chat messages with priority flags
      
      // For simplicity, we'll use unread messages as "urgent requests"
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          sender_id,
          content,
          created_at,
          sender:sender_id(full_name, avatar_url)
        `)
        .eq('receiver_id', expertId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      
      // Transform to urgent requests format
      return (data || []).map(msg => ({
        id: msg.id.toString(),
        patient_id: msg.sender_id,
        expert_id: expertId,
        issue: msg.content,
        priority: 'high' as const, // Assuming unread messages are high priority
        created_at: msg.created_at,
        patient: msg.sender
      }));
    },
    enabled: !!expertId,
  });
}

function usePatientEngagement(expertId: string | undefined) {
  return useQuery<{ name: string; sessions: number; messages: number }[], Error>({
    queryKey: ['patientEngagement', expertId],
    queryFn: async () => {
      if (!expertId) return [];
      
      // This would typically come from analytics tracking
      // For now, we'll return sample data
      // In a real implementation, you would query this from your database
      
      return [
        { name: "Week 1", sessions: 12, messages: 25 },
        { name: "Week 2", sessions: 15, messages: 32 },
        { name: "Week 3", sessions: 14, messages: 28 },
        { name: "Week 4", sessions: 18, messages: 40 },
      ];
    },
    enabled: !!expertId,
  });
}

// Colors for charts
const COLORS = ["#9b87f5", "#7E69AB", "#D6BCFA", "#553C9A", "#805AD5"];

// Expert Dashboard component - used by all expert types
export default function ExpertDashboard() {
  const { profile } = useAuth();
  const [timeOfDay, setTimeOfDay] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Use our custom hooks for real data
  const { data: patientCount, isLoading: loadingPatients } = usePatientCount(profile?.id);
  const { data: appointments, isLoading: loadingAppointments } = useAppointmentsThisWeek(profile?.id);
  const { data: unreadCount, isLoading: loadingUnread } = useUnreadMessagesCount(profile?.id);
  const { data: recentMessages, isLoading: loadingMessages } = useRecentMessages(profile?.id);
  const { data: patientIssues, isLoading: loadingIssues } = usePatientIssueDistribution(profile?.id);
  const { data: urgentRequests, isLoading: loadingUrgent } = useUrgentPatientRequests(profile?.id);
  const { data: patientEngagement, isLoading: loadingEngagement } = usePatientEngagement(profile?.id);
  
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
  
  const formatAppointmentTime = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const isToday = 
      date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear();
    
    const isTomorrow = 
      date.getDate() === tomorrow.getDate() && 
      date.getMonth() === tomorrow.getMonth() && 
      date.getFullYear() === tomorrow.getFullYear();
    
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Today at ${timeString}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${timeString}`;
    } else {
      return `${date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} at ${timeString}`;
    }
  };
  
  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 24 * 60) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Get professional title based on role
  const getProfessionalTitle = () => {
    if (!profile) return "Professional";
    
    switch (profile.user_role) {
      case "therapist": return "Dr.";
      case "relationship_expert": return "Counselor";
      case "financial_expert": return "Advisor";
      case "dating_coach": return "Coach";
      case "health_wellness_coach": return "Coach";
      default: return "Professional";
    }
  };
  
  // Get client noun based on expert role
  const getClientNoun = () => {
    if (!profile) return "Client";
    
    switch (profile.user_role) {
      case "therapist": return "Patient";
      case "relationship_expert": return "Client";
      case "financial_expert": return "Client";
      case "dating_coach": return "Client";
      case "health_wellness_coach": return "Client";
      default: return "Client";
    }
  };
  
  // Get role-specific label for issues
  const getIssuesLabel = () => {
    if (!profile) return "Issues";
    
    switch (profile.user_role) {
      case "therapist": return "Conditions";
      case "relationship_expert": return "Relationship Concerns";
      case "financial_expert": return "Financial Concerns";
      case "dating_coach": return "Dating Challenges";
      case "health_wellness_coach": return "Health Concerns";
      default: return "Concerns";
    }
  };
  
  // Get expert role display name
  const getRoleDisplayName = () => {
    if (!profile?.user_role) return "Professional";
    return EXPERT_ROLE_DISPLAY[profile.user_role as keyof typeof EXPERT_ROLE_DISPLAY] || "Professional";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Good {timeOfDay}, {getProfessionalTitle()} {profile?.full_name?.split(' ')[0] || 'Professional'}</h1>
              <p className="text-muted-foreground">
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} — <span className="text-primary">{getRoleDisplayName()}</span> Dashboard
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Link to="/therapist/posts/create">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Create Post</span>
                </Button>
              </Link>
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>New Appointment</span>
              </Button>
            </div>
          </div>
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
                    <CardTitle className="text-sm font-medium">Total {getClientNoun()}s</CardTitle>
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
                    <p className="text-xs text-emerald-500 mt-1">↑ Growing your practice</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={item}>
                <Card className="bg-black/40 border-border backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Appointments This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {loadingAppointments ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          appointments?.length || 0
                        )}
                      </div>
                      <div className="p-2 bg-primary/20 text-primary rounded-full">
                        <Calendar className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {appointments && appointments.filter(a => new Date(a.scheduled_at) > new Date()).length} upcoming
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={item}>
                <Card className="bg-black/40 border-border backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {loadingUnread ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          unreadCount || 0
                        )}
                      </div>
                      <div className="p-2 bg-amber-500/20 text-amber-500 rounded-full">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-xs text-amber-500 mt-1">
                      {unreadCount && unreadCount > 0 ? 'Needs attention' : 'All caught up!'}
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
                        <Button variant="outline" size="sm">View All</Button>
                      </div>
                      <CardDescription>Requests that need immediate attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingUrgent ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="mindful-loader"></div>
                        </div>
                      ) : urgentRequests && urgentRequests.length > 0 ? (
                        <div className="space-y-3">
                          {urgentRequests.map(request => (
                            <div 
                              key={request.id} 
                              className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-border"
                            >
                              <div className={`mt-1 rounded-full p-1.5 ${
                                request.priority === 'high' ? 'bg-red-500/20 text-red-500' : 
                                request.priority === 'medium' ? 'bg-amber-500/20 text-amber-500' : 
                                'bg-blue-500/20 text-blue-500'
                              }`}>
                                <AlertCircle className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <p className="font-medium">{request.patient?.full_name || `Anonymous ${getClientNoun()}`}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    request.priority === 'high' ? 'bg-red-500/20 text-red-500' : 
                                    request.priority === 'medium' ? 'bg-amber-500/20 text-amber-500' : 
                                    'bg-blue-500/20 text-blue-500'
                                  }`}>
                                    {request.priority === 'high' ? 'Urgent' : 
                                    request.priority === 'medium' ? 'Important' : 'Normal'}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{request.issue}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <p className="text-xs text-muted-foreground">
                                    {formatMessageTime(request.created_at)}
                                  </p>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="h-7 px-2" asChild>
                                      <Link to={`/therapist/chat/${request.patient_id}`}>Message</Link>
                                    </Button>
                                    <Button size="sm" className="h-7 px-2">Respond</Button>
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
                
                {/* Client Analytics */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-black/40 border-border backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>{getClientNoun()} Engagement</CardTitle>
                      <CardDescription>Session attendance and message activity over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingEngagement ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="mindful-loader"></div>
                        </div>
                      ) : patientEngagement && patientEngagement.length > 0 ? (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={patientEngagement}
                              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip contentStyle={{ backgroundColor: "#1c1c1c", borderColor: "#333" }} />
                              <Legend />
                              <Bar dataKey="sessions" name="Sessions" fill="#9b87f5" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="messages" name="Messages" fill="#553C9A" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No engagement data available yet
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
                        <Button variant="ghost" size="sm" className="gap-1">
                          <span className="text-xs">View All</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loadingAppointments ? (
                        <div className="flex justify-center items-center py-4">
                          <div className="mindful-loader"></div>
                        </div>
                      ) : appointments && appointments.length > 0 ? (
                        appointments.slice(0, 2).map(appointment => (
                          <div 
                            key={appointment.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-border"
                          >
                            <Avatar>
                              <AvatarImage src={appointment.patient?.avatar_url || ""} />
                              <AvatarFallback>{(appointment.patient?.full_name || "A")[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{appointment.patient?.full_name || `Anonymous ${getClientNoun()}`}</p>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{formatAppointmentTime(new Date(appointment.scheduled_at))}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {appointment.appointment_type} • {appointment.duration_minutes} min
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No upcoming appointments
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        <Calendar className="h-4 w-4 mr-2" />
                        View Full Schedule
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
                
                {/* Client Issues Pie Chart */}
                <motion.div variants={item}>
                  <Card className="bg-black/40 border-border backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>{getClientNoun()} {getIssuesLabel()} Distribution</CardTitle>
                      <CardDescription>Common {getIssuesLabel().toLowerCase()} among your {getClientNoun().toLowerCase()}s</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingIssues ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="mindful-loader"></div>
                        </div>
                      ) : patientIssues && patientIssues.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={patientIssues}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                              >
                                {patientIssues.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: "#1c1c1c", borderColor: "#333" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No {getClientNoun().toLowerCase()} data available
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
                
                {/* Recent Messages */}
                <motion.div variants={item}>
                  <Card className="bg-black/40 border-border backdrop-blur-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Recent Messages</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/therapist/chat" className="flex items-center gap-1">
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
                        recentMessages.map(message => (
                          <div 
                            key={message.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-border"
                          >
                            <Avatar className="relative">
                              <AvatarImage src={message.sender?.avatar_url || ""} />
                              <AvatarFallback>{(message.sender?.full_name || "U")[0]}</AvatarFallback>
                              {!message.read && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"></span>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{message.sender?.full_name || `Unknown ${getClientNoun()}`}</p>
                                <p className="text-xs text-muted-foreground">{formatMessageTime(message.created_at)}</p>
                              </div>
                              <p className="text-sm text-muted-foreground truncate mt-1">{message.content}</p>
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
                <CardDescription>Manage your {getClientNoun().toLowerCase()}s and their care plans</CardDescription>
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
                <CardDescription>Manage your appointment schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground py-4">
                  Calendar and appointment management interface will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card className="bg-black/40 border-border backdrop-blur-md mt-6">
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Track your practice performance and {getClientNoun().toLowerCase()} outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground py-4">
                  Detailed analytics dashboard will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
