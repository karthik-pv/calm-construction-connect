import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RegisterTherapist from "./pages/auth/RegisterTherapist";
import RegisterPatient from "./pages/auth/RegisterPatient";
import Logout from "./pages/auth/Logout";

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

// Admin Pages
import ManageTherapists from "./pages/admin/ManageTherapists";

// Other Pages
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Background components (assuming they don't need auth context)
const CosmicBackground = () => {
  return (
    <>
      <div className="cosmos-bg">
        <div className="stars"></div>
        <div className="parallax-stars"></div>
      </div>
      <div className="moving-gradient"></div>
      <div className="aurora-container">
        <div className="aurora"></div>
      </div>
      <div className="orbs-container">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
    </>
  );
};

// Component to handle redirects for already logged-in users
const AuthRedirector = () => {
  const { isAuthenticated, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen w-screen"><div className="mindful-loader"></div></div>;
  }

  if (isAuthenticated && profile) {
    const homePath = profile.user_role === 'patient' ? '/patient' : '/therapist';
    return <Navigate to={homePath} replace />;
  }

  // If not loading and not authenticated, allow rendering the auth page (Outlet)
  return <Outlet />;
};

const AppRoutes = () => (
  <Routes>
    {/* Auth Routes - Redirect if logged in */}
    <Route element={<AuthRedirector />}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/therapist" element={<RegisterTherapist />} />
      <Route path="/register/patient" element={<RegisterPatient />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* Redirect root to login if not logged in */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Route>
    
    {/* Logout Route - Available to authenticated users */}
    <Route path="/logout" element={<Logout />} />
    
    {/* Patient Routes - Protected */}
    <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
      <Route path="/patient" element={<PatientDashboard />} />
      <Route path="/patient/profile" element={<PatientProfile />} />
      <Route path="/patient/chat" element={<PatientChat />} />
      <Route path="/patient/chat/:id" element={<PatientChat />} />
      <Route path="/patient/chatbot" element={<PatientChatbot />} />
      <Route path="/patient/therapists" element={<PatientTherapists />} />
      <Route path="/patient/posts" element={<PatientPosts />} />
      <Route path="/patient/anxiety-calmer" element={<PatientAnxietyCalmer />} />
    </Route>
    
    {/* Therapist Routes - Protected */}
    <Route element={<ProtectedRoute allowedRoles={['therapist']} />}>
      <Route path="/therapist" element={<TherapistDashboard />} />
      <Route path="/therapist/profile" element={<TherapistProfile />} />
      <Route path="/therapist/chat" element={<TherapistChat />} />
      <Route path="/therapist/chat/:id" element={<TherapistChat />} />
      <Route path="/therapist/posts" element={<TherapistPosts />} />
      <Route path="/therapist/posts/create" element={<CreatePost />} />
    </Route>
    
    {/* Admin Routes - For now accessible to therapists */}
    <Route element={<ProtectedRoute allowedRoles={['therapist']} />}>
      <Route path="/admin/therapists" element={<ManageTherapists />} />
    </Route>
    
    {/* 404 Route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CosmicBackground />
          <Toaster />
          <Sonner />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
