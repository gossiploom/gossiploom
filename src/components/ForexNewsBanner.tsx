import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Calendar } from "lucide-react";

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

interface ForexNewsBannerProps {
  dateFilter?: "today" | "tomorrow";
}

export const ForexNewsBanner = ({ dateFilter = "today" }: ForexNewsBannerProps) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
    
    // Fetch news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    
    // Trigger initial fetch from edge function
    supabase.functions.invoke('fetch-forex-news').then(({ data, error }) => {
      if (error) console.error('Error triggering news fetch:', error);
      else console.log('News fetch triggered:', data);
    });

    return () => clearInterval(interval);
  }, [dateFilter]);

  const fetchNews = async () => {
    // Calculate date range based on filter
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
    let startDate: Date;
    let endDate: Date;

    if (dateFilter === "today") {
      // Get all news from start of today to end of today (including past events)
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else {
      // tomorrow or next working day (Monday if it's Friday)
      let daysToAdd = 1;
      if (dayOfWeek === 5) { // Friday
        daysToAdd = 3; // Skip to Monday
      }
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd + 1);
    }

    const { data, error } = await supabase
      .from('forex_news')
      .select('*')
      .gte('event_time', startDate.toISOString())
      .lt('event_time', endDate.toISOString())
      .order('event_time', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching news:', error);
      return;
    }

    setNews(data || []);
    setLoading(false);
  };

  const formatEventTime = (eventTime: string) => {
    const date = new Date(eventTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const isEventPassed = (eventTime: string) => {
    return new Date(eventTime) < new Date();
  };

  if (news.length === 0) return null;

  const now = new Date();
  const dayOfWeek = now.getDay();
  let dateLabel = dateFilter === "today" ? "Today" : "Tomorrow";
  if (dateFilter === "tomorrow" && dayOfWeek === 5) {
    dateLabel = "Monday";
  }
  
  const positionClasses = dateFilter === "today" ? "top-0 border-b" : "bottom-0 border-t";
  const bannerLabel = dateFilter === "today" ? "Today's News" : "Tomorrow's News";

  return (
    <div className={`fixed left-0 right-0 ${positionClasses} bg-card/95 backdrop-blur-sm z-50 overflow-hidden border-border`}>
      <div className="py-1.5 px-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-card-foreground">{bannerLabel}</span>
        </div>
        <div className="relative flex overflow-hidden">
          <div className="flex animate-scroll-slow gap-8 whitespace-nowrap">
            {news.map((item, index) => {
              const isPassed = isEventPassed(item.event_time);
              const impactLower = item.impact.toLowerCase();
              
              // Color coding based on impact level
              let impactBadgeClass = '';
              let containerClass = '';
              
              if (impactLower === 'high') {
                impactBadgeClass = 'bg-destructive text-destructive-foreground';
                containerClass = isPassed 
                  ? 'bg-muted text-muted-foreground' 
                  : 'bg-destructive/20 text-foreground border border-destructive/40';
              } else if (impactLower === 'medium') {
                impactBadgeClass = 'bg-[hsl(38_90%_50%)] text-white';
                containerClass = isPassed 
                  ? 'bg-muted text-muted-foreground' 
                  : 'bg-[hsl(38_90%_50%)]/20 text-foreground border border-[hsl(38_90%_50%)]/40';
              } else {
                impactBadgeClass = 'bg-primary text-primary-foreground';
                containerClass = isPassed 
                  ? 'bg-muted text-muted-foreground' 
                  : 'bg-primary/20 text-foreground border border-primary/40';
              }
              
              return (
                <div
                  key={`${item.id}-${index}`}
                  className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${containerClass}`}
                >
                  <span className="font-mono text-sm font-semibold text-foreground">{formatEventTime(item.event_time)}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${impactBadgeClass}`}>
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
              const impactLower = item.impact.toLowerCase();
              
              // Color coding based on impact level
              let impactBadgeClass = '';
              let containerClass = '';
              
              if (impactLower === 'high') {
                impactBadgeClass = 'bg-destructive text-destructive-foreground';
                containerClass = isPassed 
                  ? 'bg-muted text-muted-foreground' 
                  : 'bg-destructive/20 text-foreground border border-destructive/40';
              } else if (impactLower === 'medium') {
                impactBadgeClass = 'bg-[hsl(38_90%_50%)] text-white';
                containerClass = isPassed 
                  ? 'bg-muted text-muted-foreground' 
                  : 'bg-[hsl(38_90%_50%)]/20 text-foreground border border-[hsl(38_90%_50%)]/40';
              } else {
                impactBadgeClass = 'bg-primary text-primary-foreground';
                containerClass = isPassed 
                  ? 'bg-muted text-muted-foreground' 
                  : 'bg-primary/20 text-foreground border border-primary/40';
              }
              
              return (
                <div
                  key={`${item.id}-duplicate-${index}`}
                  className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${containerClass}`}
                >
                  <span className="font-mono text-sm font-semibold text-foreground">{formatEventTime(item.event_time)}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${impactBadgeClass}`}>
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
