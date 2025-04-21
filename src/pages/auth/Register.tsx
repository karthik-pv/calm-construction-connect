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
      maxWidth="md:max-w-4xl"
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 mt-6 sm:grid-cols-2 md:grid-cols-3"
      >
        {/* Patient Option */}
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
                  <h3 className="text-xl font-bold">Patient</h3>
                  <p className="text-muted-foreground mt-2">
                    Create an account to access mental health resources and expert help.
                  </p>
                </div>
                <Button className="mt-auto w-full">Register as Patient</Button>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Therapist Option */}
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
                  <h3 className="text-xl font-bold">Therapist</h3>
                  <p className="text-muted-foreground mt-2">
                    Create an account as a therapist to provide mental health support.
                  </p>
                </div>
                <Button className="mt-auto w-full">Register as Therapist</Button>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Relationship Expert Option */}
        <motion.div variants={item}>
          <Link to="/register/relationship_expert">
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
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Relationship Expert</h3>
                  <p className="text-muted-foreground mt-2">
                    Create an account to help with relationship issues and family dynamics.
                  </p>
                </div>
                <Button className="mt-auto w-full">Register as Relationship Expert</Button>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Financial Expert Option */}
        <motion.div variants={item}>
          <Link to="/register/financial_expert">
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
                      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Financial Expert</h3>
                  <p className="text-muted-foreground mt-2">
                    Create an account to provide financial guidance and planning support.
                  </p>
                </div>
                <Button className="mt-auto w-full">Register as Financial Expert</Button>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Dating Coach Option */}
        <motion.div variants={item}>
          <Link to="/register/dating_coach">
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
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Dating Coach</h3>
                  <p className="text-muted-foreground mt-2">
                    Create an account to help with dating, confidence building and healthy relationships.
                  </p>
                </div>
                <Button className="mt-auto w-full">Register as Dating Coach</Button>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Health & Wellness Coach Option */}
        <motion.div variants={item}>
          <Link to="/register/health_wellness_coach">
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
                      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Health & Wellness Coach</h3>
                  <p className="text-muted-foreground mt-2">
                    Create an account to provide fitness, nutrition, and wellness guidance.
                  </p>
                </div>
                <Button className="mt-auto w-full">Register as Health & Wellness Coach</Button>
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
