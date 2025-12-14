-- Drop the trigger that references non-existent updated_at column
DROP TRIGGER IF EXISTS update_pending_payments_updated_at ON public.pending_payments;