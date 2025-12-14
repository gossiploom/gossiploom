-- Add policy for admins to update pending_payments
CREATE POLICY "Admins can update pending payments"
ON public.pending_payments
FOR UPDATE
USING (is_admin());

-- Add policy for admins to update usdt_payments (already exists but let's ensure it works)
DROP POLICY IF EXISTS "Admins can update USDT payments" ON public.usdt_payments;
CREATE POLICY "Admins can update USDT payments"
ON public.usdt_payments
FOR UPDATE
USING (is_admin());