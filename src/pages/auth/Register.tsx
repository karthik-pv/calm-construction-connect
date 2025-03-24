
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { motion } from "framer-motion";

export default function Register() {
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
      title="Create an account"
      description="Choose your account type to get started"
      maxWidth="md:max-w-lg"
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 mt-6 sm:grid-cols-2"
      >
        <motion.div variants={item}>
          <Link to="/register/patient">
            <div className="group h-full overflow-hidden rounded-xl border border-border bg-black/50 p-6 hover:border-primary/50 hover:bg-black/70 transition-all duration-300">
              <div className="flex flex-col items-center text-center h-full gap-4">
                <div className="rounded-full bg-primary/20 p-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-primary"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Construction Worker</h3>
                  <p className="text-muted-foreground mt-2">
                    Create an account as a construction worker to access mental health resources.
                  </p>
                </div>
                <Button className="mt-auto w-full">Register as Worker</Button>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={item}>
          <Link to="/register/therapist">
            <div className="group h-full overflow-hidden rounded-xl border border-border bg-black/50 p-6 hover:border-primary/50 hover:bg-black/70 transition-all duration-300">
              <div className="flex flex-col items-center text-center h-full gap-4">
                <div className="rounded-full bg-primary/20 p-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-primary"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Mental Health Professional</h3>
                  <p className="text-muted-foreground mt-2">
                    Create an account as a therapist to provide support and resources.
                  </p>
                </div>
                <Button className="mt-auto w-full">Register as Therapist</Button>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Already have an account?</span>{" "}
        <Link to="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </div>
    </AuthLayout>
  );
}
