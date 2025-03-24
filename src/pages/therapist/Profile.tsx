
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, CheckCircle, Eye, EyeOff, Loader2, Upload, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function TherapistProfile() {
  const { user, updateProfile } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    companyName: user?.companyName || "",
    title: "Clinical Psychologist",
    bio: user?.bio || "Specializing in workplace mental health with particular focus on high-stress industries like construction. My approach combines cognitive-behavioral techniques with practical stress management strategies.",
    experience: user?.experience || 0,
    expertise: user?.expertise || ["Anxiety", "Depression", "Workplace Stress"],
    education: "Ph.D. in Clinical Psychology, University of London",
    certifications: "Licensed Clinical Psychologist, UKCP Registered",
    languages: "English, Spanish",
    appointmentFee: "£90",
    sessionDuration: "50",
  });
  
  const [availability, setAvailability] = useState({
    monday: { available: true, start: "09:00", end: "17:00" },
    tuesday: { available: true, start: "09:00", end: "17:00" },
    wednesday: { available: true, start: "09:00", end: "17:00" },
    thursday: { available: true, start: "09:00", end: "17:00" },
    friday: { available: true, start: "09:00", end: "17:00" },
    saturday: { available: false, start: "10:00", end: "14:00" },
    sunday: { available: false, start: "10:00", end: "14:00" },
  });
  
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    appNotifications: true,
    newPatients: true,
    appointmentReminders: true,
    platformUpdates: false,
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(user?.profilePic || null);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [newExpertise, setNewExpertise] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAvailabilityChange = (
    day: string, 
    field: "available" | "start" | "end", 
    value: boolean | string
  ) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value,
      },
    }));
  };
  
  const handleNotificationChange = (name: string, checked: boolean) => {
    setNotifications(prev => ({ ...prev, [name]: checked }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPassword(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };
  
  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setCertificateFiles(prev => [...prev, ...filesArray]);
    }
  };
  
  const handleRemoveCertificate = (index: number) => {
    setCertificateFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleAddExpertise = () => {
    if (newExpertise.trim() && !profileData.expertise.includes(newExpertise.trim())) {
      setProfileData(prev => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()],
      }));
      setNewExpertise("");
    }
  };
  
  const handleRemoveExpertise = (item: string) => {
    setProfileData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e !== item),
    }));
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // In a real app, you would upload the profile image to storage and get a URL
      const profileData = {
        name: profileData.name,
        phoneNumber: profileData.phoneNumber,
        companyName: profileData.companyName,
        bio: profileData.bio,
        profilePic: profileImagePreview || user?.profilePic,
        experience: profileData.experience,
        expertise: profileData.expertise,
      };
      
      await updateProfile(profileData);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error("Profile update error:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.new !== password.confirm) {
      toast.error("New passwords don't match");
      return;
    }
    
    setPasswordSubmitting(true);
    
    try {
      // Simulate API call to change password
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Password updated successfully");
      
      // Reset form
      setPassword({
        current: "",
        new: "",
        confirm: "",
      });
    } catch (error) {
      toast.error("Failed to update password. Please try again.");
      console.error("Password update error:", error);
    } finally {
      setPasswordSubmitting(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddExpertise();
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <PageTitle title="My Profile" subtitle="Manage your therapist profile and settings" />
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full sm:grid-cols-4 md:w-auto md:inline-flex">
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Avatar Section */}
                  <Card className="bg-black/40 border-border backdrop-blur-md lg:col-span-1">
                    <CardHeader>
                      <CardTitle>Profile Picture</CardTitle>
                      <CardDescription>
                        Upload a professional photo to enhance patient trust
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                      <div className="relative mb-4">
                        <Avatar className="h-32 w-32">
                          <AvatarImage src={profileImagePreview || undefined} />
                          <AvatarFallback className="text-4xl">
                            {profileData.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <label 
                          htmlFor="profile-image"
                          className="absolute bottom-0 right-0 p-1 rounded-full bg-primary hover:bg-primary/80 text-white cursor-pointer"
                        >
                          <Camera className="h-5 w-5" />
                        </label>
                        <input 
                          id="profile-image" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleProfileImageChange}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Recommended: Professional headshot, square format
                      </p>
                    </CardContent>
                  </Card>
                  
                  {/* Personal Info Section */}
                  <Card className="bg-black/40 border-border backdrop-blur-md lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal and professional details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={profileData.name}
                            onChange={handleInputChange}
                            placeholder="Your full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="title">Professional Title</Label>
                          <Input
                            id="title"
                            name="title"
                            value={profileData.title}
                            onChange={handleInputChange}
                            placeholder="e.g. Clinical Psychologist"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleInputChange}
                            placeholder="Your email"
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            value={profileData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="Your phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Practice/Clinic Name</Label>
                          <Input
                            id="companyName"
                            name="companyName"
                            value={profileData.companyName}
                            onChange={handleInputChange}
                            placeholder="Your practice name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="experience">Years of Experience</Label>
                          <Input
                            id="experience"
                            name="experience"
                            type="number"
                            min="0"
                            value={profileData.experience}
                            onChange={handleInputChange}
                            placeholder="Years of practice"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Professional Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={profileData.bio}
                          onChange={handleInputChange}
                          placeholder="Describe your approach and experience"
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          This will be visible to potential patients. Highlight your expertise in construction worker mental health.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Areas of Expertise</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newExpertise}
                            onChange={(e) => setNewExpertise(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Add expertise (e.g. Anxiety)"
                          />
                          <Button 
                            type="button" 
                            onClick={handleAddExpertise}
                            disabled={!newExpertise.trim()}
                          >
                            Add
                          </Button>
                        </div>
                        
                        {profileData.expertise.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {profileData.expertise.map(item => (
                              <Badge key={item} variant="secondary">
                                {item}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExpertise(item)}
                                  className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="appointmentFee">Session Fee</Label>
                          <Input
                            id="appointmentFee"
                            name="appointmentFee"
                            value={profileData.appointmentFee}
                            onChange={handleInputChange}
                            placeholder="e.g. £90"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
                          <Input
                            id="sessionDuration"
                            name="sessionDuration"
                            type="number"
                            min="15"
                            step="5"
                            value={profileData.sessionDuration}
                            onChange={handleInputChange}
                            placeholder="e.g. 50"
                          />
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-end">
                      <Button type="submit" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </form>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="credentials">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-black/40 border-border backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Credentials & Qualifications</CardTitle>
                  <CardDescription>
                    Showcase your professional qualifications to build patient trust
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="education">Education</Label>
                      <Textarea
                        id="education"
                        name="education"
                        value={profileData.education}
                        onChange={handleInputChange}
                        placeholder="List your degrees and educational background"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="certifications">Certifications & Licenses</Label>
                      <Textarea
                        id="certifications"
                        name="certifications"
                        value={profileData.certifications}
                        onChange={handleInputChange}
                        placeholder="List your professional certifications and licenses"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="languages">Languages Spoken</Label>
                      <Input
                        id="languages"
                        name="languages"
                        value={profileData.languages}
                        onChange={handleInputChange}
                        placeholder="e.g. English, Spanish"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Upload Credentials</Label>
                      <div className="flex items-center gap-2">
                        <label 
                          htmlFor="credentials"
                          className="cursor-pointer flex items-center gap-2 border border-border rounded-md px-4 py-2 hover:bg-secondary/20 transition-colors duration-200"
                        >
                          <Upload className="h-5 w-5" />
                          <span>Upload Files</span>
                        </label>
                        <input 
                          id="credentials" 
                          type="file" 
                          multiple 
                          accept=".pdf,.jpg,.jpeg,.png" 
                          onChange={handleCertificateUpload}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload licenses, certifications, or qualifications (PDF, JPG, PNG)
                      </p>
                      
                      {certificateFiles.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <Label>Uploaded Files</Label>
                          <div className="space-y-2">
                            {certificateFiles.map((file, index) => (
                              <div 
                                key={index} 
                                className="flex items-center justify-between p-2 border border-border rounded-md bg-black/20"
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                  <span className="text-sm truncate max-w-[200px]">
                                    {file.name}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveCertificate(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    onClick={() => toast.success("Credentials updated successfully")}
                  >
                    Save Credentials
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="availability">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-black/40 border-border backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Availability Schedule</CardTitle>
                  <CardDescription>
                    Set your working hours for patient appointments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(availability).map(([day, { available, start, end }]) => (
                      <div key={day} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${day}-available`} className="capitalize">
                            {day}
                          </Label>
                          <Switch
                            id={`${day}-available`}
                            checked={available}
                            onCheckedChange={(checked) => 
                              handleAvailabilityChange(day, "available", checked)
                            }
                          />
                        </div>
                        
                        {available && (
                          <div className="grid grid-cols-2 gap-4 pl-0 sm:pl-8">
                            <div className="space-y-2">
                              <Label htmlFor={`${day}-start`}>Start Time</Label>
                              <Input
                                id={`${day}-start`}
                                type="time"
                                value={start}
                                onChange={(e) => 
                                  handleAvailabilityChange(day, "start", e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`${day}-end`}>End Time</Label>
                              <Input
                                id={`${day}-end`}
                                type="time"
                                value={end}
                                onChange={(e) => 
                                  handleAvailabilityChange(day, "end", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        )}
                        
                        {day !== "sunday" && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    onClick={() => toast.success("Availability updated successfully")}
                  >
                    Save Availability
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <Card className="bg-black/40 border-border backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current"
                          name="current"
                          type={showPassword ? "text" : "password"}
                          value={password.current}
                          onChange={handlePasswordChange}
                          placeholder="Your current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new"
                          name="new"
                          type={showPassword ? "text" : "password"}
                          value={password.new}
                          onChange={handlePasswordChange}
                          placeholder="New password"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm"
                          name="confirm"
                          type={showPassword ? "text" : "password"}
                          value={password.confirm}
                          onChange={handlePasswordChange}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <Button 
                        type="submit" 
                        disabled={passwordSubmitting || !password.current || !password.new || !password.confirm}
                      >
                        {passwordSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              <Card className="bg-black/40 border-border backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notifications.email}
                        onCheckedChange={(checked) => 
                          handleNotificationChange("email", checked)
                        }
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via text message
                        </p>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={notifications.sms}
                        onCheckedChange={(checked) => 
                          handleNotificationChange("sms", checked)
                        }
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="new-patients">New Patient Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when new patients request appointments
                        </p>
                      </div>
                      <Switch
                        id="new-patients"
                        checked={notifications.newPatients}
                        onCheckedChange={(checked) => 
                          handleNotificationChange("newPatients", checked)
                        }
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="appointment-reminders">Appointment Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive reminders about upcoming appointments
                        </p>
                      </div>
                      <Switch
                        id="appointment-reminders"
                        checked={notifications.appointmentReminders}
                        onCheckedChange={(checked) => 
                          handleNotificationChange("appointmentReminders", checked)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    onClick={() => toast.success("Notification preferences updated!")}
                  >
                    Save Preferences
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
