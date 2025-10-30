import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ForexNewsItem {
  title: string;
  currency: string;
  impact: string;
  forecast?: string;
  previous?: string;
  event_time: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching Forex Factory news...');

    // Fetch from ForexFactory calendar
    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.statusText}`);
    }

    const newsData = await response.json();
    console.log('Fetched news data:', newsData.length, 'items');

    // Filter for high impact news only
    const highImpactNews = newsData.filter((item: any) => 
      item.impact === 'High' && new Date(item.date) >= new Date()
    );

    console.log('High impact news items:', highImpactNews.length);

    // Clear old news (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await supabase
      .from('forex_news')
      .delete()
      .lt('event_time', sevenDaysAgo.toISOString());

    // Insert new high impact news
    const newsToInsert: ForexNewsItem[] = highImpactNews.map((item: any) => ({
      title: item.title || '',
      currency: item.country || '',
      impact: item.impact || 'High',
      forecast: item.forecast || null,
      previous: item.previous || null,
      event_time: new Date(item.date).toISOString(),
    }));

    if (newsToInsert.length > 0) {
      // Delete existing news for today to avoid duplicates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await supabase
        .from('forex_news')
        .delete()
        .gte('event_time', today.toISOString());

      const { error: insertError } = await supabase
        .from('forex_news')
        .insert(newsToInsert);

      if (insertError) {
        console.error('Error inserting news:', insertError);
        throw insertError;
      }

      console.log('Successfully inserted', newsToInsert.length, 'news items');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Fetched and stored ${newsToInsert.length} high impact news items`,
        count: newsToInsert.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in fetch-forex-news function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});