import { useState, useEffect } from "react";
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
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PatientProfile() {
  const { profile } = useAuth();
  const { loading, avatarPreview, handleAvatarChange, updateUserProfile, updatePassword } = useProfile();
  
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    company_name: "",
    bio: "",
    emergency_contact: "",
    emergency_phone: "",
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    app_notifications: true,
    weekly_report: true,
    therapist_messages: true,
    resource_updates: false,
  });
  
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  
  // Initialize profile data from context
  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone_number: profile.phone_number || "",
        company_name: profile.company_name || "",
        bio: profile.bio || "",
        emergency_contact: profile.emergency_contact || "",
        emergency_phone: profile.emergency_phone || "",
      });
    }
  }, [profile]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotificationChange = (name: string, checked: boolean) => {
    setNotifications(prev => ({ ...prev, [name]: checked }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await updateUserProfile({
      full_name: profileData.full_name,
      phone_number: profileData.phone_number,
      company_name: profileData.company_name,
      bio: profileData.bio,
      emergency_contact: profileData.emergency_contact,
      emergency_phone: profileData.emergency_phone,
    });
    
    if (success) {
      toast.success("Profile updated successfully");
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new !== passwordData.confirm) {
      toast.error("New passwords don't match");
      return;
    }
    
    setPasswordSubmitting(true);
    
    try {
      await updatePassword(passwordData.current, passwordData.new);
      
      // Reset form
      setPasswordData({
        current: "",
        new: "",
        confirm: "",
      });
    } catch (error) {
      // Error is handled in the hook
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
                          <AvatarImage src={avatarPreview || undefined} />
                          <AvatarFallback className="text-4xl">
                            {profileData.full_name.charAt(0)}
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
                          onChange={handleAvatarChange}
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
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            name="full_name"
                            value={profileData.full_name}
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
                          <Label htmlFor="phone_number">Phone Number</Label>
                          <Input
                            id="phone_number"
                            name="phone_number"
                            value={profileData.phone_number}
                            onChange={handleInputChange}
                            placeholder="Your phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company_name">Construction Company</Label>
                          <Input
                            id="company_name"
                            name="company_name"
                            value={profileData.company_name}
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
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Emergency Contact</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="emergency_contact">Contact Name</Label>
                            <Input
                              id="emergency_contact"
                              name="emergency_contact"
                              value={profileData.emergency_contact}
                              onChange={handleInputChange}
                              placeholder="Emergency contact name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="emergency_phone">Contact Phone</Label>
                            <Input
                              id="emergency_phone"
                              name="emergency_phone"
                              value={profileData.emergency_phone}
                              onChange={handleInputChange}
                              placeholder="Emergency contact phone"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                      <Button type="submit" disabled={loading}>
                        {loading ? (
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
            >
              <Card className="bg-black/40 border-border backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Update your password and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            name="current"
                            type={showPassword ? "text" : "password"}
                            value={passwordData.current}
                            onChange={handlePasswordChange}
                            placeholder="Enter your current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            name="new"
                            type={showPassword ? "text" : "password"}
                            value={passwordData.new}
                            onChange={handlePasswordChange}
                            placeholder="Enter your new password"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            name="confirm"
                            type={showPassword ? "text" : "password"}
                            value={passwordData.confirm}
                            onChange={handlePasswordChange}
                            placeholder="Confirm your new password"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={passwordSubmitting || !passwordData.current || !passwordData.new || !passwordData.confirm}
                      >
                        {passwordSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating Password...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </div>
                  </form>
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
                  <div className="space-y-3">
                    <h3 className="font-medium">Contact Methods</h3>
                    <div className="space-y-3">
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
                          onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="sms-notifications">SMS Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive important alerts via text message
                          </p>
                        </div>
                        <Switch
                          id="sms-notifications"
                          checked={notifications.sms}
                          onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="app-notifications">In-App Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Show notifications within the application
                          </p>
                        </div>
                        <Switch
                          id="app-notifications"
                          checked={notifications.app_notifications}
                          onCheckedChange={(checked) => handleNotificationChange('app_notifications', checked)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">Notification Types</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="weekly-report">Weekly Mental Health Report</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive weekly summaries of your mental health progress
                          </p>
                        </div>
                        <Switch
                          id="weekly-report"
                          checked={notifications.weekly_report}
                          onCheckedChange={(checked) => handleNotificationChange('weekly_report', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="therapist-messages">Therapist Messages</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when your therapist sends you a message
                          </p>
                        </div>
                        <Switch
                          id="therapist-messages"
                          checked={notifications.therapist_messages}
                          onCheckedChange={(checked) => handleNotificationChange('therapist_messages', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="resource-updates">Resource Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when new mental health resources are available
                          </p>
                        </div>
                        <Switch
                          id="resource-updates"
                          checked={notifications.resource_updates}
                          onCheckedChange={(checked) => handleNotificationChange('resource_updates', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button type="button">
                    Save Notification Settings
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
