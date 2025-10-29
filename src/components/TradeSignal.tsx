import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Target, Shield, Download, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { DerivTradeDialog } from "@/components/DerivTradeDialog";

interface TradeSignalProps {
  signal: {
    direction: "LONG" | "SHORT";
    symbol: string;
    timeframe: string;
    entry: number;
    stopLoss: number;
    takeProfit: number;
    confidence: number;
    rationale: string[];
    newsItems: { title: string; source: string; url: string }[];
    invalidation: string;
  };
  riskAmount: number;
  rewardAmount: number;
}

export const TradeSignal = ({ signal, riskAmount, rewardAmount }: TradeSignalProps) => {
  const isLong = signal.direction === "LONG";
  const { toast } = useToast();

  const getDecimals = (n: number) => {
    const s = String(n);
    const i = s.indexOf('.');
    return i >= 0 ? s.length - i - 1 : 0;
  };
  const priceDecimals = getDecimals(signal.entry);
  const formatPrice = (n: number) => n.toFixed(priceDecimals);

  const handleAcceptTrade = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to accept trades.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("trades").insert({
        user_id: session.user.id,
        symbol: signal.symbol,
        direction: signal.direction,
        timeframe: signal.timeframe,
        entry: signal.entry,
        stop_loss: signal.stopLoss,
        take_profit: signal.takeProfit,
        confidence: signal.confidence,
        risk_amount: riskAmount,
        reward_amount: rewardAmount,
        rationale: signal.rationale,
        news_items: signal.newsItems,
        invalidation: signal.invalidation,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Trade Accepted",
        description: `${signal.direction} trade for ${signal.symbol} has been saved to your history.`,
      });
    } catch (error: any) {
      toast({
        title: "Error Saving Trade",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadTicket = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("ForexAdvisor Trade Ticket", 20, 20);
    
    // Signal details
    doc.setFontSize(12);
    doc.setTextColor(60);
    
    let yPos = 40;
    const lineHeight = 10;
    
    doc.text(`Direction: ${signal.direction}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Symbol: ${signal.symbol}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Timeframe: ${signal.timeframe}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Confidence: ${signal.confidence}%`, 20, yPos);
    yPos += lineHeight * 1.5;
    
    doc.text(`Entry: $${formatPrice(signal.entry)}` , 20, yPos);
    yPos += lineHeight;
    doc.text(`Stop Loss: $${formatPrice(signal.stopLoss)}` , 20, yPos);
    yPos += lineHeight;
    doc.text(`Take Profit: $${formatPrice(signal.takeProfit)}` , 20, yPos);
    yPos += lineHeight * 1.5;
    
    doc.text(`Risk Amount: $${riskAmount.toFixed(2)}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Potential Reward: $${rewardAmount.toFixed(2)}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Risk/Reward Ratio: 1:3`, 20, yPos);
    yPos += lineHeight * 1.5;
    
    doc.text("Trade Rationale:", 20, yPos);
    yPos += lineHeight;
    signal.rationale.forEach((reason: string, index: number) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${reason}`, 170);
      doc.text(lines, 20, yPos);
      yPos += lines.length * lineHeight;
    });
    
    yPos += lineHeight;
    doc.text(`Invalidation: ${signal.invalidation}`, 20, yPos);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("This is informational only and not financial advice.", 20, 280);
    
    doc.save(`trade-ticket-${signal.symbol}-${Date.now()}.pdf`);
    
    toast({
      title: "Ticket Downloaded",
      description: "Your trade ticket has been saved as a PDF.",
    });
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/30 shadow-glow">
      <div className={`p-6 ${isLong ? 'bg-success/10' : 'bg-danger/10'} border-b border-border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLong ? (
              <TrendingUp className="h-8 w-8 text-success" />
            ) : (
              <TrendingDown className="h-8 w-8 text-danger" />
            )}
            <div>
              <h2 className="text-3xl font-bold text-foreground">{signal.direction} Signal</h2>
              <p className="text-muted-foreground">{signal.symbol} • {signal.timeframe}</p>
            </div>
          </div>
          <Badge variant={isLong ? "default" : "destructive"} className="text-lg px-4 py-2">
            {signal.confidence}% Confidence
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-secondary rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <p className="text-xs uppercase tracking-wide">Entry</p>
            </div>
            <p className="text-2xl font-bold text-foreground">${formatPrice(signal.entry)}</p>
          </div>
          <div className="bg-danger/10 rounded-lg p-4 border border-danger/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Shield className="h-4 w-4" />
              <p className="text-xs uppercase tracking-wide">Stop Loss</p>
            </div>
            <p className="text-2xl font-bold text-danger">${formatPrice(signal.stopLoss)}</p>
          </div>
          <div className="bg-success/10 rounded-lg p-4 border border-success/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <p className="text-xs uppercase tracking-wide">Take Profit</p>
            </div>
            <p className="text-2xl font-bold text-success">${formatPrice(signal.takeProfit)}</p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Risk Amount:</span>
            <span className="font-semibold text-danger">${riskAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Potential Reward:</span>
            <span className="font-semibold text-success">${rewardAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Risk/Reward Ratio:</span>
            <span className="font-semibold text-primary">1:3</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Trade Rationale
          </h3>
          <ul className="space-y-2">
            {signal.rationale.map((reason, index) => (
              <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {signal.newsItems.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Supporting News</h3>
              <div className="space-y-2">
                {signal.newsItems.map((news, index) => (
                  <a
                    key={index}
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors group"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {news.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{news.source}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3">
          <p className="text-xs font-semibold text-danger mb-1">Trade Invalidation:</p>
          <p className="text-sm text-foreground">{signal.invalidation}</p>
        </div>

        <div className="pt-2 space-y-3">
          <DerivTradeDialog 
            signal={{
              direction: signal.direction,
              symbol: signal.symbol,
              entry: signal.entry,
              stopLoss: signal.stopLoss,
              takeProfit: signal.takeProfit,
            }}
            riskAmount={riskAmount}
          />
          
          <Button variant="outline" className="w-full" onClick={handleDownloadTicket}>
            <Download className="h-4 w-4 mr-2" />
            Download Ticket
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          ⚠️ This is informational only and not financial advice. Trade at your own risk.
        </p>
      </div>
    </Card>
  );
};
