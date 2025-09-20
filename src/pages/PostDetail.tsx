import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Share2, Clock, ArrowLeft, TrendingUp, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentRenderer from '@/components/ContentRenderer';

interface GossipPost {
  id: string;
  title: string;
  content: string;
  category: string;
  author_name: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  is_trending: boolean;
  created_at: string;
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<GossipPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { toast } = useToast();

  // Simple browser fingerprint for anonymous users
  const getUserFingerprint = () => {
    return `${navigator.userAgent}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}`;
  };

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
      checkIfLiked();
    }
  }, [id]);

  // Refresh post data after like/comment actions to sync with database
  const refreshPost = async () => {
    if (id) {
      const { data, error } = await supabase
        .from('gossip_posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setPost(data);
      }
    }
  };

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('gossip_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: "Could not load the post",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('gossip_comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkIfLiked = async () => {
    try {
      const fingerprint = getUserFingerprint();
      const { data, error } = await supabase
        .from('gossip_likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_fingerprint', fingerprint)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      // Not liked if no record found
      setIsLiked(false);
    }
  };

  const handleLike = async () => {
    try {
      const fingerprint = getUserFingerprint();
      
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('gossip_likes')
          .delete()
          .eq('post_id', id)
          .eq('user_fingerprint', fingerprint);
        
        if (error) throw error;
        
        setIsLiked(false);
        // Refresh to get updated count from database trigger
        await refreshPost();
      } else {
        // Add like
        const { error } = await supabase
          .from('gossip_likes')
          .insert({
            post_id: id,
            user_fingerprint: fingerprint,
          });
        
        if (error) throw error;
        
        setIsLiked(true);
        // Refresh to get updated count from database trigger
        await refreshPost();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Could not update like status",
        variant: "destructive",
      });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    
    try {
      const { data, error } = await supabase
        .from('gossip_comments')
        .insert({
          post_id: id,
          author_name: commentAuthor.trim() || 'Anonymous',
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Add new comment to the list
      setComments([data, ...comments]);
      setNewComment('');
      
      // Refresh to get updated count from database trigger
      await refreshPost();

      toast({
        title: "Comment added!",
        description: "Your comment has been posted.",
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: "Could not post comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Post link copied to clipboard",
      });
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Post not found</h1>
            <Link to="/">
              <Button variant="hero">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center mb-6 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all stories
          </Link>

          {/* Post Content */}
          <article className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="category">{post.category}</Badge>
                {post.is_trending && (
                  <Badge variant="trending">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </Badge>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatTimeAgo(post.created_at)}
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                {post.title}
              </h1>
              
              <p className="text-muted-foreground">
                By {post.author_name}
              </p>
            </div>

            {/* Image */}
            {post.image_url && (
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={post.image_url} 
                  alt={post.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Content */}
            <ContentRenderer 
              content={post.content}
              className="prose prose-lg max-w-none"
            />

            {/* Actions */}
            <div className="flex items-center justify-end border-t border-b border-border py-4">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </article>

          {/* Comments Section */}
          <section className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold">Comments</h2>
            
            {/* Comment Form */}
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <Input
                    placeholder="Your name (optional)"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    className="max-w-xs"
                  />
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 min-h-[100px] resize-none"
                    />
                    <Button 
                      type="submit" 
                      disabled={!newComment.trim() || isSubmittingComment}
                      variant="hero"
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No comments yet. Be the first to share your thoughts!
                  </CardContent>
                </Card>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold">{comment.author_name}</h4>
                        <span className="text-sm text-muted-foreground">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PostDetail;