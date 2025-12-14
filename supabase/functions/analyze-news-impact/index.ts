import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newsItem } = await req.json();
    
    if (!newsItem) {
      throw new Error('News item is required');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('Analyzing news impact for:', newsItem.title);

    // Call Gemini 2.5 Flash directly (Lovable replaced)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `
You are a forex trading expert. Analyze economic news and provide clear, concise trading expectations.
Keep responses under 150 words. Focus on likely market reactions and which currency pairs will be most affected.

Analyze this forex news event and provide trading expectations:

Title: ${newsItem.title}
Currency: ${newsItem.currency}
Impact: ${newsItem.impact}
Forecast: ${newsItem.forecast || 'N/A'}
Previous: ${newsItem.previous || 'N/A'}
Time: ${new Date(newsItem.event_time).toLocaleString()}

Provide:
1. Expected market reaction
2. Which currency pairs to watch (at least four pairs)
3. Potential trading direction (bullish/bearish)
4. Key levels or volatility expectations
                  `.trim(),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    const analysis =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysis) {
      throw new Error('No analysis generated');
    }

    console.log('Analysis generated successfully');

    return new Response(
      JSON.stringify({ analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in analyze-news-impact:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
