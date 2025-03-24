
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export type UserRole = 'patient' | 'therapist';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  profilePic?: string;
  companyName?: string;
  phoneNumber?: string;
  experience?: number;
  expertise?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (userData: Partial<User>, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const demoUsers = [
  {
    id: '1',
    email: 'patient@example.com',
    password: 'password',
    role: 'patient',
    name: 'John Builder',
    profilePic: 'https://i.pravatar.cc/150?img=1',
    companyName: 'BuildWell Construction',
    phoneNumber: '+44 7123 456789',
  },
  {
    id: '2',
    email: 'therapist@example.com',
    password: 'password',
    role: 'therapist',
    name: 'Dr. Sarah Thompson',
    profilePic: 'https://i.pravatar.cc/150?img=5',
    companyName: 'Mind Wellness Clinic',
    phoneNumber: '+44 7987 654321',
    experience: 12,
    expertise: ['Anxiety', 'Depression', 'Work Stress'],
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Find user in our demo data
      const foundUser = demoUsers.find(
        u => u.email === email && u.password === password && u.role === role
      );
      
      if (foundUser) {
        // Create a copy without the password before storing
        const { password, ...userWithoutPassword } = foundUser;
        
        setUser(userWithoutPassword as User);
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
        
        toast.success(`Welcome back, ${userWithoutPassword.name}!`);
        navigate(`/${role}`);
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Partial<User>, password: string, role: UserRole) => {
    setLoading(true);
    
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Check if email is already in use
      if (demoUsers.some(u => u.email === userData.email)) {
        toast.error('Email already in use');
        setLoading(false);
        return;
      }
      
      // Create a new user with a generated ID
      const newUser = {
        id: `user_${Date.now()}`,
        role,
        ...userData,
      } as User;
      
      // In a real app, you would send this to your API
      // For demo, we'll just set the user immediately
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      toast.success('Registration successful!');
      navigate(`/${role}`);
    } catch (error) {
      toast.error('Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const updateProfile = async (data: Partial<User>) => {
    setLoading(true);
    
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
      console.error('Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
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
