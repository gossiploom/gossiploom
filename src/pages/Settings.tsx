import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogOut, TrendingUp, User } from "lucide-react";
import { AccountSettings } from "@/components/AccountSettings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NewsScrollingBanner } from "@/components/NewsScrollingBanner";
import { SlideInMenu } from "@/components/SlideInMenu";

const Settings = () => {
  const [accountSize, setAccountSize] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [symbolPreset, setSymbolPreset] = useState("xauusd");
  const [pointsPerUsd, setPointsPerUsd] = useState(100);
  const [tradeType, setTradeType] = useState<"pending" | "immediate">("pending");
  const [userEmail, setUserEmail] = useState("");
  
  // Profile fields
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [uniqueIdentifier, setUniqueIdentifier] = useState("");
  const [profileCompleted, setProfileCompleted] = useState(false);
  
  // Password change fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
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
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      const { data: settings } = await supabase
        .from("user_settings")
        .select("display_user_id")
        .eq("user_id", session.user.id)
        .single();
        
      if (profile) {
        setName(profile.name || "");
        setPhoneNumber(profile.phone_number || "");
        setBrokerName(profile.broker_name || "");
        setProfileCompleted(profile.profile_completed || false);
      }
      if (settings) {
        setUniqueIdentifier(settings.display_user_id || "");
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

  const handleSaveProfile = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in your name and phone number.",
        variant: "destructive",
      });
      return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        phone_number: phoneNumber.trim(),
        broker_name: brokerName.trim() || null,
        profile_completed: true,
      })
      .eq("user_id", session.user.id);
      
    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile information.",
        variant: "destructive",
      });
      return;
    }
    
    setProfileCompleted(true);
    toast({
      title: "Profile Saved",
      description: "Your personal information has been updated.",
    });
  };
  
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Password Required",
        description: "Please enter and confirm your new password.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to change password.",
        variant: "destructive",
      });
      return;
    }
    
    setNewPassword("");
    setConfirmPassword("");
    toast({
      title: "Password Changed",
      description: "Your password has been successfully updated.",
    });
  };
  
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
      <NewsScrollingBanner position="top" />
      <NewsScrollingBanner position="bottom" showNextDay />
      <SlideInMenu />
      
      <header className="border-b border-border bg-background/50 backdrop-blur-sm mt-16 mb-16">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* User Profile Information */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
                {uniqueIdentifier && (
                  <p className="text-xs text-muted-foreground">User ID: {uniqueIdentifier}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {!profileCompleted && (
                <span className="text-destructive font-medium">* Required before using the platform. </span>
              )}
              Manage your personal details and account information.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="broker">Broker Name (Optional)</Label>
                <Input
                  id="broker"
                  type="text"
                  placeholder="Enter your broker name"
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                />
              </div>
            </div>
            
            <Button onClick={handleSaveProfile} className="w-full mt-6">
              Save Profile Information
            </Button>
          </Card>
          
          {/* Password Change */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Change Password</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Update your account password. Password must be at least 6 characters long.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            
            <Button onClick={handleChangePassword} className="w-full mt-6">
              Change Password
            </Button>
          </Card>
          
          {/* Trading Account Configuration */}
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
