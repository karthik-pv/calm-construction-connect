import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/contexts/AuthContext'; // Ensure UserRole is exported
import { toast } from 'sonner';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, profile, loading } = useAuth();
  const location = useLocation();

  // Define expert roles in one place for consistency
  const expertRoles: UserRole[] = [
    'therapist', 
    'relationship_expert', 
    'financial_expert', 
    'dating_coach', 
    'health_wellness_coach'
  ];

  // Log current route and user role for debugging
  useEffect(() => {
    if (profile) {
      console.log(`ProtectedRoute: ${location.pathname} - User role: ${profile.user_role}`);
    }
  }, [location.pathname, profile]);

  if (loading) {
    // Show loading spinner while checking auth state
    return <div className="flex items-center justify-center h-screen w-screen"><div className="mindful-loader"></div></div>;
  }

  if (!isAuthenticated) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Add a check here in case profile is still loading after !loading
  if (!profile) {
    // Can happen briefly between login and profile fetch
    return <div className="flex items-center justify-center h-screen w-screen"><div className="mindful-loader"></div></div>;
  }

  // Check if the user is an expert
  const isExpert = expertRoles.includes(profile.user_role);
  
  // Check if current path is for patients but user is an expert (possible routing error)
  if (isExpert && location.pathname.startsWith('/patient')) {
    toast.error("Experts should use the expert dashboard");
    return <Navigate to="/therapist" replace />;
  }
  
  // Check if current path is for experts but user is a patient (possible routing error)
  if (!isExpert && location.pathname.startsWith('/therapist')) {
    toast.error("Patients should use the patient dashboard");
    return <Navigate to="/patient" replace />;
  }

  // Standard role check
  if (!allowedRoles.includes(profile.user_role)) {
    // Logged in, but wrong role, redirect to appropriate dashboard
    const homePath = isExpert ? '/therapist' : '/patient';
    return <Navigate to={homePath} replace />;
  }

  // Logged in and has the correct role, render the child component or Outlet
  return children ? <>{children}</> : <Outlet />;
}; 