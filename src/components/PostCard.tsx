import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Clock, TrendingUp } from 'lucide-react';

interface PostCardProps {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  timeAgo: string;
  likes: number;
  comments: number;
  trending?: boolean;
  imageUrl?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  title,
  excerpt,
  category,
  timeAgo,
  likes,
  comments,
  trending = false,
  imageUrl
}) => {
  return (
    <Link to={`/post/${id}`}>
      <Card className={`group cursor-pointer hover:scale-[1.02] ${trending ? 'ring-1 ring-trending/50' : ''}`}>
      {imageUrl && (
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {trending && (
            <Badge variant="trending" className="absolute top-3 right-3">
              <TrendingUp className="w-3 h-3" />
              Trending
            </Badge>
          )}
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="category" className="text-xs">
            {category}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {timeAgo}
          </div>
        </div>
        <CardTitle className="text-lg group-hover:text-primary transition-colors duration-200">
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {excerpt}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 px-2">
              <Heart className="w-3 h-3" />
              {likes}
            </Button>
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 px-2">
              <MessageCircle className="w-3 h-3" />
              {comments}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <Share2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};

export default PostCard;