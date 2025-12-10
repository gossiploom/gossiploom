import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching USD to KES exchange rate...');

    // Using exchangerate-api.com (free tier: 1500 requests/month)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.statusText}`);
    }

    const data = await response.json();
    const kesRate = data.rates.KES;

    console.log(`Current USD to KES rate: ${kesRate}`);

    return new Response(
      JSON.stringify({ 
        rate: kesRate,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch exchange rate';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
