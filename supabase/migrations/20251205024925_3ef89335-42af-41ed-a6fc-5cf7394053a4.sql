-- Update the default value for analysis_limit column
ALTER TABLE public.user_settings ALTER COLUMN analysis_limit SET DEFAULT 5;

-- Update the initialize_user_settings function to use 0 instead of 5
CREATE OR REPLACE FUNCTION public.initialize_user_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_settings (user_id, analysis_limit)
  VALUES (NEW.user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
