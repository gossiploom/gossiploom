-- Update admin_signals table to use structured data instead of images
ALTER TABLE public.admin_signals 
  ADD COLUMN IF NOT EXISTS symbol text,
  ADD COLUMN IF NOT EXISTS direction text,
  ADD COLUMN IF NOT EXISTS entry_price numeric,
  ADD COLUMN IF NOT EXISTS stop_loss numeric,
  ADD COLUMN IF NOT EXISTS take_profit numeric,
  ADD COLUMN IF NOT EXISTS risk_reward text,
  ADD COLUMN IF NOT EXISTS additional_notes text;

-- Make image_path nullable since we're moving to structured data
ALTER TABLE public.admin_signals 
  ALTER COLUMN image_path DROP NOT NULL;

-- Set default additional notes
UPDATE public.admin_signals SET additional_notes = 'Do not continue to hold your trades if Stop Loss has Reached, exit the trade. Consider also using trailing profit or breakeven to lock any realized profit should price retrace to stop loss before getting to take profit. Break even when 1:1.5 profit is realized' WHERE additional_notes IS NULL;