
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
import { Calendar, MessageCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Demo therapist data
const demoTherapists = [
  {
    id: "1",
    name: "Dr. Sarah Thompson",
    profilePic: "https://i.pravatar.cc/150?img=5",
    title: "Clinical Psychologist",
    experience: 12,
    specialties: ["Anxiety", "Depression", "Workplace Stress"],
    rating: 4.8,
    reviewCount: 124,
    availability: "Available this week",
    bio: "Specializing in workplace mental health with particular focus on high-stress industries like construction. My approach combines cognitive-behavioral techniques with practical stress management strategies.",
    background: ["Ph.D. in Clinical Psychology", "Licensed in UK", "Construction Industry Mental Health Specialist"]
  },
  {
    id: "2",
    name: "Dr. Michael Reynolds",
    profilePic: "https://i.pravatar.cc/150?img=12",
    title: "Mental Health Counselor",
    experience: 8,
    specialties: ["PTSD", "Depression", "Anxiety"],
    rating: 4.5,
    reviewCount: 97,
    availability: "Next available: Monday",
    bio: "I work with construction professionals dealing with stress, anxiety, and traumatic experiences from the workplace. My practice focuses on building resilience and practical coping strategies.",
    background: ["Masters in Counseling", "Certified Trauma Specialist", "Former Construction Worker"]
  },
  {
    id: "3",
    name: "Dr. Emily Chen",
    profilePic: "https://i.pravatar.cc/150?img=9",
    title: "Trauma Specialist",
    experience: 15,
    specialties: ["Trauma", "PTSD", "Anxiety", "Stress Management"],
    rating: 4.9,
    reviewCount: 156,
    availability: "Available this week",
    bio: "With 15 years of experience in trauma-informed care, I help construction workers process and heal from workplace incidents and chronic stress. My approach is practical and solutions-focused.",
    background: ["Ph.D. in Psychology", "Certified in EMDR Therapy", "Workplace Trauma Specialist"]
  },
  {
    id: "4",
    name: "Dr. James Wilson",
    profilePic: "https://i.pravatar.cc/150?img=17",
    title: "Occupational Psychologist",
    experience: 10,
    specialties: ["Work-Life Balance", "Burnout", "Stress Management"],
    rating: 4.7,
    reviewCount: 85,
    availability: "Limited availability",
    bio: "As an occupational psychologist, I focus on the intersection of work and wellbeing. I help construction workers manage workplace stressors and develop sustainable work practices.",
    background: ["Doctorate in Occupational Psychology", "Certified in CBT", "Construction Industry Consultant"]
  },
  {
    id: "5",
    name: "Dr. Olivia Martinez",
    profilePic: "https://i.pravatar.cc/150?img=34",
    title: "Clinical Psychologist",
    experience: 7,
    specialties: ["Anxiety", "Depression", "Sleep Problems"],
    rating: 4.6,
    reviewCount: 64,
    availability: "Available next week",
    bio: "I specialize in helping construction workers manage anxiety, depression, and sleep issues related to shift work and high-pressure environments. My approach combines evidence-based techniques with practical solutions.",
    background: ["Ph.D. in Clinical Psychology", "Sleep Specialist", "Research in Workplace Mental Health"]
  }
];

export default function PatientTherapists() {
  const [therapists, setTherapists] = useState(demoTherapists);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  
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
      const titleMatch = therapist.title.toLowerCase().includes(searchLower);
      const specialtiesMatch = therapist.specialties.some(s => 
        s.toLowerCase().includes(searchLower)
      );
      const bioMatch = therapist.bio.toLowerCase().includes(searchLower);
      
      if (!(nameMatch || titleMatch || specialtiesMatch || bioMatch)) {
        return false;
      }
    }
    
    // Filter by specialty
    if (selectedSpecialty && !therapist.specialties.includes(selectedSpecialty)) {
      return false;
    }
    
    // Filter by tab
    if (activeTab === "available" && !therapist.availability.includes("Available")) {
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
                        <p className="text-sm text-muted-foreground">{therapist.title}</p>
                        <div className="flex items-center text-sm">
                          <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
                          <span>{therapist.rating}</span>
                          <span className="text-muted-foreground ml-1">({therapist.reviewCount} reviews)</span>
                        </div>
                        <p className="text-xs text-primary">{therapist.availability}</p>
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
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Experience & Credentials:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {therapist.background.map((item, i) => (
                            <li key={i} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex gap-2 pt-3">
                    <Link to={`/patient/chat/${therapist.id}`} className="flex-1">
                      <Button variant="default" className="w-full">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </Link>
                    <Button variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 border border-dashed border-muted rounded-lg">
              <h3 className="text-xl font-medium mb-2">No therapists found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
