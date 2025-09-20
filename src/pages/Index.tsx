import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CategoryNav from '@/components/CategoryNav';
import FeaturedStory from '@/components/FeaturedStory';
import SidebarStories from '@/components/SidebarStories';
import OldStoriesSection from '@/components/OldStoriesSection';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

interface GossipPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author_name: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  is_trending: boolean;
  created_at: string;
}

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrending, setShowTrending] = useState(false);
  const [featuredStory, setFeaturedStory] = useState<GossipPost | null>(null);
  const [relatedStories, setRelatedStories] = useState<GossipPost[]>([]);
  const [trendingStories, setTrendingStories] = useState<GossipPost[]>([]);
  const [oldStories, setOldStories] = useState<GossipPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, [selectedCategory, searchQuery, showTrending]);

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      // Calculate date for stories older than 2 months
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      // Fetch all posts
      let query = supabase
        .from('gossip_posts')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (showTrending || selectedCategory === 'Trending') {
        query = query.eq('is_trending', true);
      } else if (selectedCategory !== 'All' && selectedCategory !== 'Trending') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }

      const { data: allPosts, error } = await query;
      if (error) throw error;

      if (allPosts && allPosts.length > 0) {
        // Separate posts by age
        const recentPosts = allPosts.filter(post => 
          new Date(post.created_at) > twoMonthsAgo
        );
        const oldPosts = allPosts.filter(post => 
          new Date(post.created_at) <= twoMonthsAgo
        );

        // Set featured story (most recent post)
        setFeaturedStory(recentPosts[0] || null);

        // Set related stories (exclude featured story)
        setRelatedStories(recentPosts.slice(1, 6));

        // Fetch trending stories separately
        const { data: trendingData } = await supabase
          .from('gossip_posts')
          .select('*')
          .eq('is_trending', true)
          .gt('created_at', twoMonthsAgo.toISOString())
          .order('likes_count', { ascending: false })
          .limit(5);

        setTrendingStories(trendingData || []);
        setOldStories(oldPosts);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTrendingClick = () => {
    setShowTrending(!showTrending);
    setSelectedCategory(showTrending ? 'All' : 'Trending');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onSearch={handleSearch} onTrendingClick={handleTrendingClick} />
        <CategoryNav 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-96 bg-muted rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} onTrendingClick={handleTrendingClick} />
      <CategoryNav 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <SidebarStories 
              relatedStories={relatedStories}
              trendingStories={trendingStories}
            />
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {featuredStory ? (
              <FeaturedStory post={featuredStory} />
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No stories found!</h3>
                <p className="text-muted-foreground">Be the first to share a story.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Old Stories Section */}
      <OldStoriesSection oldStories={oldStories} />
      
      <Footer />
    </div>
  );
};

export default Index;
