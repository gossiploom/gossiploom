import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TrendingUp, Briefcase, Target, BarChart, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ForexNewsBanner } from "@/components/ForexNewsBanner";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Welcome back!", description: "Successfully logged in." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-trading flex flex-col">
      {/* Top News Banner - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <ForexNewsBanner dateFilter="today" impactFilter="High" />
      </div>
      
      {/* Bottom News Banner - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <ForexNewsBanner dateFilter="tomorrow" impactFilter="High" />
      </div>
      
      <div className="flex-1 flex flex-col md:grid md:grid-cols-2 pt-[60px] pb-[60px]">
      <div className="flex flex-col justify-center items-start p-6 md:p-12 text-white">
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
                    <h3 className="font-semibold text-sm md:text-base">Detailed Rationale & Confidence Score</h3>
                    <p className="text-muted-foreground text-xs md:text-sm">Understand the 'why' behind every trade and gauge the signal's strength.</p>
                </div>
            </div>
        </div>

        <div className="mt-8 md:mt-12 p-4 md:p-6 bg-primary/10 border border-primary/30 rounded-lg">
            <h3 className="text-lg md:text-2xl font-bold text-primary">Limited Time Offer!</h3>
            <p className="text-sm md:text-lg mt-2">First-time users are provided with <span className="font-bold">five free signals</span>. Contact us to get started and claim your bonus!</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-4">
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
                <p className="text-xs text-center text-muted-foreground pt-2">
                    Contact admin on Whatsapp +254797657599 to create an account and receive your Login Details.
                </p>
            </form>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Auth;
