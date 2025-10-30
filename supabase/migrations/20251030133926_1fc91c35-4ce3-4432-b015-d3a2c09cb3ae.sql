-- Create table for forex news
CREATE TABLE IF NOT EXISTS public.forex_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  currency TEXT NOT NULL,
  impact TEXT NOT NULL,
  forecast TEXT,
  previous TEXT,
  event_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forex_news ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view forex news" 
ON public.forex_news 
FOR SELECT 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_forex_news_event_time ON public.forex_news(event_time DESC);
CREATE INDEX idx_forex_news_impact ON public.forex_news(impact);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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
EXECUTE FUNCTION public.update_updated_at_column();