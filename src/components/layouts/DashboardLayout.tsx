import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Calendar, FileText, Home, LogOut, Menu, MessageCircle, Settings, User, Brain, Users, Moon, Sun } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { ProfileCompletionBanner } from "@/components/shared/ProfileCompletionBanner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

const getNavItems = (role: UserRole): NavItem[] => {
  if (role === "patient") {
    return [
      { label: "Dashboard", href: "/patient", icon: Home },
      { label: "AI Chatbot", href: "/patient/chatbot", icon: Brain },
      { label: "Experts", href: "/patient/experts", icon: Users },
      { label: "Chat", href: "/patient/chat", icon: MessageCircle },
      { label: "Posts", href: "/patient/posts", icon: FileText },
      { label: "Anxiety Calmer", href: "/patient/anxiety-calmer", icon: Calendar },
      { label: "Profile", href: "/patient/profile", icon: User },
    ];
  } else {
    return [
      { label: "Dashboard", href: "/therapist", icon: Home },
      { label: "Chat", href: "/therapist/chat", icon: MessageCircle },
      { label: "Posts", href: "/therapist/posts", icon: FileText },
      { label: "Profile", href: "/therapist/profile", icon: User },
      { label: "Manage Therapists", href: "/admin/therapists", icon: Settings },
    ];
  }
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  
  const navItems = profile ? getNavItems(profile.user_role) : [];
  
  useEffect(() => {
    // Check if user is authenticated
    if (!user || !profile) {
      navigate("/login");
    }
  }, [user, profile, navigate]);
  
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-black/50 backdrop-blur-md">
        <div className="p-4">
          <h1 className="text-xl font-bold gradient-text">MindBuild</h1>
          <p className="text-xs text-muted-foreground">Mental health platform</p>
        </div>
        
        <ScrollArea className="flex-1 pt-2">
          <nav className="px-2 space-y-1">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  location.pathname === item.href || 
                  (location.pathname.startsWith(item.href) && item.href !== (profile.user_role === "patient" ? "/patient" : "/therapist"))
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </ScrollArea>
        
        <div className="p-4 mt-auto border-t border-border">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {profile.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => window.location.href = '/force-logout.html'}
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-black/90 backdrop-blur-lg">
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-bold gradient-text">MindBuild</h1>
            <p className="text-xs text-muted-foreground">Mental health platform</p>
          </div>
          
          <ScrollArea className="flex-1 h-[calc(100vh-9rem)]">
            <nav className="px-2 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    location.pathname === item.href || 
                    (location.pathname.startsWith(item.href) && item.href !== (profile.user_role === "patient" ? "/patient" : "/therapist"))
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </ScrollArea>
          
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {profile.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => window.location.href = '/force-logout.html'}
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border h-14 bg-background/90 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center">
              {isMobile && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSidebarOpen(true)}
                      className="mr-2"
                      aria-label="Open menu"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                </Sheet>
              )}
              <div className="md:hidden">
                <h1 className="text-xl font-bold gradient-text">MindBuild</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {profile.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/${profile.user_role}/profile`}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/${profile.user_role}/chat`}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Messages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="#">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/force-logout.html'}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Show profile completion banner for experts */}
          <div className="px-6 pt-6">
            <ProfileCompletionBanner />
          </div>
          {children}
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}
