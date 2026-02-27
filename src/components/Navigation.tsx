import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useSignalProviderCheck } from "@/hooks/useSignalProviderCheck";
import {
  TrendingUp,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Target,
  BarChart3,
  Gift,
  Home,
  History,
  Newspaper,
  Users,
  HelpCircle,
  Crown
} from "lucide-react";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();
  const { isSignalProvider } = useSignalProviderCheck();
  
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/free-signals", label: "Free Signals", icon: Gift },
    { path: "/signals", label: "Signals", icon: BarChart3 },
    { path: "/news", label: "News", icon: Newspaper },
    { path: "/chart-viewer", label: "Charts", icon: TrendingUp },
  ];

  const authLinks = [
    { path: "/history", label: "History", icon: History },
    { path: "/referral-program", label: "Referrals", icon: Users },
  ];

  const roleLinks = [
    ...(isSignalProvider ? [{ path: "/signal-provider", label: "Provider Dashboard", icon: Target }] : []),
    ...(isAdmin ? [{ path: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">GossipLoom</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant={isActive(link.path) ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(link.path)}
                className="gap-2"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Button>
            ))}
            
            {user && authLinks.map((link) => (
              <Button
                key={link.path}
                variant={isActive(link.path) ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(link.path)}
                className="gap-2"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Button>
            ))}

            {roleLinks.map((link) => (
              <Button
                key={link.path}
                variant={isActive(link.path) ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(link.path)}
                className={`gap-2 ${link.path === "/admin" ? "text-red-500" : "text-purple-500"}`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Button>
            ))}
          </div>

          {/* Right Side - User Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {user.email?.split("@")[0]}
                    </span>
                    {isAdmin && <Shield className="w-4 h-4 text-red-500" />}
                    {isSignalProvider && <Target className="w-4 h-4 text-purple-500" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.email}</p>
                    {isAdmin && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Administrator
                      </p>
                    )}
                    {isSignalProvider && (
                      <p className="text-xs text-purple-500 flex items-center gap-1">
                        <Target className="w-3 h-3" /> Signal Provider
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  
                  {isSignalProvider && (
                    <DropdownMenuItem onClick={() => navigate("/signal-provider")}>
                      <Target className="w-4 h-4 mr-2 text-purple-500" />
                      Provider Dashboard
                    </DropdownMenuItem>
                  )}
                  
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="w-4 h-4 mr-2 text-red-500" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/history")}>
                    <History className="w-4 h-4 mr-2" />
                    Signal History
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate("/auth?signup=true")}>
                  <Crown className="w-4 h-4 mr-1" />
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  variant={isActive(link.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    navigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start gap-2"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              ))}
              
              {user && authLinks.map((link) => (
                <Button
                  key={link.path}
                  variant={isActive(link.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    navigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start gap-2"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              ))}

              {roleLinks.map((link) => (
                <Button
                  key={link.path}
                  variant={isActive(link.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    navigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`justify-start gap-2 ${link.path === "/admin" ? "text-red-500" : "text-purple-500"}`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              ))}

              {!user && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate("/auth");
                      setMobileMenuOpen(false);
                    }}
                    className="justify-start gap-2"
                  >
                    <User className="w-4 h-4" />
                    Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigate("/auth?signup=true");
                      setMobileMenuOpen(false);
                    }}
                    className="justify-start gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
