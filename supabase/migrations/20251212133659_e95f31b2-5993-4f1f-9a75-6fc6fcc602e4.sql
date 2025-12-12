-- Update RLS policy for admin_notifications to allow public (non-authenticated) viewing of global notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON public.admin_notifications;

CREATE POLICY "Anyone can view global notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (is_global = true);

CREATE POLICY "Authenticated users can view their targeted notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (target_user_id = auth.uid());