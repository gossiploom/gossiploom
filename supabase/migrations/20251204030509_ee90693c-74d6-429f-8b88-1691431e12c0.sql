-- Create storage bucket for USDT payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('usdt-payments', 'usdt-payments', false);

-- RLS policies for USDT payment screenshots
CREATE POLICY "Users can upload their own payment screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'usdt-payments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own payment screenshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'usdt-payments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to track USDT payments
CREATE TABLE public.usdt_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount_usd NUMERIC NOT NULL,
  analysis_slots INTEGER NOT NULL,
  package_type TEXT NOT NULL,
  screenshot_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.usdt_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert their own USDT payments"
ON public.usdt_payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own USDT payments"
ON public.usdt_payments
FOR SELECT
USING (auth.uid() = user_id);