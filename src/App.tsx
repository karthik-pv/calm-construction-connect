import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useEffect, useState } from "react";
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
import RegisterExpert from "./pages/auth/RegisterExpert";

// Patient Pages
import PatientDashboard from "./pages/patient/Dashboard";
import PatientProfile from "./pages/patient/Profile";
import PatientChat from "./pages/patient/Chat";
import PatientChatbot from "./pages/patient/Chatbot";
import PatientTherapists from "./pages/patient/Therapists";
import PatientPosts from "./pages/patient/Posts";
import PatientAnxietyCalmer from "./pages/patient/AnxietyCalmer";
import PatientExperts from "./pages/patient/Experts";
import PatientAppointments from "./pages/patient/Appointments";
import BookAppointment from "./pages/patient/BookAppointment";

// Expert Pages (formerly Therapist Pages)
import TherapistDashboard from "./pages/therapist/Dashboard";
import TherapistProfile from "./pages/therapist/Profile";
import TherapistChat from "./pages/therapist/Chat";
import TherapistPosts from "./pages/therapist/Posts";
import CreatePost from "./pages/therapist/CreatePost";
import TherapistAppointments from "./pages/therapist/Appointments";
import ManageAvailability from "./pages/therapist/ManageAvailability";

// Admin Pages
import ManageTherapists from "./pages/admin/ManageTherapists";

// Other Pages
import NotFound from "./pages/NotFound";

// Check if TeachersPage is imported correctly
// console.log("TeachersPage imported:", TeachersPage);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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

// Debug component to help diagnose routing issues
const RoleDebugger = () => {
  const { profile, loading } = useAuth();
  const [showing, setShowing] = useState(true);

  // Hide after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowing(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!showing || loading) return null;

  const expertRoles = [
    "therapist",
    "relationship_expert",
    "financial_expert",
    "dating_coach",
    "health_wellness_coach",
  ];

  const isExpert = profile && expertRoles.includes(profile.user_role);

  return (
    <div className="fixed top-0 right-0 m-4 p-3 bg-black/80 text-white text-xs z-50 rounded border border-primary">
      <p>
        <strong>User Role:</strong> {profile?.user_role || "Not logged in"}
      </p>
      <p>
        <strong>Is Expert:</strong> {isExpert ? "Yes" : "No"}
      </p>
      <p>
        <strong>Name:</strong> {profile?.full_name || "Unknown"}
      </p>
      <button
        onClick={() => setShowing(false)}
        className="mt-2 px-2 py-1 bg-primary text-xs rounded"
      >
        Dismiss
      </button>
    </div>
  );
};

// Component to handle redirects for already logged-in users
const AuthRedirector = () => {
  const { isAuthenticated, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="mindful-loader"></div>
      </div>
    );
  }

  if (isAuthenticated && profile) {
    // All expert types should redirect to the therapist dashboard
    const expertRoles = [
      "therapist",
      "relationship_expert",
      "financial_expert",
      "dating_coach",
      "health_wellness_coach",
    ];

    const isExpert = expertRoles.includes(profile.user_role);
    // Make sure all experts go to /therapist
    const homePath = isExpert ? "/therapist" : "/patient";

    return <Navigate to={homePath} replace />;
  }

  // If not loading and not authenticated, allow rendering the auth page (Outlet)
  return <Outlet />;
};

// Force redirect to the correct dashboard based on role
const RoleRouter = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="mindful-loader"></div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  const expertRoles = [
    "therapist",
    "relationship_expert",
    "financial_expert",
    "dating_coach",
    "health_wellness_coach",
  ];

  const isExpert = expertRoles.includes(profile.user_role);
  const homePath = isExpert ? "/therapist" : "/patient";

  return <Navigate to={homePath} replace />;
};

const AppRoutes = () => {
  // useEffect(() => {
  //   console.log("Routes mounted, PatientExperts component:", PatientExperts);
  // }, []);

  return (
    <Routes>
      {/* Force routing to correct dashboard */}
      <Route path="/" element={<RoleRouter />} />

      {/* Auth Routes - Redirect if logged in */}
      <Route element={<AuthRedirector />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/therapist" element={<RegisterTherapist />} />
        <Route path="/register/patient" element={<RegisterPatient />} />
        <Route
          path="/register/relationship_expert"
          element={<RegisterExpert />}
        />
        <Route path="/register/financial_expert" element={<RegisterExpert />} />
        <Route path="/register/dating_coach" element={<RegisterExpert />} />
        <Route
          path="/register/health_wellness_coach"
          element={<RegisterExpert />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Logout Route - Available to authenticated users */}
      <Route path="/logout" element={<Logout />} />

      {/* Patient Routes - Protected */}
      <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/profile" element={<PatientProfile />} />
        <Route path="/patient/chat" element={<PatientChat />} />
        <Route path="/patient/chat/:id" element={<PatientChat />} />
        <Route path="/patient/chatbot" element={<PatientChatbot />} />
        <Route path="/patient/experts" element={<PatientExperts />} />
        <Route
          path="/patient/therapists"
          element={<Navigate to="/patient/experts" replace />}
        />
        <Route path="/patient/posts" element={<PatientPosts />} />
        <Route
          path="/patient/anxiety-calmer"
          element={<PatientAnxietyCalmer />}
        />
        <Route path="/patient/appointments" element={<PatientAppointments />} />
        <Route
          path="/patient/book-appointment/:therapistId"
          element={<BookAppointment />}
        />
      </Route>

      {/* Expert Routes - Protected (for all expert types) */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "therapist",
              "relationship_expert",
              "financial_expert",
              "dating_coach",
              "health_wellness_coach",
            ]}
          />
        }
      >
        <Route path="/therapist" element={<TherapistDashboard />} />
        <Route path="/therapist/profile" element={<TherapistProfile />} />
        <Route path="/therapist/chat" element={<TherapistChat />} />
        <Route path="/therapist/chat/:id" element={<TherapistChat />} />
        <Route path="/therapist/posts" element={<TherapistPosts />} />
        <Route path="/therapist/posts/create" element={<CreatePost />} />
        <Route
          path="/therapist/appointments"
          element={<TherapistAppointments />}
        />
        <Route
          path="/therapist/availability"
          element={<ManageAvailability />}
        />
      </Route>

      {/* Admin Routes - For now accessible to all expert types */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "therapist",
              "relationship_expert",
              "financial_expert",
              "dating_coach",
              "health_wellness_coach",
            ]}
          />
        }
      >
        <Route path="/admin/therapists" element={<ManageTherapists />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <CosmicBackground />
            <Toaster />
            <Sonner />
            <RoleDebugger />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
