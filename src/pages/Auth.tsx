import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, Clock } from "lucide-react";
import { ForexNewsBanner } from "@/components/ForexNewsBanner";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [tradingStyle, setTradingStyle] = useState<"scalp" | "day" | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleTradingStyleSelect = (style: "scalp" | "day") => {
    setTradingStyle(style);
    setShowDialog(true);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradingStyle) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update user's trading style preference
      if (data.user) {
        const { error: updateError } = await supabase
          .from('user_settings')
          .upsert({ 
            user_id: data.user.id, 
            display_user_id: data.user.id.slice(0, 4),
            trading_style: tradingStyle 
          } as any, { 
            onConflict: 'user_id' 
          });

        if (updateError) console.error('Error updating trading style:', updateError);
      }

      toast({
        title: "Success!",
        description: "You've been signed in successfully.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="fixed top-0 left-0 right-0 z-50">
        <ForexNewsBanner dateFilter="today" impactFilter="High" />
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <ForexNewsBanner dateFilter="tomorrow" impactFilter="High" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 py-8 mt-16 mb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Side - Marketing Content */}
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                ProTradeAdvisor
              </h1>
              <p className="text-lg md:text-xl text-foreground font-medium">
                Gain Your Edge in the Market with Professional Trade Analysis
              </p>
              <p className="text-sm md:text-base text-muted-foreground">
                TradeAdvisor provides professional-grade trade analysis. Upload your trading chart and receive precise entry points, stop-loss, and take-profit levels.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold mb-1 text-sm">Professional Chart Analysis</h3>
                <p className="text-xs text-muted-foreground">Our sophisticated system analyzes your trading charts.</p>
              </div>
              
              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold mb-1 text-sm">Precise Trade Signals</h3>
                <p className="text-xs text-muted-foreground">Get exact price levels for entry, stop-loss, and take-profit.</p>
              </div>
              
              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="text-2xl mb-2">⏰</div>
                <h3 className="font-semibold mb-1 text-sm">Multi-Timeframe Confluence</h3>
                <p className="text-xs text-muted-foreground">We confirm trends on higher timeframes for higher probability trades.</p>
              </div>
              
              <div className="p-4 rounded-lg bg-card border border-border">
                <div className="text-2xl mb-2">💡</div>
                <h3 className="font-semibold mb-1 text-sm">Detailed Rationale & Confidence Score</h3>
                <p className="text-xs text-muted-foreground">Understand the 'why' behind every trade and gauge the signal's strength.</p>
              </div>
            </div>

            {/* Limited Offer Banner */}
            <div className="p-5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <h3 className="text-lg md:text-xl font-bold mb-2">Limited Time Offer!</h3>
              <p className="text-sm text-muted-foreground">
                First-time users are provided with five free signals. Contact us to get started and claim your bonus!
              </p>
            </div>
          </div>

          {/* Right Side - Trading Style Selection */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Choose Your Trading Style</h2>
              <p className="text-sm text-muted-foreground">Select the trading approach that matches your strategy</p>
            </div>

            <div className="space-y-4">
              <Card 
                className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
                onClick={() => handleTradingStyleSelect("scalp")}
              >
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10 shrink-0">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">Scalp Trading</CardTitle>
                      <CardDescription className="text-sm">
                        Quick trades, immediate entries, small timeframes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p>✓ Immediate entry signals</p>
                    <p>✓ Near-price entry points</p>
                    <p>✓ 1m, 5m, 30m, 1h timeframes</p>
                    <p>✓ Quick profit targets</p>
                  </div>
                  <Button className="w-full">
                    Start Scalping
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
                onClick={() => handleTradingStyleSelect("day")}
              >
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10 shrink-0">
                      <Clock className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">Day Trading</CardTitle>
                      <CardDescription className="text-sm">
                        Strategic entries at key levels, larger timeframes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p>✓ Pending order signals</p>
                    <p>✓ Key level entry points</p>
                    <p>✓ 4h, daily, weekly timeframes</p>
                    <p>✓ Strategic profit targets</p>
                  </div>
                  <Button className="w-full">
                    Start Day Trading
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Sign In - {tradingStyle === "scalp" ? "Scalp Trading" : "Day Trading"}
            </DialogTitle>
            <DialogDescription>
              Enter your credentials to access your {tradingStyle === "scalp" ? "scalping" : "day trading"} account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Contact admin on Whatsapp +254797657599 to create an account
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
