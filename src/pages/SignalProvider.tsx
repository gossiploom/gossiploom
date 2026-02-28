import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSignalProviderCheck } from "@/hooks/useSignalProviderCheck";

const SignalProvider = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isSignalProvider, loading } = useSignalProviderCheck();

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignalProvider) {
    return null;
  }

  // 👇 PUT YOUR SIGNAL PROVIDER DASHBOARD CONTENT HERE
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold">Signal Provider Dashboard</h1>
      <p>Welcome to your dashboard.</p>
    </div>
  );
};

export default SignalProvider;
