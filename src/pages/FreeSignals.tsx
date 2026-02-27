import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Gift, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  Clock,
  Target,
  ArrowRight,
  BarChart3,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { NewsScrollingBanner } from "@/components/NewsScrollingBanner";

interface Signal {
  id: string;
  currency_pair: string;
  signal_type: "BUY" | "SELL";
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  description: string | null;
  outcome: "pending" | "win" | "loss" | "breakeven" | null;
  outcome_pips: number | null;
  created_at: string;
  published_at: string | null;
}

const FreeSignals = () => {
  const navigate = useNavigate();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    wins: 0,
    losses: 0,
    pending: 0,
    winRate: 0,
  });

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      // Fetch free signals (visible to everyone including anonymous users)
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .in("signal_visibility", ["free", "both"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const signalsData = data || [];
      setSignals(signalsData);

      // Calculate stats
      const total = signalsData.length;
      const wins = signalsData.filter((s) => s.outcome === "win").length;
      const losses = signalsData.filter((s) => s.outcome === "loss").length;
      const pending = signalsData.filter((s) => s.outcome === "pending" || !s.outcome).length;
      const winRate = total > 0 ? Math.round((wins / (wins + losses)) * 100) || 0 : 0;

      setStats({ total, wins, losses, pending, winRate });
    } catch (error) {
      console.error("Error fetching signals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case "win":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Win</Badge>;
      case "loss":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Loss</Badge>;
      case "breakeven":
        return <Badge className="bg-yellow-500"><MinusCircle className="w-3 h-3 mr-1" /> Breakeven</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Active</Badge>;
    }
  };

  const activeSignals = signals.filter((s) => s.outcome === "pending" || !s.outcome);
  const completedSignals = signals.filter((s) => s.outcome && s.outcome !== "pending");

  return (
    <div className="min-h-screen bg-background">
      <NewsScrollingBanner />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-green-500 text-white">
              <Gift className="w-4 h-4 mr-1" />
              Free Signals
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Free Forex Trading Signals
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Access professional trading signals completely free. No account required.
              Upgrade to our subscription plan for exclusive premium signals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/purchase")}>
                <Target className="w-5 h-5 mr-2" />
                Get Premium Signals
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                <ArrowRight className="w-5 h-5 mr-2" />
                Create Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Signals</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-500">{stats.wins}</div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-red-500">{stats.losses}</div>
              <div className="text-sm text-muted-foreground">Losses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold">{stats.winRate}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-500">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
        </div>

        {/* Signals Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="active">
              <Clock className="w-4 h-4 mr-2" />
              Active Signals ({activeSignals.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              <BarChart3 className="w-4 h-4 mr-2" />
              Signal History ({completedSignals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-8">
            {activeSignals.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Active Signals</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no active free signals at the moment.
                  </p>
                  <Button onClick={() => navigate("/purchase")}>
                    View Premium Signals
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeSignals.map((signal) => (
                  <Card key={signal.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold">{signal.currency_pair}</span>
                          <Badge
                            variant={signal.signal_type === "BUY" ? "default" : "destructive"}
                            className="text-sm"
                          >
                            {signal.signal_type === "BUY" ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {signal.signal_type}
                          </Badge>
                        </div>
                        {getOutcomeBadge(signal.outcome)}
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Posted {new Date(signal.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        {signal.entry_price && (
                          <div className="bg-muted p-2 rounded text-center">
                            <div className="text-xs text-muted-foreground">Entry</div>
                            <div className="font-semibold">{signal.entry_price}</div>
                          </div>
                        )}
                        {signal.stop_loss && (
                          <div className="bg-red-500/10 p-2 rounded text-center">
                            <div className="text-xs text-muted-foreground">Stop Loss</div>
                            <div className="font-semibold text-red-500">{signal.stop_loss}</div>
                          </div>
                        )}
                        {signal.take_profit && (
                          <div className="bg-green-500/10 p-2 rounded text-center">
                            <div className="text-xs text-muted-foreground">Take Profit</div>
                            <div className="font-semibold text-green-500">{signal.take_profit}</div>
                          </div>
                        )}
                      </div>
                      {signal.description && (
                        <div className="bg-muted/50 p-3 rounded">
                          <p className="text-sm text-muted-foreground">{signal.description}</p>
                        </div>
                      )}
                      <Badge variant="outline" className="w-full justify-center">
                        <Gift className="w-3 h-3 mr-1" />
                        Free Signal
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-8">
            {completedSignals.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
                  <p className="text-muted-foreground">
                    Completed signals will appear here once they are updated with outcomes.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedSignals.map((signal) => (
                  <Card key={signal.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{signal.currency_pair}</span>
                            <Badge
                              variant={signal.signal_type === "BUY" ? "default" : "destructive"}
                            >
                              {signal.signal_type === "BUY" ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {signal.signal_type}
                            </Badge>
                          </div>
                          {getOutcomeBadge(signal.outcome)}
                          {signal.outcome_pips !== null && (
                            <Badge 
                              variant="outline" 
                              className={signal.outcome_pips >= 0 ? "text-green-500" : "text-red-500"}
                            >
                              {signal.outcome_pips >= 0 ? "+" : ""}{signal.outcome_pips} pips
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(signal.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Want More Signals?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Upgrade to our premium subscription to access exclusive subscriber-only signals,
                detailed analysis, and priority notifications.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/purchase")}>
                  <Target className="w-5 h-5 mr-2" />
                  View Pricing Plans
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/signals")}>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FreeSignals;
