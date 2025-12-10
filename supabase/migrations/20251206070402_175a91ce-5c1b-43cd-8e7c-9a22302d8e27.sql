-- Add subscription and IP tracking fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_signal_subscriber boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS registration_ip text,
ADD COLUMN IF NOT EXISTS last_login_ip text;

-- Create signals table for admin-posted signals
CREATE TABLE public.admin_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path text NOT NULL,
  title text,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

ALTER TABLE public.admin_signals ENABLE ROW LEVEL SECURITY;

-- Admins can manage signals
CREATE POLICY "Admins can manage signals" ON public.admin_signals
FOR ALL USING (is_admin());

-- Subscribers can view signals
CREATE POLICY "Subscribers can view signals" ON public.admin_signals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_signal_subscriber = true 
    AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
  )
);

-- Create support messages table for user-admin communication
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  attachment_path text,
  attachment_type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their threads
CREATE POLICY "Users can view their messages" ON public.support_messages
FOR SELECT USING (
  sender_id = auth.uid() OR 
  thread_id IN (SELECT thread_id FROM support_messages WHERE sender_id = auth.uid()) OR
  is_admin()
);

-- Users can insert their own messages
CREATE POLICY "Users can send messages" ON public.support_messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Admins can manage all messages
CREATE POLICY "Admins can manage messages" ON public.support_messages
FOR ALL USING (is_admin());

-- Create support threads table
CREATE TABLE public.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their threads" ON public.support_threads
FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can create threads" ON public.support_threads
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage threads" ON public.support_threads
FOR ALL USING (is_admin());

-- Add rejected status tracking to account_requests
ALTER TABLE public.account_requests 
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS request_ip text;

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for admin signals
INSERT INTO storage.buckets (id, name, public) 
VALUES ('admin-signals', 'admin-signals', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for support-attachments
CREATE POLICY "Users can upload their attachments" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'support-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'support-attachments' AND (auth.uid()::text = (storage.foldername(name))[1] OR is_admin()));

CREATE POLICY "Admins can manage support attachments" ON storage.objects
FOR ALL USING (bucket_id = 'support-attachments' AND is_admin());

-- Storage policies for admin-signals
CREATE POLICY "Admins can manage signal images" ON storage.objects
FOR ALL USING (bucket_id = 'admin-signals' AND is_admin());

CREATE POLICY "Subscribers can view signal images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'admin-signals' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_signal_subscriber = true 
    AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
  )
);

-- Add function to get successful trades count
CREATE OR REPLACE FUNCTION public.get_successful_trades_count(target_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM trades
  WHERE user_id = target_user_id
  AND outcome = 'win'
$$;

-- Add function to get slots usage info
CREATE OR REPLACE FUNCTION public.get_user_slots_info(target_user_id uuid)
RETURNS TABLE(total_slots integer, slots_used integer, slots_remaining integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    us.analysis_limit as total_slots,
    (SELECT COUNT(*)::integer FROM trades WHERE user_id = target_user_id) as slots_used,
    us.analysis_limit - (SELECT COUNT(*)::integer FROM trades WHERE user_id = target_user_id) as slots_remaining
  FROM user_settings us
  WHERE us.user_id = target_user_id
$$;