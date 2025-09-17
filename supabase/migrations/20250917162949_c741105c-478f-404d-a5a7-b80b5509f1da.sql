-- Create gossip posts table
CREATE TABLE public.gossip_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT NOT NULL,
  author_name TEXT DEFAULT 'Anonymous',
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.gossip_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.gossip_posts(id) ON DELETE CASCADE,
  author_name TEXT DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table to track unique likes per post
CREATE TABLE public.gossip_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.gossip_posts(id) ON DELETE CASCADE,
  user_fingerprint TEXT NOT NULL, -- Browser fingerprint for anonymous users
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_fingerprint)
);

-- Enable Row Level Security
ALTER TABLE public.gossip_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gossip_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gossip_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (no auth required)
CREATE POLICY "Anyone can view posts" 
ON public.gossip_posts 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create posts" 
ON public.gossip_posts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view comments" 
ON public.gossip_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create comments" 
ON public.gossip_comments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view likes" 
ON public.gossip_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create likes" 
ON public.gossip_likes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete their own likes" 
ON public.gossip_likes 
FOR DELETE 
USING (true);

-- Create storage bucket for gossip images
INSERT INTO storage.buckets (id, name, public) VALUES ('gossip-images', 'gossip-images', true);

-- Create storage policies for public access
CREATE POLICY "Anyone can view gossip images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gossip-images');

CREATE POLICY "Anyone can upload gossip images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'gossip-images');

-- Create function to update post stats
CREATE OR REPLACE FUNCTION public.update_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'gossip_comments' THEN
    UPDATE public.gossip_posts 
    SET comments_count = (
      SELECT COUNT(*) 
      FROM public.gossip_comments 
      WHERE post_id = NEW.post_id
    )
    WHERE id = NEW.post_id;
  ELSIF TG_TABLE_NAME = 'gossip_likes' THEN
    UPDATE public.gossip_posts 
    SET likes_count = (
      SELECT COUNT(*) 
      FROM public.gossip_likes 
      WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    )
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic stats updates
CREATE TRIGGER update_post_comments_count
AFTER INSERT ON public.gossip_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_stats();

CREATE TRIGGER update_post_likes_count
AFTER INSERT OR DELETE ON public.gossip_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_stats();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gossip_posts_updated_at
BEFORE UPDATE ON public.gossip_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample gossip posts
INSERT INTO public.gossip_posts (title, content, excerpt, category, author_name, is_trending) VALUES
('Hollywood A-Lister Caught in Secret Romance Scandal', 
'Sources close to the production reveal that two of Hollywood''s biggest stars have been secretly dating for months! The chemistry was undeniable on set, but what started as professional collaboration quickly turned into something much more intimate. Crew members report seeing late-night dinners, shared trailers, and stolen glances that went far beyond their scripted scenes. The plot thickens when you discover both stars are supposedly in committed relationships with other people. Industry insiders are calling it the scandal of the year, with potential career implications for both parties involved.',
'Exclusive photos reveal Hollywood''s biggest stars in an intimate dinner date that no one saw coming. Sources close to the couple reveal shocking details...',
'Celebrity', 'Entertainment Insider', true),

('Reality TV Drama: The Truth Behind the Cameras',
'Former cast members are finally speaking out about what really happened during filming of the hit reality show. The drama wasn''t just for cameras - real friendships were destroyed, alliances formed, and producers allegedly manipulated situations to create maximum conflict. One former contestant reveals: "They would deliberately create scenarios to trigger fights. We were sleep-deprived, hungry, and emotionally manipulated." The show that viewers thought was authentic was actually a carefully orchestrated drama designed to boost ratings. Multiple sources confirm that cast members were given specific storylines to follow and encouraged to create fake relationships and feuds.',
'Former cast members spill the tea on what really happened during filming. The drama wasn''t just for cameras - real friendships were destroyed...',
'TV Shows', 'Reality Check', true),

('Fashion Week Chaos: Designer Meltdowns and Backstage Feuds',
'Paris Fashion Week 2024 was supposed to be glamorous, but behind the scenes, it was pure chaos. A-list designer had a complete meltdown just hours before their show, reportedly throwing fabric samples and screaming at assistants. Meanwhile, two rival fashion houses engaged in an all-out war over a stolen design concept. Models were caught in the crossfire, with some walking out mid-show in protest. The fashion elite tried to keep it quiet, but leaked videos show the true extent of the drama. One insider claims: "It was like watching a soap opera unfold in real-time. Egos, money, and artistic vision collided in the worst possible way."',
'This year''s fashion week was full of surprises, from unexpected collaborations to designer feuds that spilled onto the runway...',
'Lifestyle', 'Fashion Insider', false),

('Social Media Mega-Influencer''s Dark Secret Exposed',
'What started as a routine background check by a major brand has uncovered a past that this 50-million-follower influencer has been desperately trying to hide. Before the fame, luxury lifestyle, and brand partnerships, this social media star had a completely different identity. Court documents reveal a history of fraud allegations, multiple name changes, and connections to a controversial pyramid scheme. The influencer''s team is in full damage control mode, threatening legal action against anyone who shares the information. But screenshots and documents are already circulating, showing a pattern of deceptive business practices that dates back years.',
'What started as a routine background check uncovered a past that this mega-influencer has been desperately trying to hide...',
'Celebrity', 'Digital Detective', false),

('Music Industry Bombshell: The Album That Almost Wasn''t',
'The hottest album of the year almost didn''t happen, and the behind-the-scenes drama is more shocking than the music itself. Studio sessions turned into battlefields as creative differences escalated into personal attacks. The lead artist reportedly locked themselves in the studio for three days straight, refusing to speak to their longtime collaborator. Leaked voice memos reveal heated arguments about artistic direction, money splits, and creative control. One producer walked out, taking half the tracks with them. The record label was on the verge of canceling the entire project when a last-minute intervention saved the album that would become a chart-topping sensation.',
'Studio tensions, creative differences, and personal conflicts nearly derailed what became a chart-topping success...',
'Entertainment', 'Music Maven', false),

('Award Show After-Party Scandal: What The Cameras Missed',
'The most exclusive after-party of the year turned into a night of shocking revelations and unexpected drama. While the public saw glamorous red carpet moments, the real story unfolded behind closed doors. A-list celebrities were caught in compromising situations, secret business deals were made in bathroom stalls, and at least three major feuds erupted over champagne and caviar. Security footage allegedly shows a major pop star in a heated confrontation with their former manager, while another clip reveals a Hollywood power couple in what appears to be their final argument before announcing their divorce. The party that was supposed to celebrate achievement became a night of career-ending mistakes.',
'The cameras stopped rolling, but the drama continued. Exclusive details from the most talked-about after-party of the year...',
'Entertainment', 'Party Insider', true);