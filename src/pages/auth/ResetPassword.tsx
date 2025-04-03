import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { toast } from "sonner";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z
  .object({
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsTokenValid(true);
        toast.info("Authenticated. Please set your new password.");
      } else {
        setIsTokenValid(false);
        toast.error("Invalid or expired password reset link.");
      }
    });
  }, []);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        throw error;
      }

      toast.success("Password has been reset successfully!");
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
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

  if (isTokenValid === null) {
    return (
      <AuthLayout title="Verifying..." description="Checking your reset link...">
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  if (isTokenValid === false) {
    return (
      <AuthLayout title="Link Invalid" description="This password reset link is invalid or has expired.">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            The password reset link you used is either invalid or has expired. Please request a new one.
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Button asChild variant="link">
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      description="Create a new password for your account"
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
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
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
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...form.register("confirmPassword")}
                  className="bg-transparent"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Setting password..." : "Set New Password"}
            </Button>
          </motion.div>
        </motion.div>
      </form>
      
      <div className="mt-8 text-center text-sm">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
