-- Fix RLS policy for support_messages to allow users to see all messages in their threads
DROP POLICY IF EXISTS "Users can view their messages" ON public.support_messages;

CREATE POLICY "Users can view messages in their threads" 
ON public.support_messages 
FOR SELECT 
USING (
  -- User can view messages in threads they own
  thread_id IN (
    SELECT id FROM public.support_threads WHERE user_id = auth.uid()
  )
  OR is_admin()
);