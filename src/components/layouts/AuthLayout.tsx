import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function AuthLayout({
  children,
  title,
  description,
  footer,
  maxWidth = "md:max-w-md",
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <Link
          to="/"
          className="mx-auto block w-full max-w-[200px] mb-8 text-center"
        >
          <h1 className="gradient-text text-2xl font-bold">Ambitious Care</h1>
          <p className="text-muted-foreground text-sm">
            Mental health for construction workers
          </p>
        </Link>

        <Card className={`mx-auto w-full ${maxWidth} glass-card`}>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl text-center">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-center">
                {description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer && <CardFooter>{footer}</CardFooter>}
        </Card>
      </motion.div>
    </div>
  );
}
