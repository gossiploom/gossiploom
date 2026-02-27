import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSignalProviderCheck = () => {
  const [isSignalProvider, setIsSignalProvider] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSignalProvider = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsSignalProvider(false);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "signal_provider")
          .maybeSingle();

        setIsSignalProvider(!!data && !error);
      } catch (error) {
        console.error("Error checking signal provider status:", error);
        setIsSignalProvider(false);
      } finally {
        setLoading(false);
      }
    };

    checkSignalProvider();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSignalProvider();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isSignalProvider, loading };
};
