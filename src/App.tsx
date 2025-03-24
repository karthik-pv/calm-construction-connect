
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RegisterTherapist from "./pages/auth/RegisterTherapist";
import RegisterPatient from "./pages/auth/RegisterPatient";

// Patient Pages
import PatientDashboard from "./pages/patient/Dashboard";
import PatientProfile from "./pages/patient/Profile";
import PatientChat from "./pages/patient/Chat";
import PatientChatbot from "./pages/patient/Chatbot";
import PatientTherapists from "./pages/patient/Therapists";
import PatientPosts from "./pages/patient/Posts";
import PatientAnxietyCalmer from "./pages/patient/AnxietyCalmer";

// Therapist Pages
import TherapistDashboard from "./pages/therapist/Dashboard";
import TherapistProfile from "./pages/therapist/Profile";
import TherapistChat from "./pages/therapist/Chat";
import TherapistPosts from "./pages/therapist/Posts";
import CreatePost from "./pages/therapist/CreatePost";

// Other Pages
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Auth Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/therapist" element={<RegisterTherapist />} />
            <Route path="/register/patient" element={<RegisterPatient />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Patient Routes */}
            <Route path="/patient" element={<PatientDashboard />} />
            <Route path="/patient/profile" element={<PatientProfile />} />
            <Route path="/patient/chat" element={<PatientChat />} />
            <Route path="/patient/chat/:id" element={<PatientChat />} />
            <Route path="/patient/chatbot" element={<PatientChatbot />} />
            <Route path="/patient/therapists" element={<PatientTherapists />} />
            <Route path="/patient/posts" element={<PatientPosts />} />
            <Route path="/patient/anxiety-calmer" element={<PatientAnxietyCalmer />} />
            
            {/* Therapist Routes */}
            <Route path="/therapist" element={<TherapistDashboard />} />
            <Route path="/therapist/profile" element={<TherapistProfile />} />
            <Route path="/therapist/chat" element={<TherapistChat />} />
            <Route path="/therapist/chat/:id" element={<TherapistChat />} />
            <Route path="/therapist/posts" element={<TherapistPosts />} />
            <Route path="/therapist/posts/create" element={<CreatePost />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
