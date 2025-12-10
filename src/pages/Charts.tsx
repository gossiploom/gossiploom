import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TradingViewWidget } from "@/components/TradingViewWidget";

const Charts = () => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState("D");

  // Map user-friendly labels to TradingView intervals
  const timeframeMap: Record<string, string> = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1H": "60",
    "4H": "240",
    "12H": "720",
    "Daily": "D",
    "Weekly": "W",
    "Monthly": "M",
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm z-50 shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Trading Charts</h1>
                <p className="text-xs text-muted-foreground">Live Market Analysis</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Timeframe:</span>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(timeframeMap).map((tf) => (
                    <SelectItem key={tf} value={timeframeMap[tf]}>
                      {tf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* TradingView Chart - Full Page */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full w-full">
          <TradingViewWidget />
        </div>
      </main>
    </div>
  );
};

export default Charts;
