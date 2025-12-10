-- Create forex_news table to store news from ForexFactory and other sources
CREATE TABLE IF NOT EXISTS public.forex_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  currency TEXT NOT NULL,
  impact TEXT NOT NULL CHECK (impact IN ('high', 'low', 'medium')),
  event_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual TEXT,
  forecast TEXT,
  previous TEXT,
  source TEXT DEFAULT 'forexfactory',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_forex_news_event_time ON public.forex_news(event_time);
CREATE INDEX idx_forex_news_impact ON public.forex_news(impact);

-- Enable Row Level Security
ALTER TABLE public.forex_news ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read news (public data)
CREATE POLICY "Anyone can view forex news" 
ON public.forex_news 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_forex_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_forex_news_updated_at
BEFORE UPDATE ON public.forex_news
FOR EACH ROW
EXECUTE FUNCTION public.update_forex_news_updated_at();

-- Create news_expectations table for AI-generated expectations
CREATE TABLE IF NOT EXISTS public.news_expectations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.forex_news(id) ON DELETE CASCADE,
  expectation_summary TEXT NOT NULL,
  currency_pairs JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on news_expectations
ALTER TABLE public.news_expectations ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read expectations
CREATE POLICY "Anyone can view news expectations" 
ON public.news_expectations 
FOR SELECT 
USING (true);