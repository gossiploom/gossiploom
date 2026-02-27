-- Migration: Add Signal Provider Role and Update Signals Table
-- Created: 2025-02-28
-- FIXED: Handles existing app_role enum type

-- Step 1: Add 'signal_provider' to the existing app_role enum type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'signal_provider' 
    AND enumtypid = 'app_role'::regtype
  ) THEN
    ALTER TYPE app_role ADD VALUE 'signal_provider';
  END IF;
END $$;

-- Step 2: Create signals table
CREATE TABLE IF NOT EXISTS signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency_pair TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL')),
  entry_price DECIMAL(10, 5),
  stop_loss DECIMAL(10, 5),
  take_profit DECIMAL(10, 5),
  signal_visibility TEXT NOT NULL CHECK (signal_visibility IN ('free', 'subscribers', 'both')),
  description TEXT,
  outcome TEXT CHECK (outcome IN ('pending', 'win', 'loss', 'breakeven')),
  outcome_pips DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  expired_at TIMESTAMP WITH TIME ZONE
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_signals_provider_id ON signals(provider_id);
CREATE INDEX IF NOT EXISTS idx_signals_visibility ON signals(signal_visibility);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_outcome ON signals(outcome);

-- Step 4: Enable RLS
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies
DROP POLICY IF EXISTS "Signal providers can create signals" ON signals;
DROP POLICY IF EXISTS "Signal providers can update their own signals" ON signals;
DROP POLICY IF EXISTS "Signal providers can view their own signals" ON signals;
DROP POLICY IF EXISTS "Admins can view all signals" ON signals;
DROP POLICY IF EXISTS "Anyone can view free signals" ON signals;
DROP POLICY IF EXISTS "Authenticated users can view free signals" ON signals;
DROP POLICY IF EXISTS "Admins can update any signal" ON signals;
DROP POLICY IF EXISTS "Admins can delete any signal" ON signals;

-- Step 6: Create RLS Policies (note the ::app_role cast)
CREATE POLICY "Signal providers can create signals" 
ON signals FOR INSERT 
TO authenticated 
WITH CHECK (
  provider_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'signal_provider'::app_role
  )
);

CREATE POLICY "Signal providers can update their own signals" 
ON signals FOR UPDATE 
TO authenticated 
USING (
  provider_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'signal_provider'::app_role
  )
);

CREATE POLICY "Signal providers can view their own signals" 
ON signals FOR SELECT 
TO authenticated 
USING (
  provider_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'signal_provider'::app_role
  )
);

CREATE POLICY "Admins can view all signals" 
ON signals FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

CREATE POLICY "Anyone can view free signals" 
ON signals FOR SELECT 
TO anon 
USING (signal_visibility IN ('free', 'both'));

CREATE POLICY "Authenticated users can view free signals" 
ON signals FOR SELECT 
TO authenticated 
USING (signal_visibility IN ('free', 'both'));

CREATE POLICY "Admins can update any signal" 
ON signals FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can delete any signal" 
ON signals FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Step 7: Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger
DROP TRIGGER IF EXISTS update_signals_updated_at ON signals;
CREATE TRIGGER update_signals_updated_at
  BEFORE UPDATE ON signals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Create stats view
DROP VIEW IF EXISTS signal_provider_stats;
CREATE VIEW signal_provider_stats AS
SELECT 
  provider_id,
  COUNT(*) as total_signals,
  COUNT(*) FILTER (WHERE outcome = 'win') as wins,
  COUNT(*) FILTER (WHERE outcome = 'loss') as losses,
  COUNT(*) FILTER (WHERE outcome = 'breakeven') as breakeven,
  COUNT(*) FILTER (WHERE outcome = 'pending') as pending,
  ROUND(
    (COUNT(*) FILTER (WHERE outcome = 'win')::DECIMAL / 
    NULLIF(COUNT(*) FILTER (WHERE outcome IN ('win', 'loss')), 0)) * 100, 
    2
  ) as win_rate,
  SUM(outcome_pips) FILTER (WHERE outcome IS NOT NULL) as total_pips
FROM signals
GROUP BY provider_id;

-- Step 10: Add comments
COMMENT ON TABLE signals IS 'Stores trading signals created by signal providers';
COMMENT ON COLUMN signals.signal_visibility IS 'Who can see this signal: free (everyone), subscribers (paid users), or both';
COMMENT ON COLUMN signals.outcome IS 'Result of the signal: pending, win, loss, or breakeven';