import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import ContentRenderer from '@/components/ContentRenderer';

interface FeaturedStoryProps {
  post: {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    author_name: string;
    image_url: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
  };
}

const FeaturedStory: React.FC<FeaturedStoryProps> = ({ post }) => {
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
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-subtle">
        <Link to={`/post/${post.id}`}>
          {post.image_url && (
            <div className="aspect-video overflow-hidden">
              <img 
                src={post.image_url} 
                alt={post.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="gossip">{post.category}</Badge>
              <div className="flex items-center text-muted-foreground text-sm">
                <Clock className="w-4 h-4 mr-1" />
                {formatTimeAgo(post.created_at)}
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight hover:text-primary transition-colors">
              {post.title}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {post.excerpt || (() => {
                const plainText = post.content.replace(/<[^>]*>/g, '');
                return plainText.substring(0, 200) + '...';
              })()}
            </p>
            
            <p className="text-sm text-muted-foreground">
              By <span className="font-medium">{post.author_name}</span>
            </p>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
};

export default FeaturedStory;