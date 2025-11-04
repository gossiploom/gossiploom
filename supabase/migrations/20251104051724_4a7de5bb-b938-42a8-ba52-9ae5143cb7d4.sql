-- Add display_user_id column to trades table
ALTER TABLE public.trades
ADD COLUMN display_user_id TEXT;

-- Create foreign key from trades to user_settings using display_user_id
ALTER TABLE public.trades
ADD CONSTRAINT fk_trades_display_user_id 
FOREIGN KEY (display_user_id) 
REFERENCES public.user_settings(display_user_id) 
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_trades_display_user_id ON public.trades(display_user_id);

-- Update RLS policies for trades table to use display_user_id
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can create their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;

-- Create security definer function to get current user's display_user_id
CREATE OR REPLACE FUNCTION public.get_current_display_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_user_id 
  FROM public.user_settings 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Create new RLS policies using display_user_id
CREATE POLICY "Users can view their own trades" 
ON public.trades 
FOR SELECT 
USING (display_user_id = public.get_current_display_user_id());

CREATE POLICY "Users can create their own trades" 
ON public.trades 
FOR INSERT 
WITH CHECK (display_user_id = public.get_current_display_user_id());

CREATE POLICY "Users can update their own trades" 
ON public.trades 
FOR UPDATE 
USING (display_user_id = public.get_current_display_user_id());

CREATE POLICY "Users can delete their own trades" 
ON public.trades 
FOR DELETE 
USING (display_user_id = public.get_current_display_user_id());