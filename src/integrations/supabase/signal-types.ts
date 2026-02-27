// Type definitions for Signals feature
// Add these to your existing types.ts file

export interface Signal {
  id: string;
  provider_id: string;
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
  updated_at: string;
  published_at: string | null;
  expired_at: string | null;
}

export interface SignalInsert {
  id?: string;
  provider_id: string;
  currency_pair: string;
  signal_type: "BUY" | "SELL";
  entry_price?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  signal_visibility: "free" | "subscribers" | "both";
  description?: string | null;
  outcome?: "pending" | "win" | "loss" | "breakeven" | null;
  outcome_pips?: number | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  expired_at?: string | null;
}

export interface SignalUpdate {
  currency_pair?: string;
  signal_type?: "BUY" | "SELL";
  entry_price?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  signal_visibility?: "free" | "subscribers" | "both";
  description?: string | null;
  outcome?: "pending" | "win" | "loss" | "breakeven" | null;
  outcome_pips?: number | null;
  updated_at?: string;
  published_at?: string | null;
  expired_at?: string | null;
}

export interface SignalProviderStats {
  provider_id: string;
  total_signals: number;
  wins: number;
  losses: number;
  breakeven: number;
  pending: number;
  win_rate: number;
  total_pips: number;
}

// Extended Database interface for signals
export interface Database {
  public: {
    Tables: {
      signals: {
        Row: Signal;
        Insert: SignalInsert;
        Update: SignalUpdate;
      };
      signal_provider_stats: {
        Row: SignalProviderStats;
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: "admin" | "signal_provider";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "admin" | "signal_provider";
          created_at?: string;
        };
      };
    };
    Views: {
      signal_provider_stats: {
        Row: SignalProviderStats;
      };
    };
  };
}
