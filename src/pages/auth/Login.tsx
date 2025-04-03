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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Eye, EyeOff, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type FormData = z.infer<typeof formSchema>;

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "dummy@gmail.com",
      password: "password",
    },
  });
  
  const onSubmit = async (data: FormData) => {
    await login(data.email, data.password);
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
      title="Log in to your account"
      description="Enter your credentials to access the platform"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Alert className="mb-6 bg-primary/10 text-primary border-primary/20">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Use <strong>dummy@gmail.com</strong> with password <strong>password</strong> to log in.
          </AlertDescription>
        </Alert>
      </motion.div>

      <Tabs defaultValue="credentials" className="w-full">
        <TabsList className="grid w-full grid-cols-1 mb-4">
          <TabsTrigger value="credentials">Login</TabsTrigger>
        </TabsList>
        
        <TabsContent value="credentials">
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
            <motion.div 
              className="space-y-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={item}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
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
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Log in"}
                </Button>
              </motion.div>
            </motion.div>
          </form>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 text-center text-sm">
        <span className="text-muted-foreground">Don't have an account?</span>{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </AuthLayout>
  );
}
