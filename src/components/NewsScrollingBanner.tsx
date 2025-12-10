import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

interface NewsItem {
  id: string;
  title: string;
  currency: string;
  impact: string;
  event_time: string;
  actual?: string;
  forecast?: string;
  previous?: string;
}

interface NewsScrollingBannerProps {
  position: "top" | "bottom";
  showNextDay?: boolean;
}

export const NewsScrollingBanner = ({ position, showNextDay = false }: NewsScrollingBannerProps) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
    
    // Fetch news every hour
    const interval = setInterval(fetchNews, 3600000);
    
    return () => clearInterval(interval);
  }, [showNextDay]);

  const fetchNews = async () => {
    try {
      const now = new Date();
      let startDate, endDate;

      if (showNextDay) {
        // Show next day's news or Monday's news if it's Friday
        const dayOfWeek = now.getDay();
        const daysToAdd = dayOfWeek === 5 ? 3 : 1; // If Friday (5), show Monday (3 days ahead)
        
        startDate = new Date(now);
        startDate.setDate(now.getDate() + daysToAdd);
        startDate = startOfDay(startDate);
        
        endDate = endOfDay(startDate);
      } else {
        // Show today's news
        startDate = startOfDay(now);
        endDate = endOfDay(now);
      }

      const { data, error } = await supabase
        .from('forex_news')
        .select('*')
        .gte('event_time', startDate.toISOString())
        .lte('event_time', endDate.toISOString())
        .in('impact', ['high', 'low'])
        .order('event_time', { ascending: true });

      if (error) throw error;

      // If we have less than 5 items, duplicate them for continuous scrolling
      let newsItems = data || [];
      if (newsItems.length > 0 && newsItems.length < 5) {
        newsItems = [...newsItems, ...newsItems, ...newsItems];
      }

      setNews(newsItems);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (eventTime: string) => {
    const eventDate = new Date(eventTime);
    return format(eventDate, 'HH:mm');
  };

  const isEventPassed = (eventTime: string) => {
    return isBefore(new Date(eventTime), new Date());
  };

  if (loading || news.length === 0) {
    return null;
  }

  const positionClasses = position === "top" 
    ? "top-0 border-b" 
    : "bottom-0 border-t";

  const bannerLabel = showNextDay ? "Tomorrow's News" : "Today's News";

  return (
    <div className={`fixed left-0 right-0 ${positionClasses} bg-card/95 backdrop-blur-sm z-50 overflow-hidden border-border`}>
      <div className="py-1 px-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-card-foreground">{bannerLabel}</span>
        </div>
        <div className="relative flex overflow-hidden">
          <div className="flex animate-scroll-slow gap-8 whitespace-nowrap">
            {news.map((item, index) => {
              const isPassed = isEventPassed(item.event_time);
              return (
                <div
                  key={`${item.id}-${index}`}
                  className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isPassed 
                      ? 'bg-muted text-muted-foreground' 
                      : item.impact === 'high' 
                        ? 'bg-destructive/20 text-foreground border border-destructive/40' 
                        : 'bg-primary/20 text-foreground border border-primary/40'
                  }`}
                >
                  <span className="font-mono text-sm font-semibold text-foreground">{formatEventTime(item.event_time)}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    item.impact === 'high' 
                      ? 'bg-destructive text-destructive-foreground' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {item.impact.toUpperCase()}
                  </span>
                  <span className="font-bold text-foreground">{item.currency}</span>
                  <span className="font-medium text-foreground">{item.title}</span>
                  {item.forecast && (
                    <span className="text-sm text-foreground/80">F: {item.forecast}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex animate-scroll-slow gap-8 whitespace-nowrap" aria-hidden="true">
            {news.map((item, index) => {
              const isPassed = isEventPassed(item.event_time);
              return (
                <div
                  key={`${item.id}-duplicate-${index}`}
                  className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isPassed 
                      ? 'bg-muted text-muted-foreground' 
                      : item.impact === 'high' 
                        ? 'bg-destructive/20 text-foreground border border-destructive/40' 
                        : 'bg-primary/20 text-foreground border border-primary/40'
                  }`}
                >
                  <span className="font-mono text-sm font-semibold text-foreground">{formatEventTime(item.event_time)}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    item.impact === 'high' 
                      ? 'bg-destructive text-destructive-foreground' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {item.impact.toUpperCase()}
                  </span>
                  <span className="font-bold text-foreground">{item.currency}</span>
                  <span className="font-medium text-foreground">{item.title}</span>
                  {item.forecast && (
                    <span className="text-sm text-foreground/80">F: {item.forecast}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};