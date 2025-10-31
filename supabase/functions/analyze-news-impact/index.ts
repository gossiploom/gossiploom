import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newsItem } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('Analyzing news impact for:', newsItem);

    const prompt = `You are a forex trading analyst. Analyze the following high-impact economic news and provide trading expectations:

Title: ${newsItem.title}
Currency: ${newsItem.currency}
Impact: ${newsItem.impact}
Forecast: ${newsItem.forecast || 'N/A'}
Previous: ${newsItem.previous || 'N/A'}
Event Time: ${newsItem.event_time}

Based on this economic indicator:
1. Analyze the expected market impact on the ${newsItem.currency} currency
2. Compare forecast vs previous values to determine sentiment
3. Identify the main currency pairs affected (e.g., EUR/USD, GBP/USD, USD/JPY)
4. Provide a concise trading recommendation (BUY/SELL) for each major pair involving ${newsItem.currency}

Keep your response under 150 words and structure it as:
- Brief analysis (2-3 sentences)
- Trading recommendations for 2-3 major pairs with clear BUY/SELL signals

Be direct and actionable.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate analysis');
    }

    const data = await response.json();
    const analysis = data.candidates[0].content.parts[0].text;

    console.log('Generated analysis:', analysis);

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-news-impact:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
