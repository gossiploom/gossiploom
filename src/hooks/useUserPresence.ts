import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserPresence = () => {
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updatePresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_presence")
        .upsert({
          user_id: user.id,
          last_seen: new Date().toISOString(),
          is_online: true,
        }, { onConflict: "user_id" });
    };

    const setOffline = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_presence")
        .upsert({
          user_id: user.id,
          last_seen: new Date().toISOString(),
          is_online: false,
        }, { onConflict: "user_id" });
    };

    // Initial presence update
    updatePresence();

    // Update presence every 30 seconds
    intervalId = setInterval(updatePresence, 30000);

    // Set offline on page unload
    window.addEventListener("beforeunload", setOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", setOffline);
      setOffline();
    };
  }, []);
};
