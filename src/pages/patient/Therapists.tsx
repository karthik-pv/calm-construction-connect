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
import { useTherapists } from "@/hooks/useTherapists";
import { UserProfile } from "@/contexts/AuthContext";

// Common specializations to use as a fallback when none provided
const COMMON_SPECIALIZATIONS = ["Anxiety", "Depression", "Stress", "Trauma", "PTSD", "Work-Life Balance"];

export default function PatientTherapists() {
  const { data: therapistData, isLoading, error } = useTherapists();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  
  // Process the therapist data to handle missing fields and standardize format
  const processTherapistData = (therapists: UserProfile[] | undefined) => {
    if (!therapists || therapists.length === 0) return [];
    
    return therapists.map(therapist => {
      // Parse specialization string to array if it exists, or use default
      let specialties: string[] = [];
      if (therapist.specialization) {
        try {
          // Try to parse if it's stored as JSON string
          specialties = typeof therapist.specialization === 'string' && therapist.specialization.includes(',') 
            ? therapist.specialization.split(',').map(s => s.trim())
            : [therapist.specialization.trim()];
        } catch {
          specialties = [therapist.specialization];
        }
      } else {
        // Assign random specialties as fallback
        specialties = COMMON_SPECIALIZATIONS.slice(0, 2 + Math.floor(Math.random() * 3));
      }
      
      return {
        id: therapist.id,
        name: therapist.full_name || 'Anonymous Therapist',
        profilePic: therapist.avatar_url || '', 
        specialties,
        experience: therapist.experience_years || 0,
        bio: 'Professional therapist specialized in mental health support for construction workers.',
        status: therapist.status || 'active'
      };
    });
  };
  
  const therapists = processTherapistData(therapistData);
  
  // Get unique specialties for filter
  const allSpecialties = Array.from(
    new Set(
      therapists.flatMap(therapist => therapist.specialties)
    )
  ).sort();
  
  // Filter therapists based on search and filters
  const filteredTherapists = therapists.filter(therapist => {
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = therapist.name.toLowerCase().includes(searchLower);
      const specialtiesMatch = therapist.specialties.some(s => 
        s.toLowerCase().includes(searchLower)
      );
      const bioMatch = therapist.bio.toLowerCase().includes(searchLower);
      
      if (!(nameMatch || specialtiesMatch || bioMatch)) {
        return false;
      }
    }
    
    // Filter by specialty
    if (selectedSpecialty && !therapist.specialties.includes(selectedSpecialty)) {
      return false;
    }
    
    // Filter by tab
    if (activeTab === "available" && therapist.status !== 'active') {
      return false;
    }
    
    return true;
  });
  
  const handleContactTherapist = (therapistId: string) => {
    // In a real app, this would initiate a chat or consultation request
    toast.success("Request sent! The therapist will respond shortly.");
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
          <p className="text-foreground">Loading therapists...</p>
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
            <p className="text-destructive">Failed to load therapists. Please try again later.</p>
          </div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Show empty state if no therapists found
  if (therapists.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <PageTitle title="Find a Therapist" subtitle="Connect with mental health professionals specializing in construction worker well-being" />
          <div className="flex flex-col items-center justify-center p-8 bg-black/30 rounded-lg">
            <p className="mb-4 text-muted-foreground">No therapists are currently available.</p>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <PageTitle title="Find a Therapist" subtitle="Connect with mental health professionals specializing in construction worker well-being" />
        
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by name, specialty, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-md bg-black/30"
          />
          
          <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All Therapists</TabsTrigger>
              <TabsTrigger value="available">Available Now</TabsTrigger>
            </TabsList>
          </Tabs>
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
          {filteredTherapists.length > 0 ? (
            filteredTherapists.map(therapist => (
              <motion.div key={therapist.id} variants={item}>
                <Card className="h-full flex flex-col bg-black/40 border-border backdrop-blur-md hover:border-primary/30 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={therapist.profilePic} />
                        <AvatarFallback>{therapist.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{therapist.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Mental Health Professional</p>
                        {therapist.experience > 0 && (
                          <p className="text-sm">{therapist.experience} years experience</p>
                        )}
                        <p className="text-xs text-primary">
                          {therapist.status === 'active' ? 'Available now' : 'Currently unavailable'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-1">
                        {therapist.specialties.map(specialty => (
                          <Badge key={specialty} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      
                      <p className="text-sm">{therapist.bio}</p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex gap-2 pt-3">
                    <Link to={`/patient/chat/${therapist.id}`} className="flex-1">
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
              <p className="text-muted-foreground">No therapists found matching your filters.</p>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
