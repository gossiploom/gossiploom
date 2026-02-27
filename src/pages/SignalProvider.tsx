import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSignalProviderCheck } from "@/hooks/useSignalProviderCheck";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Gift, 
  Eye, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  Clock,
  BarChart3,
  Target,
  ArrowRightLeft
} from "lucide-react";

interface Signal {
  id: string;
  currency_pair: string;
  signal_type: "BUY" | "SELL";
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  signal_visibility: "free" | "subscribers" | "both";
  description: string | null;
  outcome: "pending" | "win" | "loss" | "breakeven" | null;
  outcome_pips: number | null;
  created_at: string;
  published_at: string | null;
}

interface ProviderStats {
  total_signals: number;
  wins: number;
  losses: number;
  breakeven: number;
  pending: number;
  win_rate: number;
  total_pips: number;
}

const CURRENCY_PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", 
  "USD/CAD", "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY",
  "XAU/USD", "XAG/USD", "US30", "NAS100", "SPX500"
];

const SignalProvider = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSignalProvider, loading: checkingRole } = useSignalProviderCheck();
  
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [currencyPair, setCurrencyPair] = useState("");
  const [signalType, setSignalType] = useState<"BUY" | "SELL">("BUY");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [description, setDescription] = useState("");
  
  // Outcome dialog state
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [outcome, setOutcome] = useState<"win" | "loss" | "breakeven">("win");
  const [outcomePips, setOutcomePips] = useState("");

  useEffect(() => {
    if (!checkingRole && !isSignalProvider) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "You don't have signal provider permissions.",
        variant: "destructive",
      });
    }
  }, [isSignalProvider, checkingRole, navigate, toast]);

  useEffect(() => {
    if (isSignalProvider) {
      fetchSignals();
      fetchStats();
    }
  }, [isSignalProvider]);

  const fetchSignals = async () => {
    try {
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSignals(data || []);
    } catch (error) {
      console.error("Error fetching signals:", error);
      toast({
        title: "Error",
        description: "Failed to load signals.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("signal_provider_stats")
        .select("*")
        .eq("provider_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const createSignal = async (visibility: "free" | "subscribers" | "both") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("signals").insert({
        provider_id: user.id,
        currency_pair: currencyPair,
        signal_type: signalType,
        entry_price: entryPrice ? parseFloat(entryPrice) : null,
        stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        take_profit: takeProfit ? parseFloat(takeProfit) : null,
        signal_visibility: visibility,
        description: description || null,
        outcome: "pending",
        published_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Signal posted for ${visibility === "free" ? "free users" : visibility === "subscribers" ? "subscribers" : "all users"}!`,
      });

      // Reset form
      setCurrencyPair("");
      setEntryPrice("");
      setStopLoss("");
      setTakeProfit("");
      setDescription("");
      
      fetchSignals();
      fetchStats();
    } catch (error) {
      console.error("Error creating signal:", error);
      toast({
        title: "Error",
        description: "Failed to create signal.",
        variant: "destructive",
      });
    }
  };

  const updateOutcome = async () => {
    if (!selectedSignal) return;

    try {
      const { error } = await supabase
        .from("signals")
        .update({
          outcome,
          outcome_pips: outcomePips ? parseFloat(outcomePips) : null,
        })
        .eq("id", selectedSignal.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Signal outcome updated!",
      });

      setShowOutcomeDialog(false);
      setSelectedSignal(null);
      setOutcomePips("");
      fetchSignals();
      fetchStats();
    } catch (error) {
      console.error("Error updating outcome:", error);
      toast({
        title: "Error",
        description: "Failed to update outcome.",
        variant: "destructive",
      });
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case "free":
        return <Badge className="bg-green-500"><Gift className="w-3 h-3 mr-1" /> Free</Badge>;
      case "subscribers":
        return <Badge className="bg-purple-500"><Users className="w-3 h-3 mr-1" /> Subscribers</Badge>;
      case "both":
        return <Badge className="bg-blue-500"><Eye className="w-3 h-3 mr-1" /> All</Badge>;
      default:
        return null;
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
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  if (checkingRole || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignalProvider) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Signal Provider Dashboard</h1>
          <p className="text-muted-foreground">
            Create and manage your trading signals
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.total_signals}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
                <div className="text-xs text-muted-foreground">Wins</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
                <div className="text-xs text-muted-foreground">Losses</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-500">{stats.breakeven}</div>
                <div className="text-xs text-muted-foreground">Breakeven</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.win_rate}%</div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className={`text-2xl font-bold ${(stats.total_pips || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.total_pips || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Pips</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create Signal Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Create New Signal
              </CardTitle>
              <CardDescription>
                Fill in the signal details and choose where to publish
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency Pair</Label>
                  <Select value={currencyPair} onValueChange={setCurrencyPair}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pair" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_PAIRS.map((pair) => (
                        <SelectItem key={pair} value={pair}>
                          {pair}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Signal Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={signalType === "BUY" ? "default" : "outline"}
                      onClick={() => setSignalType("BUY")}
                      className="flex-1"
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      BUY
                    </Button>
                    <Button
                      type="button"
                      variant={signalType === "SELL" ? "default" : "outline"}
                      onClick={() => setSignalType("SELL")}
                      className="flex-1"
                    >
                      <TrendingDown className="w-4 h-4 mr-1" />
                      SELL
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Entry Price</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    placeholder="1.08500"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stop Loss</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    placeholder="1.08000"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Take Profit</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    placeholder="1.09000"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description / Analysis</Label>
                <Textarea
                  placeholder="Enter your analysis and reasoning for this signal..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="pt-4 space-y-3">
                <Label className="text-sm font-medium">Publish Options:</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => createSignal("free")}
                    disabled={!currencyPair}
                    variant="outline"
                    className="border-green-500 hover:bg-green-500/10"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Free Only
                  </Button>
                  <Button
                    onClick={() => createSignal("subscribers")}
                    disabled={!currencyPair}
                    variant="outline"
                    className="border-purple-500 hover:bg-purple-500/10"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Subscribers Only
                  </Button>
                  <Button
                    onClick={() => createSignal("both")}
                    disabled={!currencyPair}
                    variant="outline"
                    className="border-blue-500 hover:bg-blue-500/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Both
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signal History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Your Signals
              </CardTitle>
              <CardDescription>
                View and update outcomes for your posted signals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="win">Wins</TabsTrigger>
                  <TabsTrigger value="loss">Losses</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                {["pending", "win", "loss", "all"].map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-4">
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {signals
                        .filter((s) => tab === "all" || s.outcome === tab)
                        .map((signal) => (
                          <div
                            key={signal.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{signal.currency_pair}</span>
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
                                {getVisibilityBadge(signal.signal_visibility)}
                              </div>
                              {getOutcomeBadge(signal.outcome)}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                              {signal.entry_price && (
                                <div>
                                  <span className="text-muted-foreground">Entry:</span>{" "}
                                  {signal.entry_price}
                                </div>
                              )}
                              {signal.stop_loss && (
                                <div>
                                  <span className="text-muted-foreground">SL:</span>{" "}
                                  {signal.stop_loss}
                                </div>
                              )}
                              {signal.take_profit && (
                                <div>
                                  <span className="text-muted-foreground">TP:</span>{" "}
                                  {signal.take_profit}
                                </div>
                              )}
                            </div>

                            {signal.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {signal.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {new Date(signal.created_at).toLocaleDateString()}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSignal(signal);
                                  setOutcome(signal.outcome as "win" | "loss" | "breakeven" || "win");
                                  setOutcomePips(signal.outcome_pips?.toString() || "");
                                  setShowOutcomeDialog(true);
                                }}
                              >
                                <ArrowRightLeft className="w-3 h-3 mr-1" />
                                Update Outcome
                              </Button>
                            </div>
                          </div>
                        ))}
                      
                      {signals.filter((s) => tab === "all" || s.outcome === tab).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No signals found
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Outcome Update Dialog */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Signal Outcome</DialogTitle>
            <DialogDescription>
              {selectedSignal && (
                <>
                  {selectedSignal.currency_pair} {selectedSignal.signal_type} signal
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Outcome</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={outcome === "win" ? "default" : "outline"}
                  onClick={() => setOutcome("win")}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Win
                </Button>
                <Button
                  type="button"
                  variant={outcome === "loss" ? "default" : "outline"}
                  onClick={() => setOutcome("loss")}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Loss
                </Button>
                <Button
                  type="button"
                  variant={outcome === "breakeven" ? "default" : "outline"}
                  onClick={() => setOutcome("breakeven")}
                  className="flex-1"
                >
                  <MinusCircle className="w-4 h-4 mr-1" />
                  Breakeven
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pips Gained/Lost</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 50 or -30"
                value={outcomePips}
                onChange={(e) => setOutcomePips(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use positive for profit, negative for loss
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowOutcomeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateOutcome}>Update Outcome</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignalProvider;
