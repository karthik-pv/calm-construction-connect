
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
import { Check, ChevronsUpDown, Eye, EyeOff, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

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
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  phoneNumber: z.string().min(5, { message: "Please enter a valid phone number" }),
  companyName: z.string().min(2, { message: "Company name is required" }),
  name: z.string().min(2, { message: "Legal name is required" }),
  yearsExperience: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Years of experience must be a number",
  }),
  expertise: z.array(z.string()).min(1, { message: "Please select at least one area of expertise" }),
  bio: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function RegisterTherapist() {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [licenseImage, setLicenseImage] = useState<File | null>(null);
  const [licenseImageName, setLicenseImageName] = useState<string | null>(null);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      phoneNumber: "",
      companyName: "",
      name: "",
      yearsExperience: "",
      expertise: [],
      bio: "",
    },
  });
  
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };
  
  const handleLicenseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLicenseImage(file);
      setLicenseImageName(file.name);
    }
  };
  
  const onSubmit = async (data: FormData) => {
    // In a real app, you would upload the images to storage and get URLs
    // For demo purposes, we'll use placeholders
    const profilePicUrl = profileImagePreview || "https://i.pravatar.cc/150?img=" + Math.floor(Math.random() * 70);
    
    try {
      await registerUser(
        {
          email: data.email,
          name: data.name,
          phoneNumber: data.phoneNumber,
          companyName: data.companyName,
          profilePic: profilePicUrl,
          experience: parseInt(data.yearsExperience),
          expertise: data.expertise,
          bio: data.bio,
        },
        data.password,
        "therapist"
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
      title="Register as Mental Health Professional" 
      description="Create your therapist account"
      maxWidth="md:max-w-xl"
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
                placeholder="Your clinic or practice name"
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
                  onChange={handleProfileImageChange}
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
          
          <motion.div variants={item} className="text-left text-lg font-medium mb-2 mt-6">
            Additional Details
          </motion.div>
          
          <motion.div variants={item}>
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                min="0"
                placeholder="5"
                {...form.register("yearsExperience")}
              />
              {form.formState.errors.yearsExperience && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.yearsExperience.message}
                </p>
              )}
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <div className="space-y-2">
              <Label>Expertise</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedExpertise.length > 0
                      ? `${selectedExpertise.length} selected`
                      : "Select areas of expertise"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search expertise..." />
                    <CommandEmpty>No expertise found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-auto">
                      {expertiseOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => {
                            const updatedExpertise = selectedExpertise.includes(option.label)
                              ? selectedExpertise.filter((item) => item !== option.label)
                              : [...selectedExpertise, option.label];
                            
                            setSelectedExpertise(updatedExpertise);
                            form.setValue("expertise", updatedExpertise);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedExpertise.includes(option.label) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {form.formState.errors.expertise && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.expertise.message}
                </p>
              )}
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                placeholder="Share your professional background and approach..."
                className="min-h-[100px] resize-y"
                {...form.register("bio")}
              />
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <div className="space-y-2">
              <Label>License certificate</Label>
              <div className="flex items-center gap-2">
                <label 
                  htmlFor="license"
                  className="cursor-pointer flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                >
                  <div className="flex h-9 items-center justify-center rounded-md border border-input bg-background px-3">
                    <Upload className="h-4 w-4 mr-2" />
                    {licenseImageName || "No file chosen"}
                  </div>
                </label>
                <input 
                  id="license" 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={handleLicenseImageChange}
                  className="hidden"
                />
              </div>
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
