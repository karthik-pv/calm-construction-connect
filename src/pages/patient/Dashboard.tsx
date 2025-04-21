import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/shared/PageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Brain, Calendar, MessageCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function PatientDashboard() {
  const { profile } = useAuth();

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
        <PageTitle 
          title={`Welcome, ${profile?.full_name?.split(' ')[0] || 'there'}!`} 
          subtitle="Your mental wellness dashboard"
        />

        <motion.div 
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <Link to="/patient/chatbot">
              <Card className="h-full bg-black/50 border-border backdrop-blur-md hover:border-primary/50 transition-all duration-300">
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
                    Our AI can provide support, resources, and coping strategies for common mental health challenges.
                  </p>
                  <Button className="w-full mt-4">Start Chatting</Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/patient/experts">
              <Card className="h-full bg-black/50 border-border backdrop-blur-md hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Find an Expert</span>
                  </CardTitle>
                  <CardDescription>
                    Connect with professionals specializing in construction worker well-being
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Browse experts specializing in construction worker mental health, relationships, finances, and more.
                  </p>
                  <Button className="w-full mt-4">Browse Experts</Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/patient/anxiety-calmer">
              <Card className="h-full bg-black/50 border-border backdrop-blur-md hover:border-primary/50 transition-all duration-300">
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
                    Listen to calming sounds and guided meditations to reduce anxiety and stress.
                  </p>
                  <Button className="w-full mt-4">Start Relaxing</Button>
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
          <Card className="bg-black/50 border-border backdrop-blur-md">
            <CardHeader>
              <CardTitle>Latest Updates</CardTitle>
              <CardDescription>Recent activity and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-lg bg-black/30">
                  <div className="rounded-full bg-primary/20 p-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">New message from Dr. Sarah Thompson</p>
                    <p className="text-sm text-muted-foreground">
                      "Hi there, just checking in to see how you're doing after our last session..."
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg bg-black/30">
                  <div className="rounded-full bg-primary/20 p-2">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">New mindfulness workshop available</p>
                    <p className="text-sm text-muted-foreground">
                      "Managing Stress on Construction Sites" workshop is now available to watch.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Yesterday</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg bg-black/30">
                  <div className="rounded-full bg-primary/20 p-2">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Weekly check-in reminder</p>
                    <p className="text-sm text-muted-foreground">
                      Don't forget to complete your weekly mental health check-in.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
