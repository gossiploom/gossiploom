-- Add new columns to trades table for tracking trade outcomes
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS outcome text CHECK (outcome IN ('successful', 'unsuccessful')),
ADD COLUMN IF NOT EXISTS profit_loss numeric,
ADD COLUMN IF NOT EXISTS trade_type text NOT NULL DEFAULT 'immediate' CHECK (trade_type IN ('pending', 'immediate')),
ADD COLUMN IF NOT EXISTS activated boolean;

-- Add comment to explain the columns
COMMENT ON COLUMN public.trades.outcome IS 'Trade outcome: successful or unsuccessful. Once set, cannot be changed.';
COMMENT ON COLUMN public.trades.profit_loss IS 'Calculated profit or loss based on outcome and risk/reward ratio';
COMMENT ON COLUMN public.trades.trade_type IS 'Type of trade: pending or immediate';
COMMENT ON COLUMN public.trades.activated IS 'For pending trades: whether the trade was activated or not';