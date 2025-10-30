import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  currency: string;
  impact: string;
  event_time: string;
}

export const ForexNewsBanner = () => {
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
  }, []);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from('forex_news')
      .select('*')
      .eq('impact', 'High')
      .gte('event_time', new Date().toISOString())
      .order('event_time', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error fetching news:', error);
      return;
    }

    setNews(data || []);
  };

  if (news.length === 0) return null;

  return (
    <div className="w-full bg-card border-t border-b border-primary/20 overflow-hidden py-3">
      <div className="flex items-center gap-2 px-4 mb-2">
        <AlertCircle className="h-4 w-4 text-danger flex-shrink-0" />
        <span className="text-sm font-semibold text-foreground">High Impact Forex News</span>
      </div>
      
      <div className="relative overflow-hidden">
        <div className="animate-scroll flex gap-8">
          {[...news, ...news].map((item, index) => (
            <div 
              key={`${item.id}-${index}`}
              className="flex items-center gap-3 whitespace-nowrap px-4"
            >
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-danger/20 text-danger border border-danger/30">
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