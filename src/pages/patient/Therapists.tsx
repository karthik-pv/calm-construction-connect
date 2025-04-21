import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MessageCircle, Star, Info } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useExperts } from "@/hooks/useExperts";
import { UserProfile } from "@/contexts/AuthContext";

// Common specializations to use as a fallback when none provided
const COMMON_SPECIALIZATIONS = ["Anxiety", "Depression", "Stress", "Trauma", "PTSD", "Work-Life Balance"];

export default function PatientTherapists() {
  const { data: expertsData, isLoading, error } = useExperts();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedExpertType, setSelectedExpertType] = useState<string | null>(null);
  
  // Process the expert data to handle missing fields and standardize format
  const processExpertsData = (experts: UserProfile[] | undefined) => {
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
      
      return {
        id: expert.id,
        name: expert.full_name || 'Anonymous Expert',
        profilePic: expert.avatar_url || '', 
        specialties,
        experience: expert.experience_years || 0,
        bio: `Professional ${expert.user_role.replace('_', ' ')} specialized in worker support.`,
        status: expert.status || 'active',
        expertType: expert.user_role
      };
    });
  };
  
  const experts = processExpertsData(expertsData);
  
  // Get unique specialties for filter
  const allSpecialties = Array.from(
    new Set(
      experts.flatMap(expert => expert.specialties)
    )
  ).sort();
  
  // Get unique expert types for filter
  const expertTypes = Array.from(
    new Set(
      experts.map(expert => expert.expertType)
    )
  ).sort();
  
  // Expert type display names
  const expertTypeDisplayNames: {[key: string]: string} = {
    'therapist': 'Therapist',
    'relationship_expert': 'Relationship Expert',
    'financial_expert': 'Financial Expert',
    'dating_coach': 'Dating Coach',
    'health_wellness_coach': 'Health & Wellness Coach'
  };
  
  // Filter experts based on search and filters
  const filteredExperts = experts.filter(expert => {
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = expert.name.toLowerCase().includes(searchLower);
      const specialtiesMatch = expert.specialties.some(s => 
        s.toLowerCase().includes(searchLower)
      );
      const bioMatch = expert.bio.toLowerCase().includes(searchLower);
      
      if (!(nameMatch || specialtiesMatch || bioMatch)) {
        return false;
      }
    }
    
    // Filter by specialty
    if (selectedSpecialty && !expert.specialties.includes(selectedSpecialty)) {
      return false;
    }
    
    // Filter by expert type
    if (selectedExpertType && expert.expertType !== selectedExpertType) {
      return false;
    }
    
    // Filter by tab
    if (activeTab === "available" && expert.status !== 'active') {
      return false;
    }
    
    return true;
  });
  
  const handleContactExpert = (expertId: string) => {
    // In a real app, this would initiate a chat or consultation request
    toast.success("Request sent! The expert will respond shortly.");
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center">
          <div className="mindful-loader mb-4"></div>
          <p className="text-foreground">Loading experts...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center">
          <div className="bg-destructive/20 p-4 rounded-lg mb-4 flex items-center">
            <Info className="h-6 w-6 text-destructive mr-2" />
            <p className="text-destructive">Failed to load experts. Please try again later.</p>
          </div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Show empty state if no experts found
  if (experts.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <PageTitle title="Find an Expert" subtitle="Connect with professionals specializing in construction worker well-being" />
          <div className="flex flex-col items-center justify-center p-8 bg-black/30 rounded-lg">
            <p className="mb-4 text-muted-foreground">No experts are currently available.</p>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <PageTitle title="Find an Expert" subtitle="Connect with professionals specializing in construction worker well-being" />
        
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by name, specialty, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-md bg-black/30"
          />
          
          <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All Experts</TabsTrigger>
              <TabsTrigger value="available">Available Now</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            variant={selectedExpertType === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedExpertType(null)}
          >
            All Expert Types
          </Badge>
          {expertTypes.map(expertType => (
            <Badge
              key={expertType}
              variant={selectedExpertType === expertType ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedExpertType(expertType === selectedExpertType ? null : expertType)}
            >
              {expertTypeDisplayNames[expertType] || expertType}
            </Badge>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge
            variant={selectedSpecialty === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedSpecialty(null)}
          >
            All Specialties
          </Badge>
          {allSpecialties.map(specialty => (
            <Badge
              key={specialty}
              variant={selectedSpecialty === specialty ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedSpecialty(specialty === selectedSpecialty ? null : specialty)}
            >
              {specialty}
            </Badge>
          ))}
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredExperts.length > 0 ? (
            filteredExperts.map(expert => (
              <motion.div key={expert.id} variants={item}>
                <Card className="h-full flex flex-col bg-black/40 border-border backdrop-blur-md hover:border-primary/30 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={expert.profilePic} />
                        <AvatarFallback>{expert.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{expert.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {expertTypeDisplayNames[expert.expertType] || 'Professional'}
                        </p>
                        {expert.experience > 0 && (
                          <p className="text-sm">{expert.experience} years experience</p>
                        )}
                        <p className="text-xs text-primary">
                          {expert.status === 'active' ? 'Available now' : 'Currently unavailable'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-1">
                        {expert.specialties.map(specialty => (
                          <Badge key={specialty} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      
                      <p className="text-sm">{expert.bio}</p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex gap-2 pt-3">
                    <Link to={`/patient/chat/${expert.id}`} className="flex-1">
                      <Button variant="default" className="w-full">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center p-8">
              <p className="text-muted-foreground">No experts found matching your filters.</p>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
