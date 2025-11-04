-- Add unique constraint to user_id in trades table (one user can have multiple trades, so we don't need unique here)
-- Add unique constraint to user_id in user_settings table (one user should have only one settings record)
ALTER TABLE public.user_settings
ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);