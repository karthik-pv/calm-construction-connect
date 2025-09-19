import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card mt-auto border-t border-amber-900/20"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-amber-50/80 text-sm">
              © 2025 AmbitiousCare Ltd. All rights reserved.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link 
              to="/terms" 
              className="text-amber-100/80 hover:text-amber-100 transition-colors duration-200"
            >
              Terms & Conditions
            </Link>
            <Link 
              to="/privacy-policy" 
              className="text-amber-100/80 hover:text-amber-100 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/cookies-policy" 
              className="text-amber-100/80 hover:text-amber-100 transition-colors duration-200"
            >
              Cookies Policy
            </Link>
            <a 
              href="mailto:contact@ambitiouscare.co" 
              className="text-amber-100/80 hover:text-amber-100 transition-colors duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer; 