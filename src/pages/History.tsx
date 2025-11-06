import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

interface Trade {
  id: string;
  symbol: string;
  direction: string;
  entry: number;
  stop_loss: number;
  take_profit: number;
  confidence: number;
  risk_amount: number;
  reward_amount: number;
  status: string;
  created_at: string;
  outcome: string | null;
  profit_loss: number | null;
  trade_type: string;
  activated: boolean | null;
  invalidation: string;
  rationale: any;
  news_items: any;
}

const History = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadTrades();
  }, []);

  const getDecimals = (num: number): number => {
    const str = num.toString();
    if (str.includes('.')) {
      return str.split('.')[1].length;
    }
    return 0;
  };

  const formatPrice = (price: number): string => {
    const decimals = getDecimals(price);
    return price.toFixed(decimals);
  };

  const extractInvalidationValue = (invalidation: string): string => {
    if (!invalidation) return "N/A";
    // Extract numeric value with or without $ sign
    const match = invalidation.match(/\$?[\d,]+\.?\d+/);
    if (match) {
      const value = match[0].replace('$', '');
      return `$${value}`;
    }
    return "N/A";
  };

  const loadTrades = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTrades(data || []);
    } catch (error: any) {
      toast({
        title: "Error Loading Analysis History",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOutcomeUpdate = async (id: string, outcome: 'successful' | 'unsuccessful', trade: Trade) => {
    try {
      // For pending trades, check if they were activated
      if (trade.trade_type === 'pending' && !trade.activated) {
        // If not activated, set outcome as "not_activated" with no profit/loss
        const { error } = await supabase
          .from("trades")
          .update({ 
            outcome: 'not_activated',
            profit_loss: 0
          })
          .eq("id", id);

        if (error) throw error;

        setTrades(trades.map(t => 
          t.id === id 
            ? { ...t, outcome: 'not_activated', profit_loss: 0 }
            : t
        ));
        
        toast({
          title: "Outcome Updated",
          description: "Trade marked as not activated.",
        });
        return;
      }

      // Calculate profit/loss based on outcome and risk/reward
      const profitLoss = outcome === 'successful' ? trade.reward_amount : -trade.risk_amount;
      
      const { error } = await supabase
        .from("trades")
        .update({ 
          outcome,
          profit_loss: profitLoss
        })
        .eq("id", id);

      if (error) throw error;

      setTrades(trades.map(t => 
        t.id === id 
          ? { ...t, outcome, profit_loss: profitLoss }
          : t
      ));
      
      toast({
        title: "Outcome Updated",
        description: `Trade marked as ${outcome}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error Updating Outcome",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleActivationToggle = async (id: string, currentActivated: boolean | null) => {
    try {
      const newActivated = !currentActivated;
      
      const { error } = await supabase
        .from("trades")
        .update({ activated: newActivated })
        .eq("id", id);

      if (error) throw error;

      setTrades(trades.map(t => 
        t.id === id 
          ? { ...t, activated: newActivated }
          : t
      ));
      
      toast({
        title: "Activation Status Updated",
        description: `Trade marked as ${newActivated ? 'activated' : 'not activated'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error Updating Activation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculateTotalProfitLoss = (): number => {
    return trades.reduce((total, trade) => {
      return total + (trade.profit_loss || 0);
    }, 0);
  };

  const handleDownload = async () => {
    if (trades.length === 0) {
      toast({
        title: "No Data",
        description: "There are no analyses to download.",
        variant: "destructive",
      });
      return;
    }

    // Fetch user profile data
    const { data: { session } } = await supabase.auth.getSession();
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", session?.user?.id)
      .single();

    const { data: settings } = await supabase
      .from("user_settings")
      .select("display_user_id")
      .eq("user_id", session?.user?.id)
      .single();

    // Calculate trading period
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const firstTradeDate = sortedTrades.length > 0 
      ? new Date(sortedTrades[0].created_at).toLocaleDateString()
      : "";
    const lastTradeDate = sortedTrades.length > 0 
      ? new Date(sortedTrades[sortedTrades.length - 1].created_at).toLocaleDateString()
      : "";

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    // Add title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Analysis History Report", 14, 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    
    // Add user information
    doc.text(`Trader: ${profile?.name || "N/A"}`, 14, 27);
    doc.text(`User ID: ${settings?.display_user_id || "N/A"}`, 14, 32);
    doc.text(`Trading Period: ${firstTradeDate} - ${lastTradeDate}`, 14, 37);

    // Prepare table data
    const tableData = trades.map(trade => [
      new Date(trade.created_at).toLocaleDateString(),
      new Date(trade.created_at).toLocaleTimeString(),
      trade.symbol,
      trade.direction,
      trade.trade_type,
      trade.trade_type === "pending" ? (trade.activated ? "Yes" : "No") : "N/A",
      `$${formatPrice(Number(trade.entry))}`,
      `$${formatPrice(Number(trade.stop_loss))}`,
      `$${formatPrice(Number(trade.take_profit))}`,
      extractInvalidationValue(trade.invalidation),
      `${trade.confidence}%`,
      trade.outcome === "successful" && trade.trade_type === "pending" && trade.activated 
        ? "Activated & Won"
        : trade.outcome === "unsuccessful" && trade.trade_type === "pending" && trade.activated
        ? "Activated & Lost"
        : trade.outcome === "not_activated"
        ? "Not Activated"
        : trade.outcome || "Pending",
      trade.profit_loss !== null ? `$${trade.profit_loss.toFixed(2)}` : "-",
      `$${trade.risk_amount.toFixed(2)}`,
      `$${trade.reward_amount.toFixed(2)}`
    ]);

    // Add total row
    const totalPL = calculateTotalProfitLoss();
    tableData.push([
      "", "", "", "", "", "", "", "", "", "", "", 
      "TOTAL", 
      `$${totalPL.toFixed(2)}`, 
      "", 
      ""
    ]);

    // Generate table
    autoTable(doc, {
      head: [[
        "Date",
        "Time",
        "Symbol",
        "Direction",
        "Type",
        "Activated",
        "Entry",
        "Stop Loss",
        "Take Profit",
        "Invalidation",
        "Confidence",
        "Outcome",
        "P/L",
        "Risk",
        "Reward"
      ]],
      body: tableData,
      startY: 43,
      styles: { 
        fontSize: 7,
        cellPadding: 1.5
      },
      headStyles: {
        fillColor: [59, 130, 246],
        fontStyle: "bold",
        halign: "center"
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 16 },
        2: { cellWidth: 18 },
        3: { cellWidth: 16 },
        4: { cellWidth: 16 },
        5: { cellWidth: 14 },
        6: { cellWidth: 18 },
        7: { cellWidth: 18 },
        8: { cellWidth: 18 },
        9: { cellWidth: 18 },
        10: { cellWidth: 16 },
        11: { cellWidth: 22 },
        12: { cellWidth: 18, fontStyle: "bold" },
        13: { cellWidth: 16 },
        14: { cellWidth: 16 }
      },
      didParseCell: function(data) {
        // Style the total row
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [243, 244, 246];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [0, 0, 0];
        }
        
        // Color profit/loss column
        if (data.column.index === 12 && data.row.index < tableData.length - 1) {
          const value = trades[data.row.index]?.profit_loss;
          if (value !== null && value !== undefined) {
            data.cell.styles.textColor = value >= 0 ? [34, 197, 94] : [239, 68, 68];
          }
        }
        
        // Color total P/L
        if (data.column.index === 12 && data.row.index === tableData.length - 1) {
          data.cell.styles.textColor = totalPL >= 0 ? [34, 197, 94] : [239, 68, 68];
        }
      }
    });

    // Save the PDF
    doc.save(`analysis-history-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Download Complete",
      description: "Analysis history has been exported as PDF.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-trading">
      <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analysis History</h1>
                <p className="text-xs text-muted-foreground">
                  {trades.length} {trades.length === 1 ? 'analysis' : 'analyses'} completed
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              disabled={trades.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading analysis history...</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-6 bg-secondary rounded-full mb-4">
              <TrendingUp className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Analyses Yet</h3>
            <p className="text-muted-foreground">
              Your analysis history will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[130px]">Date & Time</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Trade Type</TableHead>
                  <TableHead className="text-center">Activated</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Stop Loss</TableHead>
                  <TableHead className="text-right">Take Profit</TableHead>
                  <TableHead>Invalidation</TableHead>
                  <TableHead className="text-center">Confidence</TableHead>
                  <TableHead className="text-center">Outcome</TableHead>
                  <TableHead className="text-right">Profit/Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTrade(trade)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground text-xs">
                      {new Date(trade.created_at).toLocaleDateString()}<br />
                      <span className="text-xs">{new Date(trade.created_at).toLocaleTimeString()}</span>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {trade.symbol}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {trade.direction === "LONG" ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-danger" />
                        )}
                        <span className={trade.direction === "LONG" ? "text-success" : "text-danger"}>
                          {trade.direction}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={trade.trade_type === "pending" ? "secondary" : "outline"}>
                        {trade.trade_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {trade.trade_type === "pending" ? (
                        <Button
                          variant={trade.activated ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleActivationToggle(trade.id, trade.activated)}
                        >
                          {trade.activated ? "Yes" : "No"}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${formatPrice(Number(trade.entry))}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-danger">
                      ${formatPrice(Number(trade.stop_loss))}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-success">
                      ${formatPrice(Number(trade.take_profit))}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-foreground">
                      {extractInvalidationValue(trade.invalidation)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={trade.direction === "LONG" ? "default" : "destructive"}>
                        {trade.confidence}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {trade.outcome ? (
                        <Badge variant={
                          trade.outcome === "successful" ? "default" : 
                          trade.outcome === "not_activated" ? "secondary" : 
                          "destructive"
                        }>
                          {trade.outcome === "successful" && trade.trade_type === "pending" && trade.activated 
                            ? "Activated & Won"
                            : trade.outcome === "unsuccessful" && trade.trade_type === "pending" && trade.activated
                            ? "Activated & Lost"
                            : trade.outcome === "not_activated"
                            ? "Not Activated"
                            : trade.outcome}
                        </Badge>
                      ) : (
                        <div className="flex gap-1 flex-wrap justify-center">
                          {trade.trade_type === "pending" && !trade.activated ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs bg-secondary/50 hover:bg-secondary/70"
                              onClick={() => handleOutcomeUpdate(trade.id, "unsuccessful", trade)}
                            >
                              Not Activated
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs bg-success/10 hover:bg-success/20"
                                onClick={() => handleOutcomeUpdate(trade.id, "successful", trade)}
                              >
                                ✓ Win
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs bg-danger/10 hover:bg-danger/20"
                                onClick={() => handleOutcomeUpdate(trade.id, "unsuccessful", trade)}
                              >
                                ✗ Loss
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {trade.profit_loss !== null ? (
                        <span className={trade.profit_loss >= 0 ? "text-success" : "text-danger"}>
                          ${Math.abs(trade.profit_loss).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell colSpan={12} className="text-right text-lg">
                    Total Profit/Loss:
                  </TableCell>
                  <TableCell className="text-right text-lg">
                    <span className={calculateTotalProfitLoss() >= 0 ? "text-success" : "text-danger"}>
                      ${Math.abs(calculateTotalProfitLoss()).toFixed(2)}
                      {calculateTotalProfitLoss() >= 0 ? " Profit" : " Loss"}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {/* Trade Signal Dialog */}
      <Dialog open={!!selectedTrade} onOpenChange={(open) => !open && setSelectedTrade(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Trade Signal Generated</DialogTitle>
          </DialogHeader>
          
          {selectedTrade && (
            <Card className="p-6 border-2 border-primary/20">
              {/* Signal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  {selectedTrade.direction === "LONG" ? (
                    <TrendingUp className="h-8 w-8 text-success" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-danger" />
                  )}
                  <div>
                    <h2 className={`text-3xl font-bold ${selectedTrade.direction === "LONG" ? "text-success" : "text-danger"}`}>
                      {selectedTrade.direction} Signal
                    </h2>
                    <p className="text-muted-foreground">{selectedTrade.symbol}</p>
                  </div>
                </div>
                <Badge 
                  variant={selectedTrade.direction === "LONG" ? "default" : "destructive"}
                  className="text-lg px-4 py-2"
                >
                  {selectedTrade.confidence}% Confidence
                </Badge>
              </div>

              {/* Price Levels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg border border-border bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    ENTRY
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    ${formatPrice(Number(selectedTrade.entry))}
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-danger/50 bg-danger/5">
                  <p className="text-xs text-danger mb-1 flex items-center gap-2">
                    <TrendingDown className="h-3 w-3" />
                    STOP LOSS
                  </p>
                  <p className="text-2xl font-bold text-danger">
                    ${formatPrice(Number(selectedTrade.stop_loss))}
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-success/50 bg-success/5">
                  <p className="text-xs text-success mb-1 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    TAKE PROFIT
                  </p>
                  <p className="text-2xl font-bold text-success">
                    ${formatPrice(Number(selectedTrade.take_profit))}
                  </p>
                </div>
              </div>

              {/* Risk/Reward Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 rounded-lg bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Risk Amount</p>
                  <p className="text-lg font-bold text-danger">${selectedTrade.risk_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Potential Reward</p>
                  <p className="text-lg font-bold text-success">${selectedTrade.reward_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Risk/Reward Ratio</p>
                  <p className="text-lg font-bold text-foreground">
                    1:{(selectedTrade.reward_amount / selectedTrade.risk_amount).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Trade Rationale */}
              {selectedTrade.rationale && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="text-primary">●</span> Trade Rationale
                  </h3>
                  <div className="space-y-2 pl-5">
                    {Array.isArray(selectedTrade.rationale) ? (
                      selectedTrade.rationale.map((item: string, index: number) => (
                        <p key={index} className="text-sm text-muted-foreground leading-relaxed">
                          • {item}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedTrade.rationale}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Supporting News */}
              {selectedTrade.news_items && selectedTrade.news_items.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="text-primary">●</span> Supporting News
                  </h3>
                  <div className="space-y-2 pl-5">
                    {selectedTrade.news_items.map((item: any, index: number) => (
                      <div key={index}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {item.title}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trade Invalidation */}
              <div className="p-4 bg-danger/10 border border-danger/50 rounded-lg">
                <h3 className="text-sm font-semibold text-danger mb-2">Trade Invalidation:</h3>
                <p className="text-sm text-foreground">{selectedTrade.invalidation}</p>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  ⚠️ This is informational only and not financial advice. Trade at your own risk.
                </p>
              </div>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;
