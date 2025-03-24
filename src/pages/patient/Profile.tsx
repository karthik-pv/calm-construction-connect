
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
import { Camera, CheckCircle, Eye, EyeOff, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PatientProfile() {
  const { user, updateProfile } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    companyName: user?.companyName || "",
    bio: user?.bio || "",
    jobTitle: "Construction Site Manager",
    jobExperience: "8 years",
    emergencyContact: "",
    emergencyPhone: "",
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    appNotifications: true,
    weeklyReport: true,
    therapistMessages: true,
    resourceUpdates: false,
  });
  
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(user?.profilePic || null);
  
  const [submitting, setSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <PageTitle title="My Profile" subtitle="Manage your account and settings" />
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
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
                        Upload a profile picture to personalize your account
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
                        Recommended: Square image, at least 300x300px
                      </p>
                    </CardContent>
                  </Card>
                  
                  {/* Personal Info Section */}
                  <Card className="bg-black/40 border-border backdrop-blur-md lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details
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
                          <Label htmlFor="companyName">Construction Company</Label>
                          <Input
                            id="companyName"
                            name="companyName"
                            value={profileData.companyName}
                            onChange={handleInputChange}
                            placeholder="Your company name"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">About Me</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={profileData.bio}
                          onChange={handleInputChange}
                          placeholder="A brief description about yourself"
                          rows={4}
                        />
                      </div>
                    </CardContent>
                    
                    <Separator />
                    
                    <CardHeader>
                      <CardTitle>Work Information</CardTitle>
                      <CardDescription>
                        Details about your construction experience
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="jobTitle">Job Title</Label>
                          <Input
                            id="jobTitle"
                            name="jobTitle"
                            value={profileData.jobTitle}
                            onChange={handleInputChange}
                            placeholder="Your position"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="jobExperience">Years of Experience</Label>
                          <Input
                            id="jobExperience"
                            name="jobExperience"
                            value={profileData.jobExperience}
                            onChange={handleInputChange}
                            placeholder="Years in construction"
                          />
                        </div>
                      </div>
                    </CardContent>
                    
                    <Separator />
                    
                    <CardHeader>
                      <CardTitle>Emergency Contact</CardTitle>
                      <CardDescription>
                        Who to contact in case of emergency
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContact">Contact Name</Label>
                          <Input
                            id="emergencyContact"
                            name="emergencyContact"
                            value={profileData.emergencyContact}
                            onChange={handleInputChange}
                            placeholder="Emergency contact name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyPhone">Contact Phone</Label>
                          <Input
                            id="emergencyPhone"
                            name="emergencyPhone"
                            value={profileData.emergencyPhone}
                            onChange={handleInputChange}
                            placeholder="Emergency contact phone"
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
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>
                    Manage your account security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="outline">Set Up</Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Active Sessions</h4>
                        <p className="text-sm text-muted-foreground">
                          Manage devices where you're currently logged in
                        </p>
                      </div>
                      <Button variant="outline">Manage</Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Data Export</h4>
                        <p className="text-sm text-muted-foreground">
                          Download a copy of your personal data
                        </p>
                      </div>
                      <Button variant="outline">Export</Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Delete Account</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete your account and all your data
                      </p>
                      <Button variant="destructive">Delete Account</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-black/40 border-border backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Communication Channels</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose how you'd like to receive notifications
                      </p>
                    </div>
                    
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
                          <Label htmlFor="app-notifications">In-App Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications within the app
                          </p>
                        </div>
                        <Switch
                          id="app-notifications"
                          checked={notifications.appNotifications}
                          onCheckedChange={(checked) => 
                            handleNotificationChange("appNotifications", checked)
                          }
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Notification Types</h3>
                      <p className="text-sm text-muted-foreground">
                        Select which types of notifications you want to receive
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="therapist-messages">Therapist Messages</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when a therapist sends you a message
                          </p>
                        </div>
                        <Switch
                          id="therapist-messages"
                          checked={notifications.therapistMessages}
                          onCheckedChange={(checked) => 
                            handleNotificationChange("therapistMessages", checked)
                          }
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="weekly-report">Weekly Reports</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive weekly summary of your mental wellness progress
                          </p>
                        </div>
                        <Switch
                          id="weekly-report"
                          checked={notifications.weeklyReport}
                          onCheckedChange={(checked) => 
                            handleNotificationChange("weeklyReport", checked)
                          }
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="resource-updates">Resource Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified about new mental health resources and articles
                          </p>
                        </div>
                        <Switch
                          id="resource-updates"
                          checked={notifications.resourceUpdates}
                          onCheckedChange={(checked) => 
                            handleNotificationChange("resourceUpdates", checked)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    onClick={() => {
                      toast.success("Notification preferences updated!");
                    }}
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
