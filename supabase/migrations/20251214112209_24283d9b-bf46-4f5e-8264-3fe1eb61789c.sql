-- Create table for contact queries from non-users
CREATE TABLE public.contact_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_queries ENABLE ROW LEVEL SECURITY;

-- Admins can manage all queries
CREATE POLICY "Admins can manage contact queries"
ON public.contact_queries
FOR ALL
USING (is_admin());

-- Allow public insert (non-authenticated users can submit)
CREATE POLICY "Anyone can submit contact queries"
ON public.contact_queries
FOR INSERT
WITH CHECK (true);