-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.is_admin());

-- Create user_presence table for tracking online users
CREATE TABLE public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_online BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update their own presence" ON public.user_presence
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all presence" ON public.user_presence
  FOR SELECT USING (public.is_admin());

-- Create admin_notifications table
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_global BOOLEAN NOT NULL DEFAULT false,
  duration_seconds INTEGER NOT NULL DEFAULT 10,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notifications" ON public.admin_notifications
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view their notifications" ON public.admin_notifications
  FOR SELECT USING (
    is_global = true OR target_user_id = auth.uid()
  );

-- Create notification_reads table to track which users have seen notifications
CREATE TABLE public.notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.admin_notifications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notification reads" ON public.notification_reads
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reads" ON public.notification_reads
  FOR SELECT USING (public.is_admin());

-- Create account_requests table
CREATE TABLE public.account_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage account requests" ON public.account_requests
  FOR ALL USING (public.is_admin());

-- Update existing tables to allow admin access

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Allow admins to view all user_settings
CREATE POLICY "Admins can view all user settings" ON public.user_settings
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all user settings" ON public.user_settings
  FOR UPDATE USING (public.is_admin());

-- Allow admins to view all pending_payments
CREATE POLICY "Admins can view all pending payments" ON public.pending_payments
  FOR SELECT USING (public.is_admin());

-- Allow admins to view all usdt_payments
CREATE POLICY "Admins can view all USDT payments" ON public.usdt_payments
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update USDT payments" ON public.usdt_payments
  FOR UPDATE USING (public.is_admin());

-- Allow admins to view all trades
CREATE POLICY "Admins can view all trades" ON public.trades
  FOR SELECT USING (public.is_admin());

-- Create trigger to assign user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Enable realtime for notifications and presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;