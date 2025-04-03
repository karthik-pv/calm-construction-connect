import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Edit, Plus, Trash2, Check, X, Info } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserProfile, UserRole } from "@/contexts/AuthContext";

// Common specializations for dropdown selection
const COMMON_SPECIALIZATIONS = [
  "Anxiety",
  "Depression",
  "Stress",
  "Trauma",
  "PTSD",
  "Work-Life Balance",
  "Burnout",
  "Grief",
  "Addiction",
  "Relationships"
];

interface TherapistFormData {
  id?: string;
  full_name: string;
  avatar_url: string;
  specialization: string;
  experience_years: number;
  status: string;
  email?: string;
}

// Fetch all therapists (or specific ones in filtered mode)
const fetchAllTherapists = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_role', 'therapist');

  if (error) {
    console.error("Error fetching therapists:", error);
    toast.error("Failed to load therapists.");
    throw new Error(error.message);
  }
  
  return data || [];
};

export default function ManageTherapists() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TherapistFormData>({
    full_name: "",
    avatar_url: "",
    specialization: "",
    experience_years: 0,
    status: "active",
  });
  
  const queryClient = useQueryClient();
  
  // Query to fetch all therapists
  const { data: therapists, isLoading, error } = useQuery({
    queryKey: ['admin-therapists'],
    queryFn: fetchAllTherapists,
  });
  
  // Mutation to update therapist data
  const updateTherapist = useMutation({
    mutationFn: async (therapistData: TherapistFormData) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: therapistData.full_name,
          avatar_url: therapistData.avatar_url,
          specialization: therapistData.specialization,
          experience_years: therapistData.experience_years,
          status: therapistData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', therapistData.id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-therapists'] });
      queryClient.invalidateQueries({ queryKey: ['therapists'] });
      toast.success("Therapist updated successfully");
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("Failed to update therapist");
    }
  });
  
  // Mutation to add a new therapist (in a real app, this would create both auth and profile records)
  const addTherapist = useMutation({
    mutationFn: async (therapistData: TherapistFormData) => {
      // First create a mock user (in a production app, you'd create a real auth user)
      const mockUserId = `temp-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: mockUserId,
            full_name: therapistData.full_name,
            avatar_url: therapistData.avatar_url,
            specialization: therapistData.specialization,
            experience_years: therapistData.experience_years,
            user_role: 'therapist' as UserRole,
            status: therapistData.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-therapists'] });
      queryClient.invalidateQueries({ queryKey: ['therapists'] });
      toast.success("Therapist added successfully");
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error("Add error:", error);
      toast.error("Failed to add therapist");
    }
  });
  
  // Mutation to toggle therapist status (active/inactive)
  const toggleTherapistStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const newStatus = status === 'active' ? 'inactive' : 'active';
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-therapists'] });
      queryClient.invalidateQueries({ queryKey: ['therapists'] });
      toast.success("Therapist status updated");
    },
    onError: (error) => {
      console.error("Status update error:", error);
      toast.error("Failed to update therapist status");
    }
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle number input changes with validation
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10) || 0;
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };
  
  // Handle select input changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Open edit dialog with therapist data
  const handleEditTherapist = (therapist: UserProfile) => {
    setFormData({
      id: therapist.id,
      full_name: therapist.full_name || "",
      avatar_url: therapist.avatar_url || "",
      specialization: therapist.specialization || "",
      experience_years: therapist.experience_years || 0,
      status: therapist.status || "active",
    });
    setIsEditDialogOpen(true);
  };
  
  // Reset form to default values
  const resetForm = () => {
    setFormData({
      full_name: "",
      avatar_url: "",
      specialization: "",
      experience_years: 0,
      status: "active",
    });
  };
  
  // Handle form submission for editing
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTherapist.mutate(formData);
  };
  
  // Handle form submission for adding
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTherapist.mutate(formData);
  };
  
  // Filter therapists based on search and tab
  const filteredTherapists = therapists?.filter(therapist => {
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = (therapist.full_name || "").toLowerCase().includes(searchLower);
      const specializationMatch = (therapist.specialization || "").toLowerCase().includes(searchLower);
      
      if (!(nameMatch || specializationMatch)) {
        return false;
      }
    }
    
    // Filter by tab
    if (activeTab === "active" && therapist.status !== "active") {
      return false;
    }
    if (activeTab === "inactive" && therapist.status !== "inactive") {
      return false;
    }
    
    return true;
  }) || [];
  
  // Animation variants
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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <PageTitle 
            title="Manage Therapists" 
            subtitle="Add, edit, and manage therapist profiles" 
          />
          
          <Button 
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Therapist
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search therapists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-md bg-black/30"
          />
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All Therapists</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
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
                  <CardHeader className="pb-3 relative">
                    <div className="absolute right-4 top-4">
                      <Badge variant={therapist.status === 'active' ? "default" : "outline"}>
                        {therapist.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={therapist.avatar_url || ""} />
                        <AvatarFallback>{therapist.full_name?.charAt(0) || "T"}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{therapist.full_name || "Unnamed Therapist"}</CardTitle>
                        <p className="text-sm text-muted-foreground">Mental Health Professional</p>
                        {therapist.experience_years && (
                          <p className="text-sm">{therapist.experience_years} years experience</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-1">
                        {therapist.specialization?.split(',').map((specialty, index) => (
                          <Badge key={index} variant="secondary">
                            {specialty.trim()}
                          </Badge>
                        ))}
                      </div>
                      
                      <p className="text-sm font-medium">Experience: {therapist.experience_years || 0} years</p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex gap-2 pt-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEditTherapist(therapist)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant={therapist.status === 'active' ? "destructive" : "default"}
                      className="flex-1"
                      onClick={() => toggleTherapistStatus.mutate({ 
                        id: therapist.id,
                        status: therapist.status || 'active'
                      })}
                    >
                      {therapist.status === 'active' ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
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
      
      {/* Edit Therapist Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Therapist Profile</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Dr. Jane Smith"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleInputChange}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specialization">Specializations (comma separated)</Label>
              <Input
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="Anxiety, Depression, PTSD"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experience_years">Years of Experience</Label>
              <Input
                id="experience_years"
                name="experience_years"
                type="number"
                min="0"
                max="50"
                value={formData.experience_years}
                onChange={handleNumberChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTherapist.isPending}>
                {updateTherapist.isPending && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Therapist Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Therapist</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add_full_name">Full Name</Label>
              <Input
                id="add_full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Dr. Jane Smith"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add_avatar_url">Avatar URL</Label>
              <Input
                id="add_avatar_url"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleInputChange}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add_specialization">Specializations (comma separated)</Label>
              <Input
                id="add_specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="Anxiety, Depression, PTSD"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add_experience_years">Years of Experience</Label>
              <Input
                id="add_experience_years"
                name="experience_years"
                type="number"
                min="0"
                max="50"
                value={formData.experience_years}
                onChange={handleNumberChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add_status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger id="add_status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addTherapist.isPending}>
                {addTherapist.isPending && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                )}
                Add Therapist
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 