import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PersonalInfoFormProps {
  name: string;
  phoneNumber: string;
  brokerName: string;
  onNameChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onBrokerNameChange: (value: string) => void;
  onProfileComplete: () => void;
}

export const PersonalInfoForm = ({
  name,
  phoneNumber,
  brokerName,
  onNameChange,
  onPhoneNumberChange,
  onBrokerNameChange,
  onProfileComplete,
}: PersonalInfoFormProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsChangingPassword(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Password updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSaveProfile = async () => {
    if (!name || !phoneNumber) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in your name and phone number.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        name,
        phone_number: phoneNumber,
        broker_name: brokerName,
        profile_completed: true,
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile Saved",
        description: "Your personal information has been updated.",
      });
      onProfileComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-foreground">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder="+1234567890"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="broker" className="text-foreground">
            Broker Name <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <Input
            id="broker"
            type="text"
            value={brokerName}
            onChange={(e) => onBrokerNameChange(e.target.value)}
            placeholder="Enter your broker's name"
          />
        </div>

        <Button onClick={handleSaveProfile} className="w-full">
          Save Personal Information
        </Button>
      </div>

      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
        
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-foreground">
            New Password
          </Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-foreground">
            Confirm New Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>

        <Button
          onClick={handlePasswordChange}
          disabled={isChangingPassword}
          variant="secondary"
          className="w-full"
        >
          {isChangingPassword ? "Updating..." : "Change Password"}
        </Button>
      </div>
    </div>
  );
};
