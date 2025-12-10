-- Create pending_payments table to track payment transactions
CREATE TABLE IF NOT EXISTS public.pending_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_id TEXT NOT NULL,
  checkout_request_id TEXT,
  amount_kes NUMERIC NOT NULL,
  analysis_slots INTEGER NOT NULL,
  package_type TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'mpesa',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_transaction_id UNIQUE (transaction_id)
);

-- Enable Row Level Security
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for pending_payments
CREATE POLICY "Users can view their own pending payments"
  ON public.pending_payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pending payments"
  ON public.pending_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can update all payments (for webhook processing)
CREATE POLICY "Service role can update payments"
  ON public.pending_payments
  FOR UPDATE
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_pending_payments_transaction_id ON public.pending_payments(transaction_id);
CREATE INDEX idx_pending_payments_user_id ON public.pending_payments(user_id);
CREATE INDEX idx_pending_payments_status ON public.pending_payments(status);

-- Add trigger for updated_at if needed
CREATE TRIGGER update_pending_payments_updated_at
  BEFORE UPDATE ON public.pending_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();