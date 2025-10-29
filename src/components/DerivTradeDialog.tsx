import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";

interface DerivTradeDialogProps {
  signal: {
    direction: "LONG" | "SHORT";
    symbol: string;
    entry: number;
    stopLoss: number;
    takeProfit: number;
  };
  riskAmount: number;
}

export const DerivTradeDialog = ({ signal, riskAmount }: DerivTradeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [tradeAmount, setTradeAmount] = useState(riskAmount);
  const [duration, setDuration] = useState(60);
  const [durationType, setDurationType] = useState<"seconds" | "minutes" | "hours">("minutes");
  const { toast } = useToast();

  // Map symbol to Deriv format
  const getDerivSymbol = (symbol: string) => {
    const symbolMap: Record<string, string> = {
      'EURUSD': 'frxEURUSD',
      'GBPUSD': 'frxGBPUSD',
      'USDJPY': 'frxUSDJPY',
      'AUDUSD': 'frxAUDUSD',
      'XAUUSD': 'frxXAUUSD',
      'BTCUSD': 'cryBTCUSD',
    };
    return symbolMap[symbol.toUpperCase()] || symbol;
  };

  const handlePlaceTrade = async () => {
    setIsPlacing(true);
    try {
      const derivSymbol = getDerivSymbol(signal.symbol);
      const direction = signal.direction === "LONG" ? "CALL" : "PUT";

      console.log('Placing Deriv trade:', { derivSymbol, direction, tradeAmount, duration, durationType });

      const { data, error } = await supabase.functions.invoke('deriv-trade', {
        body: {
          action: 'place',
          symbol: derivSymbol,
          direction: direction,
          amount: tradeAmount,
          duration: duration,
          durationType: durationType,
        },
      });

      if (error) {
        console.error('Deriv trade error:', error);
        throw new Error(error.message || 'Failed to place trade');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Trade placed successfully:', data);

      toast({
        title: "Trade Placed Successfully!",
        description: `Contract ID: ${data.contractId}. Buy Price: $${data.buyPrice}`,
      });

      setOpen(false);

    } catch (error) {
      console.error('Error placing trade:', error);
      toast({
        title: "Trade Failed",
        description: error instanceof Error ? error.message : "Failed to place trade on Deriv",
        variant: "destructive",
      });
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-gold shadow-glow-strong">
          {signal.direction === "LONG" ? (
            <TrendingUp className="h-5 w-5 mr-2" />
          ) : (
            <TrendingDown className="h-5 w-5 mr-2" />
          )}
          Place Trade on Deriv
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {signal.direction === "LONG" ? (
              <TrendingUp className="h-6 w-6 text-success" />
            ) : (
              <TrendingDown className="h-6 w-6 text-danger" />
            )}
            Place {signal.direction} Trade
          </DialogTitle>
          <DialogDescription>
            Execute your {signal.symbol} trade signal on Deriv platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="trade-amount">Stake Amount (USD)</Label>
            <Input
              id="trade-amount"
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(Number(e.target.value))}
              className="bg-secondary border-border"
              min={1}
              step={0.01}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: ${riskAmount.toFixed(2)} (based on your risk settings)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="bg-secondary border-border"
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration-type">Unit</Label>
              <Select value={durationType} onValueChange={(value: any) => setDurationType(value)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">Seconds</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Symbol:</span>
              <span className="font-semibold">{signal.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Direction:</span>
              <span className={`font-semibold ${signal.direction === "LONG" ? "text-success" : "text-danger"}`}>
                {signal.direction === "LONG" ? "CALL (Higher)" : "PUT (Lower)"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Entry:</span>
              <span className="font-semibold">${signal.entry.toFixed(5)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contract Duration:</span>
              <span className="font-semibold">{duration} {durationType}</span>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="text-xs text-foreground">
              <strong>Note:</strong> This will place a binary options trade on Deriv. 
              Make sure you have sufficient balance in your Deriv account.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={() => setOpen(false)}
            disabled={isPlacing}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-gradient-gold shadow-glow" 
            onClick={handlePlaceTrade}
            disabled={isPlacing}
          >
            {isPlacing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Placing Trade...
              </>
            ) : (
              "Confirm Trade"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
