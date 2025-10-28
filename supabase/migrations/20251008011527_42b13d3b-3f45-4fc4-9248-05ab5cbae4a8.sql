-- Fix search_path for initialize_user_settings function
CREATE OR REPLACE FUNCTION public.initialize_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, analysis_limit)
  VALUES (NEW.user_id, 30)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;