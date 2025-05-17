import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import {
  useManageAvailability,
  DAYS_OF_WEEK,
} from "@/hooks/useTherapistAvailability";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/contexts/AuthContext";

// Add a mapping of user roles to default professional titles
const DEFAULT_TITLES = {
  therapist: "Clinical Psychologist",
  relationship_expert: "Relationship Counselor",
  financial_expert: "Financial Advisor",
  dating_coach: "Dating Coach",
  health_wellness_coach: "Health & Wellness Specialist",
};

// Add a mapping of expert roles to display names
const EXPERT_ROLES: Record<string, string> = {
  therapist: "Therapist",
  relationship_expert: "Relationship Expert",
  financial_expert: "Financial Expert",
  dating_coach: "Dating Coach",
  health_wellness_coach: "Health & Wellness Coach",
};

export default function TherapistProfile() {
  const { profile, updateProfile } = useAuth();
  const {
    loading,
    avatarPreview,
    handleAvatarChange,
    updateUserProfile,
    updatePassword,
  } = useProfile();
  const {
    availability: dbAvailability,
    isLoading: availabilityLoading,
    updateDayAvailability,
  } = useManageAvailability();

  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    company_name: "",
    title: "Clinical Psychologist",
    bio: "",
    experience_years: 0,
    specialization: "",
    expertise: [] as string[],
    education: "",
    certifications: "",
    languages: "",
    appointment_fee: "",
    session_duration: "50",
    user_role: "therapist" as UserRole,
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

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    app_notifications: true,
    new_patients: true,
    appointment_reminders: true,
    platform_updates: false,
  });

  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [newExpertise, setNewExpertise] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Map day names to day of week values
  const dayToNumberMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  // Initialize profile data from context
  useEffect(() => {
    if (profile) {
      // Parse expertise from specialization if it's a JSON string
      let expertiseArray: string[] = [];
      try {
        if (profile.specialization && profile.specialization.startsWith("[")) {
          expertiseArray = JSON.parse(profile.specialization);
        } else if (profile.specialization) {
          expertiseArray = [profile.specialization];
        }
      } catch (error) {
        console.error("Error parsing specialization:", error);
        if (profile.specialization) {
          expertiseArray = [profile.specialization];
        }
      }

      // Get the appropriate default title based on user role
      const defaultTitle = profile.user_role
        ? DEFAULT_TITLES[profile.user_role] || "Professional Expert"
        : "Professional Expert";

      setProfileData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone_number: profile.phone_number || "",
        company_name: profile.company_name || "",
        title: profile.title || defaultTitle,
        bio: profile.bio || "",
        experience_years: profile.experience_years || 0,
        specialization: profile.specialization || "",
        expertise: expertiseArray,
        education: profile.education || "",
        certifications: profile.certifications || "",
        languages: profile.languages || "",
        appointment_fee: profile.appointment_fee || "",
        session_duration: profile.session_duration || "50",
        user_role: profile.user_role || "therapist",
      });
    }
  }, [profile]);

  // Load availability from database
  useEffect(() => {
    if (dbAvailability && dbAvailability.length > 0) {
      const availabilityByDay = {};

      // Initialize with default values
      Object.keys(availability).forEach((day) => {
        availabilityByDay[day] = { ...availability[day] };
      });

      // Update with values from database
      dbAvailability.forEach((slot) => {
        const dayName = Object.keys(dayToNumberMap).find(
          (key) => dayToNumberMap[key] === slot.day_of_week
        );

        if (dayName) {
          availabilityByDay[dayName] = {
            available: slot.is_available,
            start: slot.start_time.substring(0, 5), // Format from "09:00:00" to "09:00"
            end: slot.end_time.substring(0, 5),
          };
        }
      });

      setAvailability(availabilityByDay);
    }
  }, [dbAvailability]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvailabilityChange = (
    day: string,
    field: "available" | "start" | "end",
    value: boolean | string
  ) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const handleNotificationChange = (name: string, checked: boolean) => {
    setNotifications((prev) => ({ ...prev, [name]: checked }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setCertificateFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveCertificate = (index: number) => {
    setCertificateFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddExpertise = () => {
    if (
      newExpertise.trim() &&
      !profileData.expertise.includes(newExpertise.trim())
    ) {
      setProfileData((prev) => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()],
      }));
      setNewExpertise("");
    }
  };

  const handleRemoveExpertise = (item: string) => {
    setProfileData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((e) => e !== item),
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert expertise array to JSON string for storage in specialization field
    const specialization = JSON.stringify(profileData.expertise);

    const success = await updateUserProfile({
      full_name: profileData.full_name,
      phone_number: profileData.phone_number,
      company_name: profileData.company_name,
      bio: profileData.bio,
      experience_years: profileData.experience_years,
      specialization,
      title: profileData.title,
      education: profileData.education,
      certifications: profileData.certifications,
      languages: profileData.languages,
      appointment_fee: profileData.appointment_fee,
      session_duration: profileData.session_duration,
      user_role: profileData.user_role,
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddExpertise();
    }
  };

  // Update the availability handler to save to the database
  const handleSaveAvailability = async () => {
    const promises = Object.entries(availability).map(async ([day, value]) => {
      // Convert day string to number (Monday = 1, etc.)
      const dayOfWeek = dayToNumberMap[day];

      // Format times to include seconds (required by database)
      const startTime = `${value.start}:00`;
      const endTime = `${value.end}:00`;

      try {
        await updateDayAvailability.mutateAsync({
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          is_available: value.available,
        });
        return true;
      } catch (error) {
        console.error(`Error updating ${day} availability:`, error);
        return false;
      }
    });

    try {
      await Promise.all(promises);
      toast.success("Availability schedule updated");
    } catch (error) {
      toast.error("Failed to update some availability slots");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <PageTitle
          title="My Profile"
          subtitle="Manage your therapist profile and settings"
        />

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
                  <Card className="glass-card lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="gradient-heading">
                        Profile Picture
                      </CardTitle>
                      <CardDescription>
                        Upload a professional photo to enhance patient trust
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                      <div className="relative mb-4">
                        <Avatar className="h-32 w-32 border-2 border-primary/20 shadow-lg">
                          <AvatarImage src={avatarPreview || undefined} />
                          <AvatarFallback className="text-4xl font-heading">
                            {profileData.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <label
                          htmlFor="profile-image"
                          className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary hover:bg-primary/80 text-white cursor-pointer shadow-md hover:shadow-lg transition-all duration-200"
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
                      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                        Professional headshot recommended. Square format, high
                        quality.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Personal Info Section */}
                  <Card className="glass-card lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="gradient-heading">
                        Personal Information
                      </CardTitle>
                      <CardDescription>
                        Update your professional details
                      </CardDescription>
                      <div className="mt-2 text-sm text-amber-500">
                        <p>
                          * Required fields must be completed to be visible to
                          patients
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">
                            Full Name{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="full_name"
                            name="full_name"
                            value={profileData.full_name}
                            onChange={handleInputChange}
                            placeholder="Your full name"
                            className={
                              !profileData.full_name ? "border-destructive" : ""
                            }
                          />
                          {!profileData.full_name && (
                            <p className="text-xs text-destructive">
                              Full name is required
                            </p>
                          )}
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
                          <Label htmlFor="user_role">
                            Expert Type{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={profileData.user_role}
                            onValueChange={(value) =>
                              handleSelectChange("user_role", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select your expert type" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(EXPERT_ROLES).map(
                                ([role, label]) => (
                                  <SelectItem key={role} value={role}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="title">Professional Title</Label>
                          <Input
                            id="title"
                            name="title"
                            value={profileData.title}
                            onChange={handleInputChange}
                            placeholder="Your professional title"
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
                          placeholder="A brief professional biography highlighting your approach and expertise"
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="experience_years">
                            Years of Experience{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="experience_years"
                            name="experience_years"
                            type="number"
                            min="0"
                            value={profileData.experience_years}
                            onChange={handleInputChange}
                            placeholder="Years of professional experience"
                            className={
                              !profileData.experience_years
                                ? "border-destructive"
                                : ""
                            }
                          />
                          {!profileData.experience_years && (
                            <p className="text-xs text-destructive">
                              Experience years is required
                            </p>
                          )}
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
                          <Label htmlFor="appointment_fee">
                            Session Fee (£)
                          </Label>
                          <Input
                            id="appointment_fee"
                            name="appointment_fee"
                            value={profileData.appointment_fee}
                            onChange={handleInputChange}
                            placeholder="e.g. £90"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="session_duration">
                            Session Duration (minutes)
                          </Label>
                          <Input
                            id="session_duration"
                            name="session_duration"
                            value={profileData.session_duration}
                            onChange={handleInputChange}
                            placeholder="e.g. 50"
                          />
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

          <TabsContent value="credentials">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="gradient-heading">
                      Education & Certifications
                    </CardTitle>
                    <CardDescription>
                      Your academic background and professional qualifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="education">Education</Label>
                      <Textarea
                        id="education"
                        name="education"
                        value={profileData.education}
                        onChange={handleInputChange}
                        placeholder="List your degrees and academic qualifications"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certifications">
                        Professional Certifications
                      </Label>
                      <Textarea
                        id="certifications"
                        name="certifications"
                        value={profileData.certifications}
                        onChange={handleInputChange}
                        placeholder="List your professional licenses and certifications"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certificate-upload">
                        Upload Certificates
                      </Label>
                      <div className="border-2 border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:bg-primary/5 transition-colors">
                        <label
                          htmlFor="certificate-upload"
                          className="cursor-pointer block"
                        >
                          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, PNG or JPG (max. 5MB)
                          </p>
                        </label>
                        <input
                          id="certificate-upload"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          multiple
                          onChange={handleCertificateUpload}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {certificateFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">
                          Uploaded Certificates:
                        </h4>
                        <div className="space-y-2">
                          {certificateFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 rounded-md bg-primary/10"
                            >
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2 text-primary" />
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
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="gradient-heading">
                      Areas of Expertise
                    </CardTitle>
                    <CardDescription>
                      Specify the mental health areas you specialize in
                    </CardDescription>
                    <div className="mt-2 text-sm text-amber-500">
                      <p>
                        * At least one area of expertise is required to be
                        visible to patients
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-expertise">
                        Add Expertise{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="add-expertise"
                          value={newExpertise}
                          onChange={(e) => setNewExpertise(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="e.g. Anxiety, Depression, Trauma"
                          className={
                            profileData.expertise.length === 0
                              ? "border-destructive"
                              : ""
                          }
                        />
                        <Button
                          type="button"
                          onClick={handleAddExpertise}
                          disabled={!newExpertise.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Current Expertise{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {profileData.expertise.length === 0 ? (
                          <p className="text-sm text-destructive">
                            No areas of expertise added yet. Add some above.
                          </p>
                        ) : (
                          profileData.expertise.map((item, index) => (
                            <Badge
                              key={index}
                              className="flex items-center gap-1 bg-primary/20 hover:bg-primary/30 text-foreground"
                            >
                              {item}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0 text-foreground hover:text-destructive"
                                onClick={() => handleRemoveExpertise(item)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button
                      type="button"
                      onClick={handleProfileSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Expertise"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="availability">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="gradient-heading">
                    Session Availability
                  </CardTitle>
                  <CardDescription>
                    Set your regular working hours for patient appointments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(availability).map(([day, value]) => (
                      <div
                        key={day}
                        className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center"
                      >
                        <div className="flex items-center gap-3">
                          <Switch
                            id={`${day}-available`}
                            checked={value.available}
                            onCheckedChange={(checked) =>
                              handleAvailabilityChange(
                                day,
                                "available",
                                checked
                              )
                            }
                          />
                          <Label
                            htmlFor={`${day}-available`}
                            className="capitalize"
                          >
                            {day}
                          </Label>
                        </div>

                        <div className="sm:col-span-3 grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`${day}-start`}>Start Time</Label>
                            <Input
                              id={`${day}-start`}
                              type="time"
                              value={value.start}
                              onChange={(e) =>
                                handleAvailabilityChange(
                                  day,
                                  "start",
                                  e.target.value
                                )
                              }
                              disabled={!value.available}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${day}-end`}>End Time</Label>
                            <Input
                              id={`${day}-end`}
                              type="time"
                              value={value.end}
                              onChange={(e) =>
                                handleAvailabilityChange(
                                  day,
                                  "end",
                                  e.target.value
                                )
                              }
                              disabled={!value.available}
                            />
                          </div>
                        </div>

                        {day !== "sunday" && (
                          <Separator className="sm:col-span-4 my-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button
                    type="button"
                    disabled={availabilityLoading}
                    onClick={handleSaveAvailability}
                  >
                    {availabilityLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Schedule"
                    )}
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
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="gradient-heading">
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handlePasswordSubmit}
                    className="space-y-4 max-w-md"
                  >
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
                      <Label htmlFor="confirm-password">
                        Confirm New Password
                      </Label>
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
                      disabled={
                        passwordSubmitting ||
                        !passwordData.current ||
                        !passwordData.new ||
                        !passwordData.confirm
                      }
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
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
