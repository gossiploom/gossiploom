-- Add unique constraint to forex_news table to prevent duplicates
-- This allows the edge function to use ON CONFLICT for upserts
ALTER TABLE public.forex_news 
ADD CONSTRAINT forex_news_unique_event UNIQUE (title, event_time, currency);