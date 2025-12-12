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
  is_global: boolean;
  target_user_id: string | null;
}

export const AdminNotificationListener = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Fetch global notifications (visible to everyone including non-authenticated users)
      const { data: globalNotifications } = await supabase
        .from("admin_notifications")
        .select("*")
        .eq("is_global", true)
        .order("created_at", { ascending: false });

      let allNotifications = globalNotifications || [];

      // If user is authenticated, also fetch their targeted notifications
      if (user) {
        const { data: targetedNotifications } = await supabase
          .from("admin_notifications")
          .select("*")
          .eq("target_user_id", user.id)
          .order("created_at", { ascending: false });

        if (targetedNotifications) {
          allNotifications = [...allNotifications, ...targetedNotifications];
        }

        // Get read notifications for authenticated users
        const { data: readNotifications } = await supabase
          .from("notification_reads")
          .select("notification_id")
          .eq("user_id", user.id);

        const readIds = new Set(readNotifications?.map(r => r.notification_id) || []);
        allNotifications = allNotifications.filter(n => !readIds.has(n.id));
      }

      // For non-authenticated users, use localStorage to track dismissed notifications
      const localDismissed = JSON.parse(localStorage.getItem("dismissed_notifications") || "[]");
      setDismissedIds(new Set(localDismissed));

      const unread = allNotifications.filter(n => !localDismissed.includes(n.id));
      setNotifications(unread);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel("admin-notifications-public")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_notifications",
        },
        async (payload) => {
          const notification = payload.new as Notification;
          
          // Show global notifications to everyone
          if (notification.is_global) {
            setNotifications(prev => [notification, ...prev]);
          } else if (currentUserId && notification.target_user_id === currentUserId) {
            // Show targeted notifications only to the target user
            setNotifications(prev => [notification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const dismissNotification = async (notificationId: string) => {
    // For authenticated users, save to database
    if (currentUserId) {
      await supabase.from("notification_reads").insert({
        notification_id: notificationId,
        user_id: currentUserId,
      });
    }

    // For all users (including non-authenticated), save to localStorage
    const localDismissed = JSON.parse(localStorage.getItem("dismissed_notifications") || "[]");
    localDismissed.push(notificationId);
    localStorage.setItem("dismissed_notifications", JSON.stringify(localDismissed));

    setDismissedIds(prev => new Set([...prev, notificationId]));
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