-- Add trading style column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN trading_style text CHECK (trading_style IN ('scalp', 'day')) DEFAULT 'day';

-- Update existing rows to have a default
UPDATE public.user_settings SET trading_style = 'day' WHERE trading_style IS NULL;