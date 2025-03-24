
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Clock, FileText, MessageCircle, PlusCircle, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Demo data for dashboard
const weeklyPatientData = [
  { name: "Mon", patients: 5 },
  { name: "Tue", patients: 7 },
  { name: "Wed", patients: 4 },
  { name: "Thu", patients: 8 },
  { name: "Fri", patients: 6 },
  { name: "Sat", patients: 3 },
  { name: "Sun", patients: 0 },
];

const patientIssuesData = [
  { name: "Anxiety", value: 35 },
  { name: "Depression", value: 25 },
  { name: "Work Stress", value: 20 },
  { name: "PTSD", value: 10 },
  { name: "Other", value: 10 },
];

const COLORS = ["#9b87f5", "#7E69AB", "#D6BCFA", "#553C9A", "#805AD5"];

const upcomingAppointments = [
  {
    id: "1",
    patientName: "John Builder",
    patientAvatar: "https://i.pravatar.cc/150?img=1",
    date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    duration: 50,
    type: "Video Call",
    notes: "Follow-up on sleep issues and workplace stress",
  },
  {
    id: "2",
    patientName: "Rob Wilson",
    patientAvatar: "https://i.pravatar.cc/150?img=3",
    date: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
    duration: 50,
    type: "In-person",
    notes: "Initial consultation",
  },
  {
    id: "3",
    patientName: "Mark Johnson",
    patientAvatar: "https://i.pravatar.cc/150?img=4",
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    duration: 50,
    type: "Video Call",
    notes: "Discussing coping mechanisms for site pressure",
  },
];

const recentMessages = [
  {
    id: "1",
    patientName: "John Builder",
    patientAvatar: "https://i.pravatar.cc/150?img=1",
    message: "I've been having trouble sleeping lately due to job stress.",
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    unread: true,
  },
  {
    id: "2",
    patientName: "Rob Wilson",
    patientAvatar: "https://i.pravatar.cc/150?img=3",
    message: "The mindfulness exercises have been really helpful, thank you.",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    unread: false,
  },
  {
    id: "3",
    patientName: "Mark Johnson",
    patientAvatar: "https://i.pravatar.cc/150?img=4",
    message: "When can we schedule our next session?",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    unread: false,
  },
];

export default function TherapistDashboard() {
  const { user } = useAuth();
  const [timeOfDay, setTimeOfDay] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  
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
  
  const formatMessageTime = (date: Date) => {
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
              <h1 className="text-2xl font-bold">Good {timeOfDay}, {user?.name?.split(' ')[0] || 'Doctor'}</h1>
              <p className="text-muted-foreground">
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
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
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
            >
              <motion.div variants={item} className="col-span-1">
                <Card className="h-full bg-black/40 border-border backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <CardDescription>Your schedule for today and tomorrow</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {upcomingAppointments.length > 0 ? (
                      upcomingAppointments.map(appointment => (
                        <div 
                          key={appointment.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-border"
                        >
                          <Avatar>
                            <AvatarImage src={appointment.patientAvatar} />
                            <AvatarFallback>{appointment.patientName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{appointment.patientName}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatAppointmentTime(appointment.date)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {appointment.type} • {appointment.duration} min
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
              
              <motion.div variants={item} className="col-span-1">
                <Card className="h-full bg-black/40 border-border backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Recent Messages</CardTitle>
                    <CardDescription>Latest patient communications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentMessages.map(message => (
                      <div 
                        key={message.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-border"
                      >
                        <Avatar>
                          <AvatarImage src={message.patientAvatar} />
                          <AvatarFallback>{message.patientName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{message.patientName}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm truncate">{message.message}</p>
                          {message.unread && (
                            <div className="mt-1 text-xs text-primary font-medium">
                              Unread message
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Link to="/therapist/chat" className="w-full">
                      <Button variant="outline" className="w-full">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Open All Messages
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
              
              <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-1">
                <Card className="h-full bg-black/40 border-border backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Patient Issues Breakdown</CardTitle>
                    <CardDescription>Distribution of presenting issues</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-[250px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={patientIssuesData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#9b87f5"
                            paddingAngle={1}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {patientIssuesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-3">
                <Card className="bg-black/40 border-border backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Weekly Patient Activity</CardTitle>
                    <CardDescription>Number of patients seen per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={weeklyPatientData}
                          margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                          <XAxis dataKey="name" stroke="#6b6b6b" />
                          <YAxis stroke="#6b6b6b" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                              border: '1px solid #444',
                              borderRadius: '4px',
                              color: 'white'
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="patients" 
                            stroke="#9b87f5" 
                            fill="url(#purpleGradient)" 
                          />
                          <defs>
                            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#9b87f5" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="patients">
            <div className="mt-6">
              <Card className="bg-black/40 border-border backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Your Patients</CardTitle>
                  <CardDescription>Manage and view your patient list</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-medium">Patient Management</h3>
                    <p className="mt-2 text-muted-foreground">
                      View detailed patient records, treatment plans, and session notes.
                    </p>
                    <Button className="mt-4">View Patient Records</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="appointments">
            <div className="mt-6">
              <Card className="bg-black/40 border-border backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Appointment Schedule</CardTitle>
                  <CardDescription>Manage your calendar and availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-medium">Calendar Management</h3>
                    <p className="mt-2 text-muted-foreground">
                      View and manage your appointment calendar, set availability, and schedule sessions.
                    </p>
                    <Button className="mt-4">Open Calendar</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
