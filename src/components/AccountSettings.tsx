import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, TrendingUp, Target, Zap } from "lucide-react";

interface AccountSettingsProps {
  accountSize: number;
  riskPercent: number;
  symbolPreset: string;
  pointsPerUsd: number;
  tradeType: "pending" | "immediate";
  onAccountSizeChange: (value: number) => void;
  onRiskPercentChange: (value: number) => void;
  onSymbolPresetChange: (value: string) => void;
  onPointsPerUsdChange: (value: number) => void;
  onTradeTypeChange: (value: "pending" | "immediate") => void;
}

const SYMBOL_PRESETS = [
  { value: "xauusd", label: "XAUUSD (Lot 0.01)", points: 100 },
  { value: "btcusd", label: "BTCUSD (Lot 0.01)", points: 10000 },
  { value: "eurusd", label: "EURUSD (Lot 0.1)", points: 10 },
  { value: "gbpusd", label: "GBPUSD (Lot 0.1)", points: 10 },
  { value: "usdjpy", label: "USDJPY (Lot 0.1)", points: 15 },
  { value: "gbpjpy", label: "GBPJPY (Lot 0.1)", points: 15 },
  { value: "eurgbp", label: "EURGBP (Lot 0.1)", points: 7 },
  { value: "usdcad", label: "USDCAD (Lot 0.1)", points: 14 },
  { value: "audcad", label: "AUDCAD (Lot 0.1)", points: 14 },
  { value: "chfjpy", label: "CHFJPY (Lot 0.1)", points: 15 },
  { value: "nasdaq100", label: "Nasdaq 100 (Lot 0.1)", points: 100 },
  { value: "us30", label: "US30 Dow Jones (Lot 0.1)", points: 100 },
  { value: "other", label: "Other (Custom)", points: 0 },
];

export const AccountSettings = ({
  accountSize,
  riskPercent,
  symbolPreset,
  pointsPerUsd,
  tradeType,
  onAccountSizeChange,
  onRiskPercentChange,
  onSymbolPresetChange,
  onPointsPerUsdChange,
  onTradeTypeChange,
}: AccountSettingsProps) => {
  const riskAmount = (accountSize * riskPercent) / 100;

  const handleSymbolChange = (value: string) => {
    onSymbolPresetChange(value);
    const preset = SYMBOL_PRESETS.find(p => p.value === value);
    if (preset && preset.points > 0) {
      onPointsPerUsdChange(preset.points);
    }
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-trading border-primary/20">
      <div className="space-y-2">
        <Label htmlFor="account-size" className="flex items-center gap-2 text-foreground">
          <DollarSign className="h-4 w-4 text-primary" />
          Account Size (USD)
        </Label>
        <Input
          id="account-size"
          type="number"
          value={accountSize}
          onChange={(e) => onAccountSizeChange(Number(e.target.value))}
          className="bg-secondary border-border text-lg font-semibold"
          min={1}
        />
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-foreground">
          <TrendingUp className="h-4 w-4 text-primary" />
          Risk Per Trade: {riskPercent}%
        </Label>
        <Slider
          value={[riskPercent]}
          onValueChange={(values) => onRiskPercentChange(values[0])}
          min={1}
          max={50}
          step={1}
          className="py-2"
        />
        <div className="pt-2">
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Risk Amount</p>
            <p className="text-xl font-bold text-danger">${riskAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-foreground">
          <Target className="h-4 w-4 text-primary" />
          Symbol / Points Configuration
        </Label>
        <Select value={symbolPreset} onValueChange={handleSymbolChange}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Select symbol" />
          </SelectTrigger>
          <SelectContent>
            {SYMBOL_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
                {preset.points > 0 && ` (${preset.points} pts = 1 USD)`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {symbolPreset === "other" && (
          <div className="pt-2">
            <Label htmlFor="points-per-usd" className="text-sm text-muted-foreground">
              Points per 1 USD
            </Label>
            <Input
              id="points-per-usd"
              type="number"
              value={pointsPerUsd}
              onChange={(e) => onPointsPerUsdChange(Number(e.target.value))}
              className="bg-secondary border-border mt-1"
              min={1}
              placeholder="Enter points value"
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-foreground">
          <Zap className="h-4 w-4 text-primary" />
          Trade Entry Type
        </Label>
        <RadioGroup value={tradeType} onValueChange={onTradeTypeChange}>
          <div className="flex items-center space-x-2 bg-secondary rounded-lg p-3 border border-border">
            <RadioGroupItem value="immediate" id="immediate" />
            <Label htmlFor="immediate" className="cursor-pointer flex-1">
              <span className="font-medium">Immediate Entry</span>
              <p className="text-xs text-muted-foreground">Enter trade at current market price. Best charts to upload are 1M, 5m, 15M, 30M and 1H</p>
            </Label>
          </div>
          <div className="flex items-center space-x-2 bg-secondary rounded-lg p-3 border border-border">
            <RadioGroupItem value="pending" id="pending" />
            <Label htmlFor="pending" className="cursor-pointer flex-1">
              <span className="font-medium">Pending Order</span>
              <p className="text-xs text-muted-foreground">Wait for price to reach entry level. Best charts to upload are 5M, 15M, 1H, 4H and 6H or 8H or 12H or 1D</p>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          All calculations update automatically
        </p>
      </div>
    </Card>
  );
};
