import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  title: string;
  message: string;
  duration_seconds: number;
  created_at: string;
}

export const AdminNotificationListener = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get notifications that user hasn't read yet
      const { data: allNotifications } = await supabase
        .from("admin_notifications")
        .select("*")
        .or(`is_global.eq.true,target_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!allNotifications) return;

      const { data: readNotifications } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user.id);

      const readIds = new Set(readNotifications?.map(r => r.notification_id) || []);
      const unread = allNotifications.filter(n => !readIds.has(n.id));

      setNotifications(unread);
    };

    fetchUnreadNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_notifications",
        },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const notification = payload.new as Notification & { is_global: boolean; target_user_id: string | null };
          
          // Check if notification is for this user
          if (notification.is_global || notification.target_user_id === user.id) {
            setNotifications(prev => [notification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const dismissNotification = async (notificationId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notification_reads").insert({
      notification_id: notificationId,
      user_id: user.id,
    });

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  useEffect(() => {
    // Auto-dismiss notifications after their duration
    notifications.forEach(notification => {
      if (notification.duration_seconds > 0) {
        setTimeout(() => {
          dismissNotification(notification.id);
        }, notification.duration_seconds * 1000);
      }
    });
  }, [notifications]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg animate-in slide-in-from-right"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold">{notification.title}</h4>
              <p className="text-sm opacity-90 mt-1">{notification.message}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 hover:bg-primary-foreground/20"
              onClick={() => dismissNotification(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
