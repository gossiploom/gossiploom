-- Add display_user_id column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN display_user_id TEXT UNIQUE;

-- Create a sequence for user IDs starting from 1
CREATE SEQUENCE public.user_id_sequence
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 9999
  NO CYCLE;

-- Create function to generate formatted user ID (0001, 0002, etc.)
CREATE OR REPLACE FUNCTION public.generate_display_user_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_id INTEGER;
  formatted_id TEXT;
BEGIN
  -- Get next value from sequence
  next_id := nextval('public.user_id_sequence');
  
  -- Check if we've exceeded the limit
  IF next_id > 9999 THEN
    RAISE EXCEPTION 'Maximum number of users (9999) reached';
  END IF;
  
  -- Format as 4-digit string with leading zeros
  formatted_id := lpad(next_id::TEXT, 4, '0');
  
  RETURN formatted_id;
END;
$$;

-- Create trigger function to assign display_user_id on user creation
CREATE OR REPLACE FUNCTION public.assign_display_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate and assign display user ID
  NEW.display_user_id := generate_display_user_id();
  RETURN NEW;
END;
$$;

-- Create trigger on user_settings table
CREATE TRIGGER set_display_user_id
  BEFORE INSERT ON public.user_settings
  FOR EACH ROW
  WHEN (NEW.display_user_id IS NULL)
  EXECUTE FUNCTION public.assign_display_user_id();

-- Assign display_user_ids to existing users (if any)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM public.user_settings 
    WHERE display_user_id IS NULL 
    ORDER BY created_at ASC
  LOOP
    UPDATE public.user_settings 
    SET display_user_id = generate_display_user_id()
    WHERE id = user_record.id;
  END LOOP;
END $$;