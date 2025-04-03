import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'patient' | 'therapist';

export interface UserProfile {
  id: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  user_role: UserRole;
  specialization?: string;
  experience_years?: number;
  status?: string;
}

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  user: SupabaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string; full_name?: string; }, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      // Page refresh detection
      // Use sessionStorage to determine if this is a page refresh
      const isPageRefresh = sessionStorage.getItem('app_session_active');
      
      if (isPageRefresh) {
        console.log("Page refresh detected - performing automatic logout");
        // Clear any existing auth state
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        
        // Redirect to force-logout page
        window.location.href = '/force-logout.html';
        return; // Stop further execution
      }
      
      // Set flag in sessionStorage to detect refreshes
      sessionStorage.setItem('app_session_active', 'true');
      
      // Normal auth initialization continues below
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth event:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setLoading(true);
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && status !== 406) {
        console.error('Error fetching profile:', error);
        toast.error("Error loading user profile.");
        setProfile(null);
      } else if (data) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      toast.error('An unexpected error occurred while fetching your profile.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Login error:', error.message);
        toast.error(error.message || 'Invalid email or password');
        setLoading(false);
      } else if (data.user) {
        toast.success("Login successful! Redirecting...");
      }
    } catch (error) {
      console.error('Login exception:', error);
      toast.error('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const register = async (userData: { email: string; full_name?: string; }, password: string, role: UserRole) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: password,
        options: {
          data: {
            user_role: role,
            full_name: userData.full_name || '',
          },
        },
      });

      if (error) {
        console.error('Registration error:', error.message);
        toast.error(error.message || 'Registration failed');
      } else if (data.user) {
        toast.success('Registration successful! Please check your email for verification.');
        navigate('/login');
      } else {
        toast.error('Registration failed. No user data returned.');
      }
    } catch (error) {
      console.error('Registration exception:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
        toast.error(error.message || 'Logout failed');
        throw error;
      }
      
      setProfile(null);
      setSession(null);
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout exception:', error);
      toast.error('Logout failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      toast.error("You must be logged in to update your profile.");
      return;
    }
    setLoading(true);
    try {
      // Ensure profile data always includes user_role if it exists in current profile
      const profileUpdate = {
        ...data,
        id: user.id,
        updated_at: new Date().toISOString(),
        // If user_role is not provided in data, use the one from existing profile
        user_role: data.user_role || profile?.user_role,
      };

      // Log the profile update data to help with debugging
      console.log("Updating profile with data:", profileUpdate);

      const { error } = await supabase.from('profiles').upsert(profileUpdate);

      if (error) {
        console.error('Update profile error:', error.message, error.details);
        toast.error(error.message || 'Failed to update profile');
      } else {
        setProfile((prev) => ({ ...prev, ...profileUpdate } as UserProfile));
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Update profile exception:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!session && !!profile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
