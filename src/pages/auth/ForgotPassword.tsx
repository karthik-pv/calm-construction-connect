
import { useState } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { toast } from "sonner";
import { motion } from "framer-motion";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type FormData = z.infer<typeof formSchema>;

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitted(true);
      toast.success("Password reset instructions sent to your email");
    } catch (error) {
      toast.error("Failed to send reset instructions. Please try again.");
      console.error("Password reset error:", error);
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

  return (
    <AuthLayout
      title="Reset your password"
      description={
        submitted
          ? "Check your email for reset instructions"
          : "Enter your email and we'll send you instructions to reset your password"
      }
    >
      {!submitted ? (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <motion.div 
            className="space-y-4"
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
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </motion.div>
            
            <motion.div variants={item}>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Sending instructions..." : "Send reset instructions"}
              </Button>
            </motion.div>
          </motion.div>
        </form>
      ) : (
        <motion.div 
          className="text-center py-6 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-full bg-primary/20 p-6 mx-auto w-24 h-24 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-10 h-10 text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold">Check your inbox</h3>
          <p className="text-muted-foreground">
            We've sent password reset instructions to your email address.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              form.reset();
            }}
            className="mt-4"
          >
            Try another email
          </Button>
        </motion.div>
      )}
      
      <div className="mt-6 text-center text-sm">
        <Link to="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
