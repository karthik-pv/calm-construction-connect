
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
import { Eye, EyeOff, Upload } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phoneNumber: z.string().min(5, { message: "Please enter a valid phone number" }),
  companyName: z.string().min(2, { message: "Company name is required" }),
  name: z.string().min(2, { message: "Legal name is required" }),
});

type FormData = z.infer<typeof formSchema>;

export default function RegisterPatient() {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      phoneNumber: "",
      companyName: "",
      name: "",
    },
  });
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };
  
  const onSubmit = async (data: FormData) => {
    // In a real app, you would upload the image to storage and get a URL
    // For demo purposes, we'll use a placeholder if no image was selected
    const profilePicUrl = profileImagePreview || "https://i.pravatar.cc/150?img=" + Math.floor(Math.random() * 70);
    
    try {
      await registerUser(
        {
          email: data.email,
          name: data.name,
          phoneNumber: data.phoneNumber,
          companyName: data.companyName,
          profilePic: profilePicUrl,
        },
        data.password,
        "patient"
      );
    } catch (error) {
      console.error("Registration error:", error);
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
      title="Register as Construction Worker" 
      description="Create your patient account"
      maxWidth="md:max-w-lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <motion.div 
          className="space-y-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="text-left text-lg font-medium mb-2">
            Personal Information
          </motion.div>
          
          <motion.div variants={item}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...form.register("email")}
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
              <Label htmlFor="phoneNumber">Phone number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+44 123 456 7890"
                {...form.register("phoneNumber")}
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Your construction company"
                {...form.register("companyName")}
              />
              {form.formState.errors.companyName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.companyName.message}
                </p>
              )}
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <div className="space-y-2">
              <Label htmlFor="name">Legal name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Full name"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <div className="space-y-2">
              <Label>Profile pic</Label>
              <div className="flex items-center gap-4">
                {profileImagePreview && (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <img 
                      src={profileImagePreview} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <label 
                  htmlFor="profilePic"
                  className="cursor-pointer flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                >
                  <div className="flex h-9 items-center justify-center rounded-md border border-input bg-background px-3">
                    <Upload className="h-4 w-4 mr-2" />
                    {profileImage ? profileImage.name : "Choose file"}
                  </div>
                </label>
                <input 
                  id="profilePic" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
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
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <Button
              type="submit"
              className="w-full bg-primary"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
          </motion.div>
        </motion.div>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Already have an account?</span>{" "}
        <Link to="/login" className="text-primary hover:underline">
          Login here
        </Link>
      </div>
    </AuthLayout>
  );
}
