-- First, let's create the triggers to automatically update post statistics
-- This will ensure that likes_count and comments_count are always accurate

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_likes_count_trigger ON public.gossip_likes;
DROP TRIGGER IF EXISTS update_comments_count_trigger ON public.gossip_comments;

-- Create trigger for likes count updates (on INSERT and DELETE)
CREATE TRIGGER update_likes_count_trigger
  AFTER INSERT OR DELETE ON public.gossip_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_stats();

-- Create trigger for comments count updates (on INSERT and DELETE)  
CREATE TRIGGER update_comments_count_trigger
  AFTER INSERT OR DELETE ON public.gossip_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_stats();