-- Add youtube_url column to gossip_posts table
ALTER TABLE public.gossip_posts 
ADD COLUMN youtube_url TEXT;