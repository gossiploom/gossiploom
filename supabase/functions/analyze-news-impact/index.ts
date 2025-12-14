import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// The Supabase client import is removed as it's not used in this specific function.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use Deno.serve for the entry point
serve(async (req) => {
  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Parse the request body
    const { newsItem } = await req.json();

    if (!newsItem) {
      throw new Error('News item is required');
    }

    // 2. Get API Key
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }

    console.log('Analyzing news impact for:', newsItem.title);

    // 3. Construct the API payload
    const systemPrompt = 'You are a forex trading expert. Analyze economic news and provide clear, concise trading expectations. Keep responses under 150 words. Focus on likely market reactions and which currency pairs will be most affected.';

    const userPrompt = `Analyze this forex news event and provide trading expectations:

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
4. Key levels or volatility expectations`;

    const apiPayload = {
      // Use systemInstruction for the persona guidance
      systemInstruction: systemPrompt,
      // Use the contents structure for the prompt
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
    };

    // 4. Call Gemini AI to analyze the news impact
    // CRITICAL FIX: Use backticks (`) for template literal interpolation in the URL.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        // Removed Authorization header, as the key is in the query param
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    // 5. Check API response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    // Adjusting to read the text from the correct Gemini structure
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysis) {
      console.error('Gemini Response Data:', JSON.stringify(data, null, 2));
      throw new Error('No analysis generated from the AI model.');
    }

    console.log('Analysis generated successfully');

    // 6. Return success response
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
