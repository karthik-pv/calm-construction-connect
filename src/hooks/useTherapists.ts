import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import type { UserProfile } from '@/contexts/AuthContext'; // Import the UserProfile type

// Fetch only therapists
const fetchTherapists = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      specialization,
      experience_years,
      status
    `)
    .eq('user_role', 'therapist') // Filter for therapists
    .eq('status', 'active'); // Optionally filter for active therapists only

  if (error) {
    console.error("Error fetching therapists:", error);
    toast.error("Failed to load therapists.");
    throw new Error(error.message);
  }
  return data || [];
};

export function useTherapists() {
  return useQuery<UserProfile[], Error>({
    queryKey: ['therapists'], // Cache key
    queryFn: fetchTherapists,
  });
} 