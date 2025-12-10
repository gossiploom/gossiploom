import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const ProfileCompletionGuard = ({ children }: { children: React.ReactNode }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("user_id", session.user.id)
        .single();

      if (profile && !profile.profile_completed) {
        toast({
          title: "Complete Your Profile",
          description: "Please complete your profile information before using the platform.",
          variant: "destructive",
        });
        navigate("/settings");
      } else {
        setProfileComplete(true);
      }
      
      setIsChecking(false);
    };

    checkProfile();
  }, [navigate, toast]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
