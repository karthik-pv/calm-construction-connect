import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Function to completely reset browser storage
  const fullReset = () => {
    // Clear all localStorage
    localStorage.clear();
    
    // Clear all sessionStorage
    sessionStorage.clear();
    
    // Clear cookies (can only clear non-HttpOnly cookies)
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    });
    
    toast.success("Storage reset! Page will reload.");
    
    // Reload the page to ensure everything is fresh
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        toast.success("You have been logged out successfully");
        navigate("/login");
      } catch (error) {
        console.error("Logout error:", error);
        toast.error("Failed to log out. Please try again.");
      }
    };

    performLogout();
  }, [logout, navigate]);

  return (
    <div className="flex items-center justify-center h-screen w-screen flex-col">
      <div className="mindful-loader mb-4"></div>
      <h1 className="font-semibold text-xl mb-6">Logging you out...</h1>
      
      <div className="mt-8 p-4 border border-border bg-black/30 rounded-lg">
        <h2 className="text-sm font-medium mb-2">Having trouble with the app?</h2>
        <p className="text-xs text-muted-foreground mb-4">
          If you're experiencing issues with navigation or seeing the wrong dashboard, try a complete reset:
        </p>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={fullReset}
        >
          Reset App Storage
        </Button>
      </div>
    </div>
  );
};

export default Logout; 