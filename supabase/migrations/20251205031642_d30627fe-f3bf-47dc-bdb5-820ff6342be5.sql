-- Create a function to set admin role by email (used for initial admin setup)
CREATE OR REPLACE FUNCTION public.set_admin_by_email(admin_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user_id from auth.users by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  -- Insert admin role (update if exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Set sammygits@gmail.com as admin (will work once user registers)
-- This will be run manually or when user exists
DO $$
BEGIN
  PERFORM public.set_admin_by_email('sammygits@gmail.com');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Admin user not found yet - will need to be set after user registers';
END;
$$;