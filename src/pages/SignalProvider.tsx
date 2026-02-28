import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSignalProviderCheck } from "@/hooks/useSignalProviderCheck";
import { supabase } from "@/integrations/supabase/client";

const SignalProvider = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isSignalProvider, loading } = useSignalProviderCheck();

  const [signals, setSignals] = useState<any[]>([]);
  const [loadingSignals, setLoadingSignals] = useState(true);

  useEffect(() => {
    if (!loading && !isSignalProvider) {
      toast({
        title: "Access Denied",
        description: "You don't have signal provider permissions.",
        variant: "destructive",
      });
      navigate("/", { replace: true });
    }
  }, [loading, isSignalProvider, navigate, toast]);

  // Fetch user signals
  useEffect(() => {
    if (!loading && isSignalProvider) {
      const fetchSignals = async () => {
        setLoadingSignals(true);
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) return;

          const { data, error } = await supabase
            .from("signals")
            .select("*")
            .eq("provider_id", user.id)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error fetching signals:", error);
            toast({
              title: "Error",
              description: "Failed to load your signals",
              variant: "destructive",
            });
          } else {
            setSignals(data || []);
          }
        } catch (err) {
          console.error("Error fetching signals:", err);
        } finally {
          setLoadingSignals(false);
        }
      };

      fetchSignals();
    }
  }, [loading, isSignalProvider, toast]);

  // Safe loading placeholder
  if (loading || typeof isSignalProvider === "undefined") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignalProvider) return null; // prevents unauthorized flash

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Signal Provider Dashboard</h1>

      <div className="mt-6">
        {loadingSignals ? (
          <p>Loading your signals...</p>
        ) : signals.length === 0 ? (
          <p>No signals created yet.</p>
        ) : (
          <div className="space-y-4">
            {signals.map(signal => (
              <div key={signal.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{signal.currency_pair}</span>
                  <span>{signal.signal_type}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-1">
                  <div>Entry: {signal.entry_price}</div>
                  <div>SL: {signal.stop_loss}</div>
                  <div>TP: {signal.take_profit}</div>
                  <div>Visibility: {signal.signal_visibility}</div>
                </div>
                <p>Outcome: {signal.outcome || "Pending"}</p>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(signal.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalProvider;
