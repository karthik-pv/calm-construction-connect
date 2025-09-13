import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/shared/Footer";

const Index = () => {
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="gradient-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Welcome to AmbitiousCare
            </h1>
            <p className="text-amber-50/90 text-xl md:text-2xl leading-relaxed mb-8">
              A holistic digital platform designed to provide blue-collar workers with access to expert support 
              across mental health, relationships, financial guidance, health & wellness, and career advancement.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link to="/login">
              <Button size="lg" className="cream-button text-lg px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg" className="text-amber-100 border-amber-200/30 hover:bg-amber-900/20 text-lg px-8 py-3">
                Create Account
              </Button>
            </Link>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="gradient-text text-xl font-semibold mb-2">Mental Health Support</h3>
              <p className="text-amber-50/80">Access to qualified therapists and mental health professionals.</p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">💼</div>
              <h3 className="gradient-text text-xl font-semibold mb-2">Career Development</h3>
              <p className="text-amber-50/80">Expert guidance for professional growth and advancement.</p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="gradient-text text-xl font-semibold mb-2">Financial Advisory</h3>
              <p className="text-amber-50/80">Professional financial planning and money management advice.</p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">❤️</div>
              <h3 className="gradient-text text-xl font-semibold mb-2">Relationship Support</h3>
              <p className="text-amber-50/80">Expert guidance for personal and family relationships.</p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">🏃‍♂️</div>
              <h3 className="gradient-text text-xl font-semibold mb-2">Health & Wellness</h3>
              <p className="text-amber-50/80">Comprehensive health and wellness coaching services.</p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-3xl mb-4">🤝</div>
              <h3 className="gradient-text text-xl font-semibold mb-2">Expert Network</h3>
              <p className="text-amber-50/80">Connect with verified professionals across all life areas.</p>
            </div>
          </motion.div>

          {/* Legal Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <p className="text-amber-50/70 text-sm mb-4">
              By using our platform, you agree to our{" "}
              <Link to="/terms" className="text-amber-200 hover:text-amber-100 underline transition-colors">
                Terms & Conditions
              </Link>
              ,{" "}
              <Link to="/privacy-policy" className="text-amber-200 hover:text-amber-100 underline transition-colors">
                Privacy Policy
              </Link>
              , and{" "}
              <Link to="/cookies-policy" className="text-amber-200 hover:text-amber-100 underline transition-colors">
                Cookies Policy
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
