import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Archive } from 'lucide-react';

interface OldStoriesSectionProps {
  oldStories: Array<{
    id: string;
    title: string;
    image_url: string | null;
    category: string;
    created_at: string;
  }>;
}

const OldStoriesSection: React.FC<OldStoriesSectionProps> = ({ oldStories }) => {
  if (oldStories.length === 0) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Archive className="w-6 h-6 text-muted-foreground" />
            Archive Stories
          </CardTitle>
          <p className="text-muted-foreground">Stories from the past</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {oldStories.map((story) => (
              <Link key={story.id} to={`/post/${story.id}`} className="block group">
                <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
                  {story.image_url && (
                    <div className="w-12 h-12 flex-shrink-0">
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
                    <p className="text-xs text-muted-foreground">
                      {formatDate(story.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default OldStoriesSection;