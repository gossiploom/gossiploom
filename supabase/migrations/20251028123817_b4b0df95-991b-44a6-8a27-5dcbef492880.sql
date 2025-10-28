-- First, delete all objects from the gossip-images bucket
DELETE FROM storage.objects WHERE bucket_id = 'gossip-images';

-- Now drop the gossip storage bucket
DELETE FROM storage.buckets WHERE id = 'gossip-images';

-- Drop gossip-related tables
DROP TABLE IF EXISTS public.gossip_likes CASCADE;
DROP TABLE IF EXISTS public.gossip_comments CASCADE;
DROP TABLE IF EXISTS public.gossip_posts CASCADE;

-- Create trades table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  take_profit NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  timeframe TEXT NOT NULL,
  invalidation TEXT NOT NULL,
  rationale JSONB NOT NULL,
  risk_amount NUMERIC NOT NULL,
  reward_amount NUMERIC NOT NULL,
  trade_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pending',
  activated BOOLEAN DEFAULT false,
  outcome TEXT,
  profit_loss NUMERIC,
  news_items JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trades
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
CREATE POLICY "Users can view their own trades" 
ON public.trades FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own trades" ON public.trades;
CREATE POLICY "Users can create their own trades" 
ON public.trades FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
CREATE POLICY "Users can update their own trades" 
ON public.trades FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;
CREATE POLICY "Users can delete their own trades" 
ON public.trades FOR DELETE 
USING (auth.uid() = user_id);

-- Create or update user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  analysis_limit INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" 
ON public.user_settings FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" 
ON public.user_settings FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings" 
ON public.user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);