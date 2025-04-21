import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Check, ChevronsUpDown, Eye, EyeOff, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const expertiseOptions = [
  { label: "Anxiety", value: "anxiety" },
  { label: "Depression", value: "depression" },
  { label: "Work Stress", value: "work-stress" },
  { label: "PTSD", value: "ptsd" },
  { label: "Addiction", value: "addiction" },
  { label: "Grief", value: "grief" },
  { label: "Relationship Issues", value: "relationship-issues" },
  { label: "Trauma", value: "trauma" },
  { label: "Self-Esteem", value: "self-esteem" },
  { label: "Anger Management", value: "anger-management" },
];

const formSchema = z.object({
  full_name: z.string().min(2, { message: "Full name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type FormData = z.infer<typeof formSchema>;

export default function RegisterTherapist() {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
    },
  });
  
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };
  
  const onSubmit = async (data: FormData) => {
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
      // Check if user with this email already exists
      const { data: checkData, error: checkError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password
      });
      
      // If identities array is empty, the email is already registered
      if (checkData?.user && checkData.user.identities && checkData.user.identities.length === 0) {
        toast.error('Email is already in use. Please use a different email address.');
        return;
      }
      
      // If email is not registered, proceed with registration
      await registerUser(
        {
          email: data.email,
          full_name: data.full_name,
        },
        data.password,
        "therapist"
      );

    } catch (error) {
      console.error("Therapist registration submission error:", error);
    }
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
    <AuthLayout 
      title="Register as a Therapist" 
      description="Join our platform to connect with patients."
      maxWidth="md:max-w-xl"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <motion.div 
          className="space-y-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Dr. Jane Smith"
                {...form.register("full_name")}
                className="bg-transparent"
              />
              {form.formState.errors.full_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@practice.com"
                {...form.register("email")}
                className="bg-transparent"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <div className="space-y-2">
              <Label>Profile Picture (Optional)</Label>
              <div className="flex items-center gap-4">
                {profileImagePreview && (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                    <img 
                      src={profileImagePreview} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <label 
                  htmlFor="profilePic"
                  className="cursor-pointer flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <div className="flex h-10 items-center justify-center rounded-md border border-input bg-transparent px-4 py-2 text-sm ring-offset-background">
                    <Upload className="h-4 w-4 mr-2" />
                    {profileImage ? profileImage.name : "Choose file"}
                  </div>
                </label>
                <input 
                  id="profilePic" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300"
              disabled={loading}
            >
              {loading ? "Registering..." : "Create Therapist Account"}
            </Button>
          </motion.div>
        </motion.div>
      </form>
      
      <div className="mt-8 text-center text-sm">
        <span className="text-muted-foreground">Already have an account?</span>{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Login here
        </Link>
      </div>
      <div className="mt-2 text-center text-sm">
        <span className="text-muted-foreground">Are you a patient?</span>{" "}
        <Link to="/register/patient" className="font-medium text-primary hover:underline">
          Register here
        </Link>
      </div>
    </AuthLayout>
  );
}
