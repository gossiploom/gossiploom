-- Add outcome tracking to admin_signals
ALTER TABLE public.admin_signals 
  ADD COLUMN IF NOT EXISTS outcome text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS outcome_notes text,
  ADD COLUMN IF NOT EXISTS outcome_updated_at timestamp with time zone;