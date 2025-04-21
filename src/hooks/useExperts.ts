import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import type { UserProfile, UserRole } from '@/contexts/AuthContext';

console.log("useExperts module loading");

// Fetch all types of experts, optionally filtered by type
const fetchExperts = async (expertType?: UserRole): Promise<UserProfile[]> => {
  console.log("fetchExperts called with expertType:", expertType, "type:", typeof expertType);
  
  try {
    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        specialization,
        experience_years,
        status,
        user_role
      `)
      .eq('status', 'active');
      
    // If expert type is specified, filter by that type
    if (expertType) {
      console.log("Filtering by expertType:", expertType);
      query = query.eq('user_role', expertType);
    } else {
      // Otherwise filter for all expert types
      console.log("Filtering for all expert types");
      query = query.in('user_role', [
        'therapist', 
        'relationship_expert', 
        'financial_expert', 
        'dating_coach', 
        'health_wellness_coach'
      ]);
    }
    
    console.log("Executing Supabase query...");
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching experts:", error);
      toast.error("Failed to load experts.");
      throw new Error(error.message);
    }
    
    console.log("Experts data received:", data?.length || 0, "experts found");
    return data || [];
  } catch (err) {
    console.error("Unexpected error in fetchExperts:", err);
    toast.error("An unexpected error occurred while loading experts.");
    throw err;
  }
};

console.log("useExperts hook is being defined");

export function useExperts(expertType?: UserRole) {
  console.log("useExperts hook called with expertType:", expertType, "type:", typeof expertType);
  
  return useQuery<UserProfile[], Error>({
    queryKey: ['experts', expertType], // Include expertType in the query key
    queryFn: () => fetchExperts(expertType),
    // Add proper error handling
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error("useExperts query error:", error);
    }
  });
} 