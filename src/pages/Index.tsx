import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChartUpload } from "@/components/ChartUpload";
import { AccountSettings } from "@/components/AccountSettings";
import { TradeSignal } from "@/components/TradeSignal";
import { Button } from "@/components/ui/button";
import { TrendingUp, Settings2, FileText, Loader2, LogOut, Newspaper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ForexNewsBanner } from "@/components/ForexNewsBanner";

const Index = () => {
  const [accountSize, setAccountSize] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [symbolPreset, setSymbolPreset] = useState("xauusd");
  const [pointsPerUsd, setPointsPerUsd] = useState(100);
  const [tradeType, setTradeType] = useState<"pending" | "immediate">("pending");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [signal, setSignal] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [analysisLimit, setAnalysisLimit] = useState(30);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication and load analysis count
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load user settings and count analyses
      try {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("analysis_limit")
          .eq("user_id", session.user.id)
          .single();

        if (settings) {
          setAnalysisLimit(settings.analysis_limit);
        }

        const { count } = await supabase
          .from("trades")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id);

        setAnalysisCount(count || 0);

        // Show warning if running low
        const remaining = (settings?.analysis_limit || 25) - (count || 0);
        if (remaining > 0 && remaining <= 15) {
          toast({
            title: "Analysis Slots Running Low",
            description: `You have ${remaining} analysis slots remaining out of ${settings?.analysis_limit || 25}.`,
            variant: "default",
          });
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

  const riskAmount = (accountSize * riskPercent) / 100;
  const rewardAmount = riskAmount * 3;

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

      setSignal(data);
      // Correctly saving signal AFTER a successful analysis response
      localStorage.setItem("currentSignal", JSON.stringify(data));
      
      // Save the analysis to the database
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error: insertError } = await supabase
          .from("trades")
          .insert({
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
          });

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
    <div className="min-h-screen bg-gradient-trading">
      {/* Fixed News Banners */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <ForexNewsBanner dateFilter="today" impactFilter="High" />
        <ForexNewsBanner dateFilter="tomorrow" impactFilter="High" />
      </div>
      
      {/* Header - adjusted for fixed banners */}
      <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-[120px] z-40 mt-[120px]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">TradeAdvisor</h1>
                <p className="text-xs text-muted-foreground">Professional Trade Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/news")}>
                <Newspaper className="h-4 w-4 mr-2" />
                News
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                <Settings2 className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/history")}>
                <FileText className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Settings */}
          <div className="lg:col-span-1 space-y-6">
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
          <div className="lg:col-span-2">
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
                  rewardAmount={rewardAmount}
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
                    Configure your account settings and upload a chart to receive a Trade Advisor-powered trade signal with precise entry, stop-loss, and take-profit levels.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
