import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'patient' | 'therapist' | 'relationship_expert' | 'financial_expert' | 'dating_coach' | 'health_wellness_coach';

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
  expertise_area?: string[];
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
  isProfileComplete: boolean;
}

// Interface for stored credentials
interface StoredCredentials {
  email: string;
  password: string;
}

const AUTH_STORAGE_KEY = 'calm_construction_auth_creds';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const navigate = useNavigate();

  // Function to securely store credentials
  const storeCredentials = (email: string, password: string) => {
    try {
      const credentials: StoredCredentials = { email, password };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error('Error storing credentials:', error);
    }
  };

  // Function to retrieve stored credentials
  const getStoredCredentials = (): StoredCredentials | null => {
    try {
      const storedData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!storedData) return null;
      return JSON.parse(storedData) as StoredCredentials;
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return null;
    }
  };

  // Function to check if expert profile is complete
  const checkProfileCompleteness = (profile: UserProfile): boolean => {
    // Only check for expert roles
    const expertRoles: UserRole[] = [
      'therapist', 
      'relationship_expert', 
      'financial_expert', 
      'dating_coach', 
      'health_wellness_coach'
    ];
    
    if (!expertRoles.includes(profile.user_role)) {
      return true; // Non-experts are always "complete"
    }
    
    // Required fields for experts
    const requiredFields = [
      'full_name',
      'specialization',
      'experience_years',
    ];
    
    // Check if any required field is missing
    for (const field of requiredFields) {
      if (!profile[field as keyof UserProfile]) {
        return false;
      }
    }
    
    return true;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First check if we have a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // We have a valid session
          console.log('Valid session found');
          setSession(session);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          // No valid session, try to login with stored credentials
          console.log('No valid session, checking for stored credentials');
          const credentials = getStoredCredentials();
          
          if (credentials) {
            console.log('Found stored credentials, attempting automatic login');
            try {
              const { error, data } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password
              });
              
              if (error) {
                console.error('Auto-login error:', error.message);
                // Don't show error toast to user on auto-login failure
                setLoading(false);
              } else if (data.user) {
                console.log('Auto-login successful');
                // Don't show success toast on auto-login
                setSession(data.session);
                setUser(data.user);
                await fetchProfile(data.user.id);
              }
            } catch (error) {
              console.error('Auto-login exception:', error);
              setLoading(false);
            }
          } else {
            console.log('No stored credentials found');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };
  
    // Set a timeout to ensure loading state is reset even if auth fails
  const timeoutId = setTimeout(() => {
    if (loading) {
      console.log('Auth initialization timeout - forcing loading to false');
      setLoading(false);
    }
  }, 5000); // 5 second timeout as a safety measure

  initializeAuth();

  return () => {
    clearTimeout(timeoutId);
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
        const userProfile = data as UserProfile;
        setProfile(userProfile);
        
        // Check if expert profile is complete
        const complete = checkProfileCompleteness(userProfile);
        setIsProfileComplete(complete);
        
        // If expert and profile incomplete, show notification
        const expertRoles: UserRole[] = [
          'therapist', 
          'relationship_expert', 
          'financial_expert', 
          'dating_coach', 
          'health_wellness_coach'
        ];
        
        if (expertRoles.includes(userProfile.user_role) && !complete) {
          toast.warning(
            "Your expert profile is incomplete. Please complete your profile to be visible to patients.", 
            {
              duration: 8000,
              action: {
                label: "Complete Profile",
                onClick: () => navigate('/therapist/profile')
              }
            }
          );
        }
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
        // Store credentials for auto-login on refresh
        storeCredentials(email, password);
        toast.success("Login successful! Redirecting...");
        
        // Fetch user profile to determine where to navigate
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileData) {
          const userProfile = profileData as UserProfile;
          
          // Check if expert profile is complete
          const expertRoles: UserRole[] = [
            'therapist', 
            'relationship_expert', 
            'financial_expert', 
            'dating_coach', 
            'health_wellness_coach'
          ];
          
          const isExpert = expertRoles.includes(userProfile.user_role);
          const isComplete = checkProfileCompleteness(userProfile);
          
          // Set profile completeness state
          setIsProfileComplete(isComplete);
          
          // If expert with incomplete profile, redirect to profile page with notification
          if (isExpert && !isComplete) {
            toast.warning("Please complete your expert profile before proceeding", {
              duration: 8000
            });
            navigate('/therapist/profile');
          } else {
            // Otherwise navigate to normal dashboard
            const dashboardPath = userProfile.user_role === 'patient' ? '/patient' : '/therapist';
            navigate(dashboardPath);
          }
          
          // Then trigger a page refresh after a short delay to ensure navigation completes
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } else {
          // If profile not found, navigate to a default route
          navigate('/patient');
          // Then trigger a page refresh
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
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
      // Remove stored credentials on logout
      localStorage.removeItem(AUTH_STORAGE_KEY);
      
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
        const updatedProfile = { ...profile, ...profileUpdate } as UserProfile;
        setProfile(updatedProfile);
        
        // Check if profile is now complete
        const complete = checkProfileCompleteness(updatedProfile);
        setIsProfileComplete(complete);
        
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
        isProfileComplete,
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
