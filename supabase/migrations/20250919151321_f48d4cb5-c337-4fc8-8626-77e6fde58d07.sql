-- Update all posts to have correct counts by recalculating them
UPDATE public.gossip_posts 
SET 
  likes_count = (
    SELECT COUNT(*) 
    FROM public.gossip_likes 
    WHERE post_id = gossip_posts.id
  ),
  comments_count = (
    SELECT COUNT(*) 
    FROM public.gossip_comments 
    WHERE post_id = gossip_posts.id
  );