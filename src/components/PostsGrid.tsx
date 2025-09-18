import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { supabase } from '@/integrations/supabase/client';

interface GossipPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author_name: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  is_trending: boolean;
  created_at: string;
}

interface PostsGridProps {
  selectedCategory: string;
}

const PostsGrid: React.FC<PostsGridProps> = ({ selectedCategory }) => {
  const [posts, setPosts] = useState<GossipPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('gossip_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter by category if not "All"
      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Latest Gossip</h2>
          <p className="text-muted-foreground">Stay updated with the hottest stories and trending news</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-muted rounded-lg h-64"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Latest Gossip</h2>
        <p className="text-muted-foreground">Stay updated with the hottest stories and trending news</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            title={post.title}
            excerpt={post.excerpt || ''}
            category={post.category}
            timeAgo={formatTimeAgo(post.created_at)}
            likes={post.likes_count}
            comments={post.comments_count}
            trending={post.is_trending}
            imageUrl={post.image_url || undefined}
          />
        ))}
      </div>
      
      {posts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No gossip yet!</h3>
          <p className="text-muted-foreground">Be the first to share a juicy story.</p>
        </div>
      )}
    </section>
  );
};

export default PostsGrid;