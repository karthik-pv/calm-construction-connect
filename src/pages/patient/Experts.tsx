import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { UserProfile, UserRole } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Search,
  Filter,
  Briefcase,
  Heart,
  DollarSign,
  Coffee,
  Activity,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTherapistAvailability } from "@/hooks/useTherapistAvailability";

// Extend the UserProfile type to include the properties we're using
interface ExtendedUserProfile extends UserProfile {
  title?: string;
  education?: string;
  certifications?: string;
  languages?: string;
}

// Expert type display names
const EXPERT_TYPES: Record<string, string> = {
  therapist: "Therapist",
  relationship_expert: "Relationship Expert",
  financial_expert: "Financial Expert",
  dating_coach: "Dating Coach",
  health_wellness_coach: "Health & Wellness Coach",
};

// Icons for each expert type
const EXPERT_ICONS: Record<string, React.ReactNode> = {
  therapist: <Briefcase className="h-5 w-5" />,
  relationship_expert: <Heart className="h-5 w-5" />,
  financial_expert: <DollarSign className="h-5 w-5" />,
  dating_coach: <Coffee className="h-5 w-5" />,
  health_wellness_coach: <Activity className="h-5 w-5" />,
};

// Common specializations to use as a fallback when none provided
const COMMON_SPECIALIZATIONS = [
  "Anxiety",
  "Depression",
  "Stress",
  "Trauma",
  "PTSD",
  "Work-Life Balance",
];

// Helper function to clean specialization string
const cleanSpecializationText = (text: string): string => {
  return text.replace(/["\[\]]/g, "").trim();
};

export default function PatientExperts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Update the type to use ExtendedUserProfile
  const { data, isLoading, error } = useQuery<ExtendedUserProfile[], Error>({
    queryKey: ["experts-direct"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            `
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
          `
          )
          .eq("status", "active")
          .in("user_role", [
            "therapist",
            "relationship_expert",
            "financial_expert",
            "dating_coach",
            "health_wellness_coach",
          ]);

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Error in direct query:", err);
        throw err;
      }
    },
  });

  // Process expert data to standardize format
  const processExpertData = (experts: ExtendedUserProfile[] | undefined) => {
    if (!experts || experts.length === 0) return [];

    return experts.map((expert) => {
      // Parse specialization string to array if it exists, or use default
      let specialties: string[] = [];
      if (expert.specialization) {
        try {
          // Try to parse if it's stored as JSON string
          if (typeof expert.specialization === "string") {
            if (
              expert.specialization.startsWith("[") &&
              expert.specialization.endsWith("]")
            ) {
              // Handle JSON array format
              try {
                const parsed = JSON.parse(expert.specialization);
                if (Array.isArray(parsed)) {
                  specialties = parsed.map((item) =>
                    typeof item === "string"
                      ? cleanSpecializationText(item)
                      : String(item)
                  );
                } else {
                  specialties = [
                    cleanSpecializationText(expert.specialization),
                  ];
                }
              } catch {
                // If JSON parsing fails, treat as a string to be cleaned
                specialties = [cleanSpecializationText(expert.specialization)];
              }
            } else if (expert.specialization.includes(",")) {
              // Handle comma-separated format
              specialties = expert.specialization
                .split(",")
                .map((s) => cleanSpecializationText(s));
            } else {
              // Handle single string
              specialties = [cleanSpecializationText(expert.specialization)];
            }
          } else if (Array.isArray(expert.specialization)) {
            // Already an array
            specialties = (expert.specialization as string[]).map((item) =>
              typeof item === "string"
                ? cleanSpecializationText(item)
                : String(item)
            );
          } else {
            // Unknown format, use as is
            specialties = [String(expert.specialization).trim()];
          }
        } catch {
          // If parsing fails, use as single string
          specialties = [String(expert.specialization).trim()];
        }
      } else {
        // Assign random specialties as fallback
        specialties = COMMON_SPECIALIZATIONS.slice(
          0,
          2 + Math.floor(Math.random() * 3)
        );
      }

      // Get the appropriate title based on user_role
      const expertTitle =
        EXPERT_TYPES[expert.user_role] || "Professional Expert";

      // Clean education and languages fields
      let education = expert.education;
      if (typeof education === "string") {
        education = cleanSpecializationText(education);
      }

      let languages = expert.languages;
      if (typeof languages === "string") {
        languages = cleanSpecializationText(languages);
      }

      let certifications = expert.certifications;
      if (typeof certifications === "string") {
        certifications = cleanSpecializationText(certifications);
      }

      return {
        id: expert.id,
        name: expert.full_name || "Anonymous Expert",
        profilePic: expert.avatar_url || "",
        specialties,
        experience: expert.experience_years || 0,
        bio: `Professional ${expertTitle.toLowerCase()} specialized in supporting construction workers.`,
        status: expert.status || "active",
        expertType: expert.user_role,
        title: expert.title,
        education,
        certifications,
        languages,
      };
    });
  };

  const experts = processExpertData(data);

  // Filter experts based on search and role
  const filteredExperts = experts.filter((expert) => {
    // Filter by role if selected
    if (selectedRole && expert.expertType !== selectedRole) {
      return false;
    }

    // Filter by search term
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      expert.name.toLowerCase().includes(searchLower) ||
      expert.specialties.some((s) => s.toLowerCase().includes(searchLower)) ||
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
              onClick={() =>
                setSelectedRole(role === selectedRole ? null : role)
              }
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
              <div className="flex flex-col gap-6">
                {filteredExperts.map((expert) => (
                  <Card
                    key={expert.id}
                    className="overflow-hidden bg-black/50 border-border hover:border-primary/30 transition-all duration-300 backdrop-blur-md w-full"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={expert.profilePic} />
                            <AvatarFallback className="bg-primary/20">
                              {expert.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base font-medium">
                              {expert.name}
                            </CardTitle>
                            <div className="flex items-center text-xs text-muted-foreground">
                              {EXPERT_ICONS[expert.expertType]}
                              <span className="ml-1">
                                {EXPERT_TYPES[expert.expertType]}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            expert.status === "online"
                              ? "secondary"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {expert.status === "online" ? "Online" : "Offline"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-3">
                      <div>
                        <p className="text-xs font-medium mb-1.5">
                          Specializes in:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {expert.specialties.map((specialty, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs bg-black/30"
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {expert.education && (
                        <div>
                          <p className="text-xs font-medium mb-1.5">
                            Education:
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {expert.education}
                          </p>
                        </div>
                      )}
                      {expert.languages && (
                        <div>
                          <p className="text-xs font-medium mb-1.5">
                            Languages:
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {expert.languages}
                          </p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex gap-4 w-full">
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1.5"
                          asChild
                        >
                          <Link to={`/patient/chat/${expert.id}`}>
                            <MessageCircle className="h-4 w-4" />
                            <span>Chat</span>
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          asChild
                        >
                          <Link to={`/patient/book-appointment/${expert.id}`}>
                            <Calendar className="h-4 w-4" />
                            <span>Book Appointment</span>
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
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
