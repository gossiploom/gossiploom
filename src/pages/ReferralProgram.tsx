import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SlideInMenu } from "@/components/SlideInMenu";
import { Footer } from "@/components/Footer";
import { ProfileCompletionGuard } from "@/components/ProfileCompletionGuard";
import { Copy, Users, Gift, Trophy, ArrowLeft, CheckCircle2, Star } from "lucide-react";

interface ReferralTier {
  referrals: number;
  reward: string;
  slots: number;
  icon: React.ReactNode;
}

const referralTiers: ReferralTier[] = [
  { referrals: 5, reward: "Bronze", slots: 10, icon: <Star className="h-5 w-5 text-amber-600" /> },
  { referrals: 10, reward: "Silver", slots: 25, icon: <Star className="h-5 w-5 text-gray-400" /> },
  { referrals: 20, reward: "Gold", slots: 60, icon: <Star className="h-5 w-5 text-yellow-500" /> },
  { referrals: 35, reward: "Platinum", slots: 120, icon: <Trophy className="h-5 w-5 text-purple-500" /> },
  { referrals: 50, reward: "Diamond", slots: 200, icon: <Trophy className="h-5 w-5 text-cyan-400" /> },
];

const ReferralProgram = () => {
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralLink, setReferralLink] = useState<string>("");
  const [successfulReferrals, setSuccessfulReferrals] = useState<number>(0);
  const [totalReferrals, setTotalReferrals] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadReferralData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      try {
        // Get user's referral code
        const { data: profile } = await supabase
          .from("profiles")
          .select("referral_code")
          .eq("user_id", session.user.id)
          .single();

        if (profile?.referral_code) {
          setReferralCode(profile.referral_code);
          setReferralLink(`https://www.tradeadvisor.live/auth?ref=${profile.referral_code}`);
        }

        // Get successful referrals count
        const { data: referrals } = await supabase
          .from("referrals")
          .select("has_purchased")
          .eq("referrer_id", session.user.id);

        if (referrals) {
          setTotalReferrals(referrals.length);
          setSuccessfulReferrals(referrals.filter(r => r.has_purchased).length);
        }
      } catch (error) {
        console.error("Error loading referral data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReferralData();
  }, [navigate]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`,
    });
  };

  const getCurrentTier = () => {
    for (let i = referralTiers.length - 1; i >= 0; i--) {
      if (successfulReferrals >= referralTiers[i].referrals) {
        return referralTiers[i];
      }
    }
    return null;
  };

  const getNextTier = () => {
    for (const tier of referralTiers) {
      if (successfulReferrals < tier.referrals) {
        return tier;
      }
    }
    return null;
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  return (
    <ProfileCompletionGuard>
      <div className="min-h-screen bg-gradient-trading">
        <SlideInMenu />
        
        <div className="container mx-auto px-4 py-8 pt-20">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Referral Program</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Invite your friends to TradeAdvisor and earn free analysis slots when they sign up and make a purchase!
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardDescription>Total Referrals</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{totalReferrals}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardDescription>Successful Referrals</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{successfulReferrals}</p>
                  <p className="text-xs text-muted-foreground">Made purchases</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardDescription>Current Tier</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentTier ? (
                    <div className="flex items-center gap-2">
                      {currentTier.icon}
                      <span className="text-2xl font-bold text-foreground">{currentTier.reward}</span>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-muted-foreground">None yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Referral Link Section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Your Referral Link
                </CardTitle>
                <CardDescription>
                  Share this link with friends. When they sign up and purchase analysis slots, you'll earn rewards!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Referral Code</label>
                  <div className="flex gap-2">
                    <Input 
                      value={referralCode} 
                      readOnly 
                      className="font-mono text-lg"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => copyToClipboard(referralCode, "Referral code")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Referral Link</label>
                  <div className="flex gap-2">
                    <Input 
                      value={referralLink} 
                      readOnly 
                      className="text-sm"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => copyToClipboard(referralLink, "Referral link")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress to Next Tier */}
            {nextTier && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Progress to {nextTier.reward} Tier</CardTitle>
                  <CardDescription>
                    {nextTier.referrals - successfulReferrals} more successful referrals to unlock {nextTier.slots} free slots!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-500"
                      style={{ width: `${(successfulReferrals / nextTier.referrals) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {successfulReferrals} / {nextTier.referrals} referrals
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Reward Tiers */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Reward Tiers
                </CardTitle>
                <CardDescription>
                  Earn free analysis slots as you refer more friends who make purchases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referralTiers.map((tier, index) => (
                    <div 
                      key={tier.reward}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        successfulReferrals >= tier.referrals 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-secondary/50 border-border'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          successfulReferrals >= tier.referrals 
                            ? 'bg-primary/20' 
                            : 'bg-secondary'
                        }`}>
                          {tier.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{tier.reward} Tier</p>
                          <p className="text-sm text-muted-foreground">
                            {tier.referrals} successful referrals
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{tier.slots} Free Slots</p>
                        {successfulReferrals >= tier.referrals && (
                          <div className="flex items-center gap-1 text-primary text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            Unlocked
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Eligibility:</strong> All registered TradeAdvisor users are eligible to participate in the referral program.
                  </li>
                  <li>
                    <strong className="text-foreground">Successful Referral Definition:</strong> A referral is considered "successful" only when the referred user creates an account using your referral link AND makes their first purchase of analysis slots.
                  </li>
                  <li>
                    <strong className="text-foreground">Unique Referrals Only:</strong> Each referred user can only be counted once. Self-referrals or duplicate accounts are not permitted and will result in disqualification.
                  </li>
                  <li>
                    <strong className="text-foreground">Reward Distribution:</strong> Free analysis slots are automatically credited to your account once you reach a reward tier milestone. Rewards are cumulative across tiers.
                  </li>
                  <li>
                    <strong className="text-foreground">No Cash Equivalent:</strong> Referral rewards cannot be exchanged for cash or transferred to other users.
                  </li>
                  <li>
                    <strong className="text-foreground">Fraud Prevention:</strong> Any fraudulent activity, including creating fake accounts or manipulating the referral system, will result in immediate account suspension and forfeiture of all rewards.
                  </li>
                  <li>
                    <strong className="text-foreground">Program Changes:</strong> TradeAdvisor reserves the right to modify, suspend, or terminate the referral program at any time without prior notice.
                  </li>
                  <li>
                    <strong className="text-foreground">Validity:</strong> Referral links do not expire. However, the referred user must use the link during their initial signup to be counted.
                  </li>
                  <li>
                    <strong className="text-foreground">One Account Per Person:</strong> Only one account per person/IP address is allowed. Violations will result in permanent ban from the platform.
                  </li>
                  <li>
                    <strong className="text-foreground">Reward Tiers:</strong>
                    <ul className="list-disc list-inside ml-4 mt-2">
                      <li>Bronze (5 referrals): 10 free analysis slots</li>
                      <li>Silver (10 referrals): 25 free analysis slots</li>
                      <li>Gold (20 referrals): 60 free analysis slots</li>
                      <li>Platinum (35 referrals): 120 free analysis slots</li>
                      <li>Diamond (50 referrals): 200 free analysis slots</li>
                    </ul>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Footer />
      </div>
    </ProfileCompletionGuard>
  );
};

export default ReferralProgram;