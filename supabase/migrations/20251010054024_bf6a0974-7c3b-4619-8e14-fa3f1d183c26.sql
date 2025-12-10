-- Update outcome column to allow 'not_activated' as a valid value
-- This allows pending orders to be marked as not activated
COMMENT ON COLUMN public.trades.outcome IS 'Trade outcome: successful, unsuccessful, or not_activated for pending orders that were never triggered';