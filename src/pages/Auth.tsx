import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TrendingUp, Briefcase, Target, BarChart, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NewsScrollingBanner } from "@/components/NewsScrollingBanner";
import { Footer } from "@/components/Footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch user IP address
    const fetchIp = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setUserIp(data.ip);
      } catch (error) {
        console.error("Failed to fetch IP:", error);
      }
    };
    fetchIp();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !signupEmail.trim() || !phoneNumber.trim()) {
      toast({ title: "Missing Information", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setSignupLoading(true);
    try {
      const response = await supabase.functions.invoke('send-account-request', {
        body: { 
          fullName, 
          email: signupEmail, 
          phoneNumber,
          ipAddress: userIp
        }
      });
      
      if (response.error) {
        const errorData = response.error;
        throw new Error(errorData.message || "Request failed");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      toast({ 
        title: "Request Submitted Successfully", 
        description: "You will receive your login details via WhatsApp and the email address you provided." 
      });
      setShowCreateAccount(false);
      setFullName("");
      setSignupEmail("");
      setPhoneNumber("");
    } catch (error: any) {
      console.error("Account request error:", error);
      toast({ 
        title: "Request Failed", 
        description: error.message || "Unable to submit request. Please try again later.", 
        variant: "destructive" 
      });
    } finally {
      setSignupLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Update last login IP
      if (userIp && data.user) {
        await supabase
          .from("profiles")
          .update({ last_login_ip: userIp })
          .eq("user_id", data.user.id);
      }

      toast({ title: "Welcome back!", description: "Successfully logged in." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-trading flex flex-col md:grid md:grid-cols-2">
      <NewsScrollingBanner position="top" />
      <NewsScrollingBanner position="bottom" showNextDay />
      <div className="flex flex-col justify-center items-start p-6 md:p-12 text-white mt-16 mb-16">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="inline-block p-2 md:p-3 bg-primary/20 rounded-lg">
                <TrendingUp className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold">TradeAdvisor</h1>
        </div>

        <h2 className="text-xl md:text-3xl font-semibold mb-3 md:mb-4">Gain Your Edge in the Market with Professional Trade Analysis.</h2>
        <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8">
            TradeAdvisor provides professional-grade trade analysis. Upload your trading chart and receive precise entry points, stop-loss, and take-profit levels.
        </p>

        <div className="space-y-4 md:space-y-6 text-sm md:text-lg">
            <div className="flex items-start gap-3 md:gap-4">
                <Briefcase className="h-5 w-5 md:h-7 md:w-7 text-primary mt-1 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-sm md:text-base">Professional Chart Analysis</h3>
                    <p className="text-muted-foreground text-xs md:text-sm">Our sophisticated system analyzes your trading charts.</p>
                </div>
            </div>
            <div className="flex items-start gap-3 md:gap-4">
                <Target className="h-5 w-5 md:h-7 md:w-7 text-primary mt-1 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-sm md:text-base">Precise Trade Signals</h3>
                    <p className="text-muted-foreground text-xs md:text-sm">Get exact price levels for entry, stop-loss, and take-profit.</p>
                </div>
            </div>
            <div className="flex items-start gap-3 md:gap-4">
                <BarChart className="h-5 w-5 md:h-7 md:w-7 text-primary mt-1 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-sm md:text-base">Multi-Timeframe Confluence</h3>
                    <p className="text-muted-foreground text-xs md:text-sm">We confirm trends on higher timeframes for higher probability trades.</p>
                </div>
            </div>
             <div className="flex items-start gap-3 md:gap-4">
                <Award className="h-5 w-5 md:h-7 md:w-7 text-primary mt-1 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-sm md:text-base">Detailed Rationale & Confidence Rating Score</h3>
                    <p className="text-muted-foreground text-xs md:text-sm">Understand the 'why' behind every trade and gauge the signal's strength.</p>
                </div>
            </div>
        </div>

        <div className="mt-8 md:mt-12 p-4 md:p-6 bg-primary/10 border border-primary/30 rounded-lg">
            <h3 className="text-lg md:text-2xl font-bold text-primary">Ready to Trade Smarter?</h3>
            <p className="text-sm md:text-lg mt-2">Join other traders making informed decisions. Create your account today and unlock <span className="font-bold">professional-grade analysis</span> to elevate your trading journey!</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 mt-16 mb-16">
        <Card className="w-full max-w-md p-8 space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-block p-3 bg-primary/10 rounded-lg mb-2">
                    <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">TradeAdvisor</h1>
                <p className="text-muted-foreground">Sign in to your account</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="............." value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="pt-4 text-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowCreateAccount(true)}
                  >
                    Create Account
                  </Button>
                </div>
            </form>
        </Card>
      </div>

      <Dialog open={showCreateAccount} onOpenChange={setShowCreateAccount}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>
              Fill in your details below to request an account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Names</Label>
              <Input 
                id="fullName" 
                type="text" 
                placeholder="John Doe" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signupEmail">Email Address</Label>
              <Input 
                id="signupEmail" 
                type="email" 
                placeholder="your@email.com" 
                value={signupEmail} 
                onChange={(e) => setSignupEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input 
                id="phoneNumber" 
                type="tel" 
                placeholder="+(XXX) XXX XXX XXX" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={signupLoading}>
              {signupLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <div className="col-span-1 md:col-span-2">
        <Footer />
      </div>
    </div>
  );
};

export default Auth;
