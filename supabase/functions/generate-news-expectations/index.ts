import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newsId } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // Get the news item
    const { data: news, error: newsError } = await supabaseClient
      .from('forex_news')
      .select('*')
      .eq('id', newsId)
      .single();

    if (newsError || !news) {
      throw new Error('News item not found');
    }

    // Generate AI expectations using Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a forex market analyst. Provide concise trading expectations based on economic news.'
          },
          {
            role: 'user',
            content: `Analyze this forex news event: ${news.title} (${news.impact} impact) for ${news.currency}. 
            Forecast: ${news.forecast}, Previous: ${news.previous}.
            
            Provide:
            1. A brief expectation summary (2-3 sentences)
            2. Buy/Sell recommendations for 4 currency pairs involving ${news.currency}
            
            Format as JSON:
            {
              "summary": "...",
              "pairs": [
                {"pair": "EUR/USD", "recommendation": "BUY", "reasoning": "..."},
                ...
              ]
            }`
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to generate AI expectations');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const expectations = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      summary: 'Market expectation analysis pending.',
      pairs: []
    };

    // Store the expectations
    const { data: expectation, error: expectationError } = await supabaseClient
      .from('news_expectations')
      .upsert({
        news_id: newsId,
        expectation_summary: expectations.summary,
        currency_pairs: expectations.pairs
      })
      .select()
      .single();

    if (expectationError) {
      throw expectationError;
    }

    return new Response(
      JSON.stringify({ success: true, expectation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-news-expectations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});