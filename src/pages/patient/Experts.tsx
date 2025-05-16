import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { UserProfile, UserRole } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Search, Filter, Briefcase, Heart, DollarSign, Coffee, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Expert type display names
const EXPERT_TYPES: Record<string, string> = {
  'therapist': 'Therapist',
  'relationship_expert': 'Relationship Expert',
  'financial_expert': 'Financial Expert',
  'dating_coach': 'Dating Coach',
  'health_wellness_coach': 'Health & Wellness Coach'
};

// Icons for each expert type
const EXPERT_ICONS: Record<string, React.ReactNode> = {
  'therapist': <Briefcase className="h-5 w-5" />,
  'relationship_expert': <Heart className="h-5 w-5" />,
  'financial_expert': <DollarSign className="h-5 w-5" />,
  'dating_coach': <Coffee className="h-5 w-5" />,
  'health_wellness_coach': <Activity className="h-5 w-5" />
};

// Common specializations to use as a fallback when none provided
const COMMON_SPECIALIZATIONS = ["Anxiety", "Depression", "Stress", "Trauma", "PTSD", "Work-Life Balance"];

export default function PatientExperts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  // Use query directly
  const { data, isLoading, error } = useQuery<UserProfile[], Error>({
    queryKey: ['experts-direct'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            avatar_url,
            specialization,
            experience_years,
            status,
            user_role,
            title,
            education,
            certifications,
            languages
          `)
          .eq('status', 'active')
          .in('user_role', [
            'therapist', 
            'relationship_expert', 
            'financial_expert', 
            'dating_coach', 
            'health_wellness_coach'
          ]);
          
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Error in direct query:", err);
        throw err;
      }
    }
  });
  
  // Process expert data to standardize format
  const processExpertData = (experts: UserProfile[] | undefined) => {
    if (!experts || experts.length === 0) return [];
    
    return experts.map(expert => {
      // Parse specialization string to array if it exists, or use default
      let specialties: string[] = [];
      if (expert.specialization) {
        try {
          // Try to parse if it's stored as JSON string
          specialties = typeof expert.specialization === 'string' && expert.specialization.includes(',') 
            ? expert.specialization.split(',').map(s => s.trim())
            : [expert.specialization.trim()];
        } catch {
          specialties = [expert.specialization];
        }
      } else {
        // Assign random specialties as fallback
        specialties = COMMON_SPECIALIZATIONS.slice(0, 2 + Math.floor(Math.random() * 3));
      }
      
      // Get the appropriate title based on user_role
      const expertTitle = EXPERT_TYPES[expert.user_role] || 'Professional Expert';
      
      return {
        id: expert.id,
        name: expert.full_name || 'Anonymous Expert',
        profilePic: expert.avatar_url || '', 
        specialties,
        experience: expert.experience_years || 0,
        bio: `Professional ${expertTitle.toLowerCase()} specialized in supporting construction workers.`,
        status: expert.status || 'active',
        expertType: expert.user_role,
        title: expert.title,
        education: expert.education,
        certifications: expert.certifications,
        languages: expert.languages
      };
    });
  };
  
  const experts = processExpertData(data);
  
  // Filter experts based on search and role
  const filteredExperts = experts.filter(expert => {
    // Filter by role if selected
    if (selectedRole && expert.expertType !== selectedRole) {
      return false;
    }
    
    // Filter by search term
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      expert.name.toLowerCase().includes(searchLower) ||
      expert.specialties.some(s => s.toLowerCase().includes(searchLower)) ||
      expert.bio.toLowerCase().includes(searchLower) ||
      EXPERT_TYPES[expert.expertType]?.toLowerCase().includes(searchLower)
    );
  });
  
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">Find an Expert</h1>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search experts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black/20"
            />
          </div>
        </div>
        
        {/* Role filter section - redesigned as bigger blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 py-5">
          <button
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all duration-200",
              "hover:border-primary hover:bg-primary/5",
              selectedRole === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 bg-black/30 text-muted-foreground"
            )}
            onClick={() => setSelectedRole(null)}
          >
            <Filter className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">All Experts</span>
          </button>
          
          {Object.entries(EXPERT_TYPES).map(([role, label]) => (
            <button
              key={role}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all duration-200",
                "hover:border-primary hover:bg-primary/5",
                selectedRole === role
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 bg-black/30 text-muted-foreground"
              )}
              onClick={() => setSelectedRole(role === selectedRole ? null : role)}
            >
              {EXPERT_ICONS[role] || <Briefcase className="h-6 w-6 mb-2" />}
              <span className="text-sm font-medium text-center">{label}</span>
            </button>
          ))}
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="mindful-loader"></div>
            <p className="ml-3">Loading experts...</p>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-500/20 rounded">
            <p>Error: {error.message}</p>
            <Button onClick={() => window.location.reload()} className="mt-2">
              Retry
            </Button>
          </div>
        )}
        
        {!isLoading && !error && (
          <>
            {filteredExperts.length === 0 ? (
              <div className="text-center p-8 bg-black/20 rounded-lg">
                <p>No experts found matching your criteria.</p>
                {(searchTerm || selectedRole) && (
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedRole(null);
                    }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredExperts.map(expert => (
                  <Card key={expert.id} className="overflow-hidden bg-black/30 border-border backdrop-blur-md hover:border-primary/30 transition-all duration-300">
                    <div className="flex flex-col md:flex-row">
                      {/* Expert Profile Section - Left Side */}
                      <div className="p-6 md:w-1/3 flex flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-border">
                        <div className="mb-4 relative">
                          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-2 border-primary/20">
                            <AvatarImage src={expert.profilePic} />
                            <AvatarFallback className="text-xl">{expert.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 bg-primary text-xs rounded-full px-2 py-1 text-primary-foreground">
                            {expert.status === 'active' ? 'Available Now' : 'Offline'}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-semibold">{expert.name}</h3>
                        <p className="text-primary text-sm font-medium">
                          {EXPERT_TYPES[expert.expertType] || 'Professional Expert'}
                        </p>
                        
                        {expert.experience > 0 && (
                          <p className="mt-2 text-sm">
                            <span className="font-medium">{expert.experience}</span> years of experience
                          </p>
                        )}
                        
                        <div className="mt-4 w-full">
                          <Link to={`/patient/chat/${expert.id}`} className="w-full">
                            <Button className="w-full" variant="default">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Chat with Expert
                            </Button>
                          </Link>
                        </div>
                      </div>
                      
                      {/* Expert Details Section - Right Side */}
                      <div className="p-6 md:w-2/3">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">About</h4>
                          <p className="text-sm">{expert.bio}</p>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Specializations</h4>
                          <div className="flex flex-wrap gap-2">
                            {expert.specialties.map((specialty, idx) => (
                              <span 
                                key={`${expert.id}-${idx}`}
                                className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-border">
                          {/* Only display information that actually exists in the profiles */}
                          <div className="space-y-3">
                            {expert.title && (
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-muted-foreground w-24">Title:</span>
                                <span className="text-sm">{expert.title}</span>
                              </div>
                            )}
                            
                            {expert.education && (
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-muted-foreground w-24">Education:</span>
                                <span className="text-sm">{expert.education}</span>
                              </div>
                            )}
                            
                            {expert.certifications && (
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-muted-foreground w-24">Certifications:</span>
                                <span className="text-sm">{expert.certifications}</span>
                              </div>
                            )}
                            
                            {expert.languages && (
                              <div className="flex items-start">
                                <span className="text-sm font-medium text-muted-foreground w-24">Languages:</span>
                                <span className="text-sm">{expert.languages}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 