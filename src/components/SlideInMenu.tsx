import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Settings, History, LogOut, Newspaper, Home, LineChart, ShoppingCart, Shield, Bell, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { NotificationsPanel } from "./NotificationsPanel";
import { Badge } from "@/components/ui/badge";

export const SlideInMenu = () => {
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: allNotifications } = await supabase
      .from("admin_notifications")
      .select("id")
      .or(`is_global.eq.true,target_user_id.eq.${user.id}`);

    const { data: readNotifications } = await supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("user_id", user.id);

    const readIds = new Set(readNotifications?.map(r => r.notification_id) || []);
    const unread = allNotifications?.filter(n => !readIds.has(n.id)).length || 0;
    setUnreadCount(unread);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
    });
    navigate("/auth");
    setOpen(false);
  };

  const menuItems = isAdmin ? [
    { to: "/admin", icon: Shield, label: "Admin Dashboard", primary: true },
    { to: "/", icon: Home, label: "Home" },
    { to: "/settings", icon: Settings, label: "Settings" },
    { to: "/history", icon: History, label: "History" },
    { to: "/news", icon: Newspaper, label: "News" },
    { to: "/chart-viewer", icon: LineChart, label: "Chart Viewer" },
  ] : [
    { to: "/", icon: Home, label: "Home" },
    { to: "/signals", icon: TrendingUp, label: "Signals" },
    { to: "/settings", icon: Settings, label: "Settings" },
    { to: "/history", icon: History, label: "History" },
    { to: "/purchase", icon: ShoppingCart, label: "Purchase Slots" },
    { to: "/news", icon: Newspaper, label: "News" },
    { to: "/chart-viewer", icon: LineChart, label: "Chart Viewer" },
  ];

  return (
    <>
      <div className="fixed top-5 right-4 z-[60]" ref={menuRef}>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-md px-3 py-2 hover:bg-accent"
          onClick={() => setOpen(!open)}
        >
          <Menu className="h-5 w-5" />
          <span className="text-sm font-medium">Menu</span>
        </Button>

        {open && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col p-2">
              {menuItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start gap-2 ${item.primary ? 'text-primary' : ''}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              
              {/* Notifications button for non-admin users */}
              {!isAdmin && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setOpen(false);
                    setShowNotifications(true);
                  }}
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0.5">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </nav>
          </div>
        )}
      </div>

      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false);
          fetchUnreadCount();
        }} 
      />
    </>
  );
};