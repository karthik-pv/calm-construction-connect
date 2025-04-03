import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/contexts/AuthContext'; // Ensure UserRole is exported

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, profile, loading } = useAuth();

  if (loading) {
    // Optional: Show a loading spinner while checking auth state
    return <div className="flex items-center justify-center h-screen w-screen"><div className="mindful-loader"></div></div>; // Centered loader
  }

  if (!isAuthenticated) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Add a check here in case profile is still loading after !loading
  if (!profile) {
     // Can happen briefly between login and profile fetch
     return <div className="flex items-center justify-center h-screen w-screen"><div className="mindful-loader"></div></div>; // Show loader
  }

  if (!allowedRoles.includes(profile.user_role)) {
    // Logged in, but wrong role, redirect to their dashboard or home
    const homePath = profile.user_role === 'patient' ? '/patient' : '/therapist';
    return <Navigate to={homePath} replace />;
  }

  // Logged in and has the correct role, render the child component or Outlet
  return children ? <>{children}</> : <Outlet />;
}; 