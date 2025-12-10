import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertCircle, Calendar, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileCompletionGuard } from "@/components/ProfileCompletionGuard";
import { Footer } from "@/components/Footer";

interface NewsItem {
  id: string;
  title: string;
  currency: string;
  impact: string;
  event_time: string;
  forecast: string | null;
  previous: string | null;
}

interface NewsAnalysis {
  [key: string]: string;
}

const News = () => {
  const [highImpactNews, setHighImpactNews] = useState<NewsItem[]>([]);
  const [lowImpactNews, setLowImpactNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newsAnalysis, setNewsAnalysis] = useState<NewsAnalysis>({});
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchNews();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      // Get start of today in local timezone
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Fetch high impact news from start of today onwards
      const { data: highData, error: highError } = await supabase
        .from('forex_news')
        .select('*')
        .eq('impact', 'high')
        .gte('event_time', startOfToday.toISOString())
        .order('event_time', { ascending: true });

      if (highError) throw highError;
      setHighImpactNews(highData || []);

      // Fetch low impact news from start of today onwards
      const { data: lowData, error: lowError } = await supabase
        .from('forex_news')
        .select('*')
        .eq('impact', 'low')
        .gte('event_time', startOfToday.toISOString())
        .order('event_time', { ascending: true });

      if (lowError) throw lowError;
      setLowImpactNews(lowData || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast({
        title: "Error",
        description: "Failed to fetch news. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    toast({
      title: "Refreshing News",
      description: "Fetching latest news from Forex Factory...",
    });

    // Trigger edge function to fetch latest news
    const { error } = await supabase.functions.invoke('fetch-forex-news');
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to refresh news. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Wait a moment for the data to be inserted
    setTimeout(() => {
      fetchNews();
      toast({
        title: "Success",
        description: "News updated successfully.",
      });
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const analyzeNewsImpact = async (item: NewsItem) => {
    if (analyzingIds.has(item.id)) return;

    setAnalyzingIds(prev => new Set(prev).add(item.id));

    try {
      const { data, error } = await supabase.functions.invoke('analyze-news-impact', {
        body: { newsItem: item }
      });

      if (error) throw error;

      setNewsAnalysis(prev => ({
        ...prev,
        [item.id]: data.analysis
      }));
    } catch (error) {
      console.error('Error analyzing news:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to generate trading expectations.",
        variant: "destructive",
      });
    } finally {
      setAnalyzingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const NewsCard = ({ item, isHighImpact }: { item: NewsItem; isHighImpact: boolean }) => {
    const isAnalyzing = analyzingIds.has(item.id);
    const analysis = newsAnalysis[item.id];

    return (
      <Card className={`p-4 border-l-4 ${isHighImpact ? 'border-l-danger' : 'border-l-warning'}`}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                  isHighImpact 
                    ? 'bg-danger/20 text-danger border border-danger/30' 
                    : 'bg-warning/20 text-warning border border-warning/30'
                }`}>
                  {item.currency}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                  isHighImpact ? 'text-danger' : 'text-warning'
                }`}>
                  {isHighImpact ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                  {item.impact} Impact
                </span>
              </div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatDate(item.event_time)}</span>
                {item.forecast && <span>Forecast: {item.forecast}</span>}
                {item.previous && <span>Previous: {item.previous}</span>}
              </div>
            </div>
          </div>

          {isHighImpact && (
            <div className="pt-3 border-t border-border">
              {!analysis && !isAnalyzing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => analyzeNewsImpact(item)}
                  className="w-full"
                >
                  Get Trading Expectations
                </Button>
              )}
              {isAnalyzing && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing market impact...
                </div>
              )}
              {analysis && (
                <div className="bg-muted/50 rounded-md p-3 space-y-2">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Trading Expectations
                  </h4>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                    {analysis}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <ProfileCompletionGuard>
      <div className="min-h-screen bg-gradient-trading">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Forex News Calendar</h1>
                <p className="text-xs text-muted-foreground">Weekly economic events from Forex Factory</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="high" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="high" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              High Impact ({highImpactNews.length})
            </TabsTrigger>
            <TabsTrigger value="low" className="gap-2">
              <Calendar className="h-4 w-4" />
              Low Impact ({lowImpactNews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="high" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                <p className="text-muted-foreground">Loading high impact news...</p>
              </div>
            ) : highImpactNews.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No high impact news available for this week.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {highImpactNews.map((item) => (
                  <NewsCard key={item.id} item={item} isHighImpact={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="low" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                <p className="text-muted-foreground">Loading low impact news...</p>
              </div>
            ) : lowImpactNews.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No low impact news available for this week.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {lowImpactNews.map((item) => (
                  <NewsCard key={item.id} item={item} isHighImpact={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </ProfileCompletionGuard>
  );
};

export default News;
