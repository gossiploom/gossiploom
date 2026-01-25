import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChartUpload } from "@/components/ChartUpload";
import { AccountSettings } from "@/components/AccountSettings";
import { TradeSignal } from "@/components/TradeSignal";
import { Button } from "@/components/ui/button";
import { TrendingUp, Settings2, FileText, Loader2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NewsScrollingBanner } from "@/components/NewsScrollingBanner";
import { SlideInMenu } from "@/components/SlideInMenu";
import { ProfileCompletionGuard } from "@/components/ProfileCompletionGuard";
import { Footer } from "@/components/Footer";
import { useVisitorTracking } from '@/hooks/useVisitorTracking';

const Index = () => {
useVisitorTracking("Home");

  const [accountSize, setAccountSize] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [symbolPreset, setSymbolPreset] = useState("xauusd");
  const [pointsPerUsd, setPointsPerUsd] = useState(100);
  const [tradeType, setTradeType] = useState<"pending" | "immediate">("pending");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [signal, setSignal] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [analysisLimit, setAnalysisLimit] = useState(0);
  const [uniqueIdentifier, setUniqueIdentifier] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [pendingOutcomes, setPendingOutcomes] = useState(0);
  const [successfulReferrals, setSuccessfulReferrals] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication and load analysis count
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load user settings, profile, and count analyses
      try {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("analysis_limit")
          .eq("user_id", session.user.id)
          .single();

        if (settings) {
          setAnalysisLimit(settings.analysis_limit);
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("unique_identifier, name")
          .eq("user_id", session.user.id)
          .single();

        if (profile) {
          setUniqueIdentifier(profile.unique_identifier);
          setUserName(profile.name);
        }

        // Get successful referrals count
        const { data: referrals } = await supabase
          .from("referrals")
          .select("has_purchased")
          .eq("referrer_id", session.user.id);

        if (referrals) {
          setSuccessfulReferrals(referrals.filter(r => r.has_purchased).length);
        }

        const { count } = await supabase
          .from("trades")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id);

        setAnalysisCount(count || 0);

        // Check for pending outcomes
        const { data: tradesWithoutOutcome } = await supabase
          .from("trades")
          .select("id")
          .eq("user_id", session.user.id)
          .is("outcome", null);

        const pendingCount = tradesWithoutOutcome?.length || 0;
        setPendingOutcomes(pendingCount);

        // Show welcome message
        setTimeout(() => setShowWelcome(false), 5000);

        // Show warning if running low
        const remaining = (settings?.analysis_limit || 25) - (count || 0);
        if (remaining > 0 && remaining <= 15) {
          toast({
            title: "Analysis Slots Running Low",
            description: `You have ${remaining} analysis slots remaining out of ${settings?.analysis_limit || 25}.`,
            variant: "default",
          });
        }

        // Remind user to check trade outcomes
        if (pendingCount > 0) {
          setTimeout(() => {
            toast({
              title: "Trade Outcomes Pending",
              description: `You have ${pendingCount} trade(s) without outcomes. Please update them in your History page.`,
              variant: "default",
            });
          }, 5000);
        }
      } catch (error) {
        console.error("Error loading analysis count:", error);
      }
    });

    // Load saved settings
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
    
    // load persisted signal
    const savedSignal = localStorage.getItem("currentSignal");
    if (savedSignal) {
        try {
            setSignal(JSON.parse(savedSignal));
        } catch (error) {
            console.error("Error loading saved signal:", error);
            localStorage.removeItem("currentSignal");
        }
    }
  }, [navigate, toast]);

  // Periodic reminder for pending outcomes
  useEffect(() => {
    if (pendingOutcomes === 0) return;

    const reminderInterval = setInterval(() => {
      toast({
        title: "Reminder: Update Trade Outcomes",
        description: `You still have ${pendingOutcomes} trade(s) waiting for outcome updates. Please visit the History page to mark them as won or lost.`,
        variant: "default",
      });
    }, 300000); // Remind every 5 minutes

    return () => clearInterval(reminderInterval);
  }, [pendingOutcomes, toast]);

  const riskAmount = (accountSize * riskPercent) / 100;

  const handleFilesUpload = async (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Sign Out Failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No Charts",
        description: "Please upload at least one chart to analyze.",
        variant: "destructive",
      });
      return;
    }

    // Check analysis limit
    if (analysisCount >= analysisLimit) {
      toast({
        title: "Analysis Limit Reached",
        description: `You have used all ${analysisLimit} analysis slots. Please contact admin to reset your account.`,
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setSignal(null);
    // The critical bug fix: localStorage.setItem must be AFTER data is available

    toast({
      title: "Analyzing Charts",
      description: `Trade Advisor is Processing ${uploadedFiles.length} chart(s) Be Patient for the Signal...`,
    });

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      formData.append('fileCount', uploadedFiles.length.toString());
      formData.append('accountSize', accountSize.toString());
      formData.append('riskPercent', riskPercent.toString());
      formData.append('pointsPerUsd', pointsPerUsd.toString());
      formData.append('tradeType', tradeType);

      const { data, error } = await supabase.functions.invoke('analyze-chart', {
        body: formData,
      });

      if (error) {
        console.error('Analysis error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Check if trade is not viable
      if (data.notViable) {
        toast({
          title: "No Viable Trade Found",
          description: data.message || "The current market conditions don't present a viable trade setup at this moment. Please try again later when better opportunities emerge.",
          variant: "default",
        });
        setIsAnalyzing(false);
        return;
      }

      setSignal(data);
      // Correctly saving signal AFTER a successful analysis response
      localStorage.setItem("currentSignal", JSON.stringify(data));
      
      // Save the analysis to the database
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error: insertError } = await supabase
          .from("trades")
          .insert([{
            user_id: session.user.id,
            symbol: data.symbol,
            direction: data.direction,
            timeframe: Array.isArray(data.timeframes) ? data.timeframes.join(", ") : data.timeframe || "N/A",
            entry: data.entry,
            stop_loss: data.stopLoss,
            take_profit: data.takeProfit,
            confidence: data.confidence,
            risk_amount: data.riskAmount,
            reward_amount: data.rewardAmount,
            rationale: data.rationale || [],
            invalidation: data.invalidation || "",
            news_items: data.newsItems || [],
            status: data.status || 'pending',
            trade_type: tradeType,
            activated: tradeType === 'pending' ? false : null
          }]);

        if (insertError) {
          console.error("Error saving analysis:", insertError);
          toast({
            title: "Warning",
            description: "Analysis completed but couldn't save to history.",
            variant: "default",
          });
        }
      }
      
      // Increment count
      const newCount = analysisCount + 1;
      setAnalysisCount(newCount);
      const remaining = analysisLimit - newCount;

      toast({
        title: "Analysis Complete",
        description: remaining > 0 
          ? `${data.direction} signal for ${data.symbol}. ${remaining} analyses remaining.`
          : "Analysis complete. You have used all your analysis slots.",
      });

      // Show warning if running low
      if (remaining > 0 && remaining <= 15) {
        setTimeout(() => {
          toast({
            title: "Running Low on Analyses Slots",
            description: `Only ${remaining} analysis slots remaining out of ${analysisLimit}.`,
            variant: "default",
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error analyzing chart:', error);
      // Clear localStorage if analysis fails to prevent loading bad data on refresh
      localStorage.removeItem("currentSignal"); 
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze charts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ProfileCompletionGuard>
      <div className="min-h-screen bg-gradient-trading">
      <NewsScrollingBanner position="top" />
      <NewsScrollingBanner position="bottom" showNextDay />
      <SlideInMenu />
      
      {/* Welcome Message */}
      {showWelcome && userName && (
        <div className="fixed top-15 left-1/3 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-2800">
          <div className="bg-primary text-primary-foreground px-8 py-4 rounded-lg shadow-2xl border-2 border-primary-foreground/20 animate-pulse">
            <p className="text-lg font-bold text-center">
              Welcome back, {userName}! 🎯
            </p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-sm mt-16 mb-16">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">TradeAdvisor</h1>
              <p className="text-xs text-muted-foreground">Professional Trade Analysis</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Upload & Settings */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Analysis Slots Section */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">ANALYSIS SLOTS</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">User ID:</span>
                  <span className="text-sm font-semibold text-foreground">{uniqueIdentifier || "----"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Slots Issued:</span>
                  <span className="text-sm font-semibold text-foreground">{analysisLimit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Slots Used:</span>
                  <span className="text-sm font-semibold text-foreground">{analysisCount}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Slots Remaining:</span>
                  <span className="text-lg font-bold text-primary">{analysisLimit - analysisCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Successful Referrals:</span>
                  <span className="text-sm font-semibold text-foreground">{successfulReferrals}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Step 1: Account Configuration
              </h2>
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
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Step 2: Upload Chart
              </h2>
              <ChartUpload 
                onFilesUpload={handleFilesUpload}
                uploadedFiles={uploadedFiles}
              />
              
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || analysisCount >= analysisLimit}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing ? "Analyzing..." : "Analyze Charts"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {analysisCount} / {analysisLimit} analyses used
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Signal */}
          <div className="lg:col-span-7 xl:col-span-8">
            {isAnalyzing ? (
              <div className="flex items-center justify-center h-full min-h-[500px]">
                <div className="text-center space-y-4 p-8">
                  <div className="inline-block p-6 bg-secondary rounded-full animate-pulse">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Analyzing Chart...
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Trade Advisor is analyzing your chart and generating trade signals. This may take a moment.
                  </p>
                </div>
              </div>
            ) : signal ? (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Trade Signal Generated
                </h2>
                <TradeSignal
                  signal={signal}
                  riskAmount={riskAmount}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[500px]">
                <div className="text-center space-y-4 p-8">
                  <div className="inline-block p-6 bg-secondary rounded-full">
                    <TrendingUp className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Ready to Analyze
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Configure your account settings and upload minimum of 3 charts to receive a Trade Advisor-powered trade signal with precise entry, stop-loss, and take-profit levels. Best charts to upload are 5M, 15M, 1H, 4H and 6H or 8H or 12H or 1D
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    </ProfileCompletionGuard>
  );
};

export default Index;
