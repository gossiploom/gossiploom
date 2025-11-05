import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, LogOut, TrendingUp } from "lucide-react";
import { AccountSettings } from "@/components/AccountSettings";
import { PersonalInfoForm } from "@/components/PersonalInfoForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const [accountSize, setAccountSize] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [symbolPreset, setSymbolPreset] = useState("xauusd");
  const [pointsPerUsd, setPointsPerUsd] = useState(100);
  const [tradeType, setTradeType] = useState<"pending" | "immediate">("pending");
  const [userEmail, setUserEmail] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [profileCompleted, setProfileCompleted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadUserData = async () => {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUserEmail(session.user.email || "");

      // Load profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        setName(profile.name || "");
        setPhoneNumber(profile.phone_number || "");
        setBrokerName(profile.broker_name || "");
        setProfileCompleted(profile.profile_completed || false);
      }

      // Load saved settings from localStorage
      const savedAccountSize = localStorage.getItem("accountSize");
      const savedRiskPercent = localStorage.getItem("riskPercent");
      const savedSymbolPreset = localStorage.getItem("symbolPreset");
      const savedPointsPerUsd = localStorage.getItem("pointsPerUsd");
      const savedTradeType = localStorage.getItem("tradeType");
      
      if (savedAccountSize) setAccountSize(Number(savedAccountSize));
      if (savedRiskPercent) setRiskPercent(Number(savedRiskPercent));
      if (savedSymbolPreset) setSymbolPreset(savedSymbolPreset);
      if (savedPointsPerUsd) setPointsPerUsd(Number(savedPointsPerUsd));
      if (savedTradeType) setTradeType(savedTradeType as "pending" | "immediate");
    };

    loadUserData();
  }, [navigate]);

  const handleSaveSettings = () => {
    localStorage.setItem("accountSize", accountSize.toString());
    localStorage.setItem("riskPercent", riskPercent.toString());
    localStorage.setItem("symbolPreset", symbolPreset);
    localStorage.setItem("pointsPerUsd", pointsPerUsd.toString());
    localStorage.setItem("tradeType", tradeType);
    
    toast({
      title: "Settings Saved",
      description: "Your trading preferences have been updated.",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully logged out.",
    });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-trading">
      <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {!profileCompleted && (
            <Card className="p-6 border-destructive/50 bg-destructive/5">
              <div className="flex items-start gap-3 mb-4">
                <div className="rounded-full bg-destructive/10 p-2">
                  <TrendingUp className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Complete Your Profile</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please complete your personal information before using the platform.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Personal Information</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Manage your personal details and account security.
            </p>
            <PersonalInfoForm
              name={name}
              phoneNumber={phoneNumber}
              brokerName={brokerName}
              onNameChange={setName}
              onPhoneNumberChange={setPhoneNumber}
              onBrokerNameChange={setBrokerName}
              onProfileComplete={() => setProfileCompleted(true)}
            />
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Trading Configuration</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Configure your default trading parameters. These settings will be saved and used for all future analyses.
            </p>
            <AccountSettings
              accountSize={accountSize}
              riskPercent={riskPercent}
              symbolPreset={symbolPreset}
              pointsPerUsd={pointsPerUsd}
              tradeType={tradeType}
              onAccountSizeChange={setAccountSize}
              onRiskPercentChange={setRiskPercent}
              onSymbolPresetChange={setSymbolPreset}
              onPointsPerUsdChange={setPointsPerUsd}
              onTradeTypeChange={setTradeType}
            />
            <Button onClick={handleSaveSettings} className="w-full mt-6">
              Save Trading Settings
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
