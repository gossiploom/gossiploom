import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Calendar } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  currency: string;
  impact: string;
  event_time: string;
}

interface ForexNewsBannerProps {
  dateFilter?: "today" | "tomorrow";
  impactFilter?: "High" | "Low";
}

export const ForexNewsBanner = ({ dateFilter = "today", impactFilter = "High" }: ForexNewsBannerProps) => {
  const [news, setNews] = useState<NewsItem[]>([]);

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
  }, [dateFilter, impactFilter]);

  const fetchNews = async () => {
    // Calculate date range based on filter
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
    let startDate: Date;
    let endDate: Date;

    if (dateFilter === "today") {
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
      .eq('impact', impactFilter)
      .gte('event_time', startDate.toISOString())
      .lt('event_time', endDate.toISOString())
      .order('event_time', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error fetching news:', error);
      return;
    }

    setNews(data || []);
  };

  if (news.length === 0) return null;

  const now = new Date();
  const dayOfWeek = now.getDay();
  let dateLabel = dateFilter === "today" ? "Today" : "Tomorrow";
  if (dateFilter === "tomorrow" && dayOfWeek === 5) {
    dateLabel = "Monday";
  }
  
  const impactColor = impactFilter === "High" ? "text-danger" : "text-warning";
  const impactBg = impactFilter === "High" ? "bg-danger/20 border-danger/30" : "bg-warning/20 border-warning/30";

  // Repeat news items to ensure smooth scrolling even with few items
  const minRepetitions = Math.max(5, Math.ceil(10 / news.length));
  const repeatedNews = Array(minRepetitions).fill(news).flat();

  return (
    <div className="w-full bg-card border-t border-b border-primary/20 overflow-hidden py-3">
      <div className="flex items-center gap-2 px-4 mb-2">
        {impactFilter === "High" ? (
          <AlertCircle className={`h-4 w-4 ${impactColor} flex-shrink-0`} />
        ) : (
          <Calendar className={`h-4 w-4 ${impactColor} flex-shrink-0`} />
        )}
        <span className="text-sm font-semibold text-foreground">
          {impactFilter} Impact Forex News - {dateLabel}
        </span>
      </div>
      
      <div className="relative overflow-hidden">
        <div className="animate-scroll flex gap-8">
          {repeatedNews.map((item, index) => (
            <div 
              key={`${item.id}-${index}`}
              className="flex items-center gap-3 whitespace-nowrap px-4"
            >
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${impactBg} ${impactColor} border`}>
                {item.currency}
              </span>
              <span className="text-sm text-muted-foreground">
                {new Date(item.event_time).toLocaleString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  month: 'short',
                  day: 'numeric',
                  hour12: true
                })}
              </span>
              <span className="text-sm font-medium text-foreground">
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};