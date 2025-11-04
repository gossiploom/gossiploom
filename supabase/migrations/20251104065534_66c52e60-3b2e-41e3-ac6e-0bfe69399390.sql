-- Clean up invalid data before fixing the schema
-- Delete rows with user_id = NULL (these are orphaned test data)
DELETE FROM public.user_settings WHERE user_id IS NULL;

-- Delete the problematic d3ef and 74e1 user entries
DELETE FROM public.user_settings WHERE display_user_id IN ('d3ef', '74e1');

-- Now make user_id NOT NULL
ALTER TABLE public.user_settings 
ALTER COLUMN user_id SET NOT NULL;

-- Ensure the trigger for assigning display_user_id exists and only fires on INSERT
DROP TRIGGER IF EXISTS assign_display_user_id_trigger ON public.user_settings;

CREATE TRIGGER assign_display_user_id_trigger
BEFORE INSERT ON public.user_settings
FOR EACH ROW
WHEN (NEW.display_user_id IS NULL)
EXECUTE FUNCTION public.assign_display_user_id();

-- Add helpful comments
COMMENT ON COLUMN public.user_settings.trading_style IS 'User preference for trading style (day/scalp) - can be changed anytime without affecting user identity';
COMMENT ON COLUMN public.user_settings.display_user_id IS 'Sequential 4-digit user identifier (0001-9999) - assigned once per user and never changes';