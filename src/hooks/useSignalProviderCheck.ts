import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSignalProviderCheck = () => {
  const [isSignalProvider, setIsSignalProvider] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let authSubscription: any;

    const checkSignalProvider = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsSignalProvider(false);
          setLoading(false);
          return;
        }

        // Check user role
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "signal_provider")
          .maybeSingle();

        if (error) {
          console.error("Error fetching role:", error);
        }

        setIsSignalProvider(!!data);
      } catch (err) {
        console.error("Error checking signal provider status:", err);
        setIsSignalProvider(false);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkSignalProvider();

    // Listen to auth changes
    authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
      checkSignalProvider();
    });

    return () => {
      authSubscription?.data?.subscription?.unsubscribe();
    };
  }, []);

  return { isSignalProvider, loading };
};
