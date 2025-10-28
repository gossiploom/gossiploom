-- Remove position_size column from trades table as it's no longer needed
ALTER TABLE public.trades DROP COLUMN IF EXISTS position_size;