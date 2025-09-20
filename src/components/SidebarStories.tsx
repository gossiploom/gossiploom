import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Clock, TrendingUp } from 'lucide-react';

interface SidebarStoriesProps {
  relatedStories: Array<{
    id: string;
    title: string;
    excerpt: string;
    category: string;
    author_name: string;
    image_url: string | null;
    created_at: string;
  }>;
  trendingStories: Array<{
    id: string;
    title: string;
    excerpt: string;
    category: string;
    author_name: string;
    image_url: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
  }>;
}

const SidebarStories: React.FC<SidebarStoriesProps> = ({ relatedStories, trendingStories }) => {
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

  return (
    <div className="space-y-8">
      {/* Related News */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-foreground">Related News</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {relatedStories.slice(0, 4).map((story) => (
            <Link key={story.id} to={`/post/${story.id}`} className="block group">
              <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                {story.image_url && (
                  <div className="w-16 h-16 flex-shrink-0">
                    <img 
                      src={story.image_url} 
                      alt={story.title}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                    {story.title}
                  </h3>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimeAgo(story.created_at)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Trending News */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Trending News
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trendingStories.slice(0, 4).map((story, index) => (
            <Link key={story.id} to={`/post/${story.id}`} className="block group">
              <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                    {story.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{story.category}</span>
                    <span>{story.likes_count} likes</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SidebarStories;