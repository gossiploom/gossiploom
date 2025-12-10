-- Create profiles table for user information
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  phone_number text NOT NULL DEFAULT '',
  broker_name text,
  unique_identifier text NOT NULL UNIQUE,
  profile_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to generate next unique identifier
CREATE OR REPLACE FUNCTION public.get_next_unique_identifier()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_id integer;
  formatted_id text;
BEGIN
  -- Get the highest current identifier and add 1
  SELECT COALESCE(MAX(CAST(unique_identifier AS integer)), 0) + 1
  INTO next_id
  FROM public.profiles;
  
  -- If we've exceeded 9999, wrap around or handle error
  IF next_id > 9999 THEN
    RAISE EXCEPTION 'Maximum number of user identifiers (9999) reached';
  END IF;
  
  -- Format as 4-digit string with leading zeros
  formatted_id := LPAD(next_id::text, 4, '0');
  
  RETURN formatted_id;
END;
$$;

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, unique_identifier)
  VALUES (NEW.id, public.get_next_unique_identifier());
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Add trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();