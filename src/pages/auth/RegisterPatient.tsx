import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Upload, ArrowRight, ArrowLeft, User, Mail, Lock, Phone, MessageSquare, Globe, Heart, Image } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  full_name: z.string().min(2, { message: "Full name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }).optional(),
  phone_number: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  bio: z.string().optional(),
  languages: z.string().optional(),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

// Define form steps
const formSteps = [
  {
    title: "Basic Information",
    description: "Let's start with your account details",
    fields: ["full_name", "username", "email", "password"],
    icon: <User className="h-6 w-6" />
  },
  {
    title: "Contact Information",
    description: "How can others reach you?",
    fields: ["phone_number", "emergency_contact", "emergency_phone"],
    icon: <Phone className="h-6 w-6" />
  },
  {
    title: "About You",
    description: "Tell us more about yourself",
    fields: ["bio", "languages", "website"],
    icon: <MessageSquare className="h-6 w-6" />
  },
  {
    title: "Profile Picture",
    description: "Add a photo to personalize your profile",
    fields: ["profile_picture"],
    icon: <Image className="h-6 w-6" />
  }
];

export default function RegisterPatient() {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      username: "",
      phone_number: "",
      emergency_contact: "",
      emergency_phone: "",
      bio: "",
      languages: "",
      website: "",
    },
    mode: "onChange"
  });
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const nextStep = async () => {
    const fields = formSteps[currentStep].fields;
    const validFields = fields.filter(field => field !== "profile_picture");
    
    const isValid = await form.trigger(validFields as any);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, formSteps.length - 1));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  };
  
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    let avatarUrl: string | undefined = undefined;

    if (profileImage) {
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, profileImage);

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = urlData?.publicUrl;

      } catch (error: any) {
        console.error('Error uploading avatar:', error);
        toast.error(`Failed to upload profile picture: ${error.message}`);
      }
    }

    try {
      // Step 1: Create the user account in auth.users
      const { data: userData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            user_role: 'patient',
            full_name: data.full_name,
          }
        }
      });
      
      if (authError) {
        toast.error(authError.message || 'Registration failed');
        console.error('Auth signup error:', authError);
        setIsSubmitting(false);
        return;
      }
      
      if (!userData.user) {
        toast.error('Failed to create account. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      // Step 2: Directly create profile record with all user details
      const userId = userData.user.id;
      const profileData = {
        id: userId,
        username: data.username,
        full_name: data.full_name,
        avatar_url: avatarUrl,
        website: data.website,
        user_role: 'patient',
        phone_number: data.phone_number,
        emergency_contact: data.emergency_contact,
        emergency_phone: data.emergency_phone,
        email: data.email,
        bio: data.bio,
        languages: data.languages,
        status: 'active'
      };

      // Insert the profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        toast.error('Account created but profile details could not be saved. Please contact support.');
      } else {
        toast.success('Account created successfully! You can now log in.');
        navigate('/login');
      }
    } catch (error: any) {
      console.error("Registration submission error:", error);
      toast.error(`Registration failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastStep = currentStep === formSteps.length - 1;
  const progress = ((currentStep + 1) / formSteps.length) * 100;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const slideVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 }
  };

  return (
    <AuthLayout 
      title="Create your Patient Account" 
      description="Sign up to connect with therapists and resources."
      maxWidth="md:max-w-lg"
    >
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted-foreground">Step {currentStep + 1} of {formSteps.length}</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
        
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
            {formSteps[currentStep].icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{formSteps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">{formSteps[currentStep].description}</p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={slideVariants}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* Step 1: Basic Information */}
            {currentStep === 0 && (
              <motion.div 
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="full_name">Full Name</Label>
                  </div>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    {...form.register("full_name")}
                    className="bg-transparent"
                  />
                  {form.formState.errors.full_name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.full_name.message}
                    </p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="username">Username</Label>
                  </div>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    {...form.register("username")}
                    className="bg-transparent"
                  />
                  {form.formState.errors.username && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.username.message}
                    </p>
                  )}
                </motion.div>
                
                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="email">Email</Label>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...form.register("email")}
                    className="bg-transparent"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </motion.div>
                
                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...form.register("password")}
                      className="bg-transparent"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 1 && (
              <motion.div 
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="phone_number">Phone Number</Label>
                  </div>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    {...form.register("phone_number")}
                    className="bg-transparent"
                  />
                  {form.formState.errors.phone_number && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.phone_number.message}
                    </p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="emergency_contact">Emergency Contact Name</Label>
                  </div>
                  <Input
                    id="emergency_contact"
                    type="text"
                    placeholder="Jane Doe"
                    {...form.register("emergency_contact")}
                    className="bg-transparent"
                  />
                  <p className="text-xs text-muted-foreground">This information will only be used in case of emergency</p>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="emergency_phone">Emergency Phone Number</Label>
                  </div>
                  <Input
                    id="emergency_phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    {...form.register("emergency_phone")}
                    className="bg-transparent"
                  />
                </motion.div>
              </motion.div>
            )}

            {/* Step 3: About You */}
            {currentStep === 2 && (
              <motion.div 
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="bio">Bio</Label>
                  </div>
                  <Textarea
                    id="bio"
                    placeholder="Tell us a bit about yourself..."
                    {...form.register("bio")}
                    className="bg-transparent min-h-32"
                  />
                  <p className="text-xs text-muted-foreground">Share a bit about yourself, your interests, and what you're hoping to gain from therapy</p>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="languages">Languages (comma separated)</Label>
                  </div>
                  <Input
                    id="languages"
                    type="text"
                    placeholder="English, Spanish, French"
                    {...form.register("languages")}
                    className="bg-transparent"
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="website">Website (optional)</Label>
                  </div>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    {...form.register("website")}
                    className="bg-transparent"
                  />
                  {form.formState.errors.website && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.website.message}
                    </p>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* Step 4: Profile Picture */}
            {currentStep === 3 && (
              <motion.div 
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="profilePic">Profile Picture (Optional)</Label>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center gap-6 py-8">
                    {profileImagePreview ? (
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20">
                        <img 
                          src={profileImagePreview} 
                          alt="Profile preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    <label 
                      htmlFor="profilePic"
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {profileImage ? "Change Photo" : "Upload Photo"}
                    </label>
                    <input 
                      id="profilePic" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Adding a photo helps therapists connect with you and builds trust. Your photo will be visible to therapists on the platform.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-4">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex items-center gap-2"
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          
          {!isLastStep ? (
            <Button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 ml-auto"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex items-center gap-2 ml-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
      
      <div className="mt-8 text-center text-sm">
        <span className="text-muted-foreground">Already have an account?</span>{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Login here
        </Link>
      </div>
      <div className="mt-2 text-center text-sm">
        <span className="text-muted-foreground">Are you a therapist?</span>{" "}
        <Link to="/register/therapist" className="font-medium text-primary hover:underline">
          Register here
        </Link>
      </div>
    </AuthLayout>
  );
}
