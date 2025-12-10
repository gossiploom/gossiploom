import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Fetching Forex Factory news...');
    // Fetch from ForexFactory calendar
    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.statusText}`);
    }
    const newsData = await response.json();
    console.log('Fetched news data:', newsData.length, 'items');
    // Filter for both high and low impact news
    const futureNews = newsData.filter((item: any)=>{
      const impact = (item.impact || '').toLowerCase();
      return (impact === 'high' || impact === 'low') && new Date(item.date) >= new Date();
    });
    console.log('Future news items (High and Low):', futureNews.length);
    // Clear old news (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await supabase.from('forex_news').delete().lt('event_time', sevenDaysAgo.toISOString());
    // Insert all future news (both high and low impact)
    const newsToInsert = futureNews.map((item: any)=>({
        title: item.title || '',
        currency: item.country || '',
        impact: (item.impact || 'high').toLowerCase(),
        forecast: item.forecast || null,
        previous: item.previous || null,
        event_time: new Date(item.date).toISOString()
      }));
    if (newsToInsert.length > 0) {
      // Delete old news first to avoid conflicts
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      await supabase.from('forex_news').delete().lte('event_time', sevenDaysFromNow.toISOString());
      
      // Use upsert to handle duplicates gracefully
      const { error: insertError } = await supabase.from('forex_news')
        .upsert(newsToInsert, {
          onConflict: 'title,event_time,currency',
          ignoreDuplicates: false
        });
      
      if (insertError) {
        console.error('Error inserting news:', insertError);
        throw insertError;
      }
      console.log('Successfully upserted', newsToInsert.length, 'news items');
    }
    return new Response(JSON.stringify({
      success: true,
      message: `Fetched and stored ${newsToInsert.length} news items`,
      count: newsToInsert.length
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in fetch-forex-news function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
